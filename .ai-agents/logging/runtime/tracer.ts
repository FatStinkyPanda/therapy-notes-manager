/**
 * Runtime Execution Tracer
 *
 * Core tracer that tracks execution context, captures spans,
 * and manages the complete call tree across async boundaries.
 */

import { AsyncLocalStorage } from 'async_hooks';
import * as fs from 'fs';
import * as path from 'path';

export interface ExecutionContext {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  function: string;
  file: string;
  lineNumber?: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  params?: any;
  returnValue?: any;
  error?: any;
  children: string[];
  checkpoints?: Checkpoint[];
  metadata?: Record<string, any>;
}

export interface Checkpoint {
  name: string;
  timestamp: number;
  variables?: Record<string, any>;
  lineNumber?: number;
}

export interface TraceConfig {
  enabled: boolean;
  level: number;
  captureParams: boolean;
  captureReturn: boolean;
  captureVars: boolean;
  captureAsync: boolean;
  maxDepth: number;
  maxCaptureSize: number;
  sampleRate: number;
}

export class ExecutionTracer {
  private static instance: ExecutionTracer;
  private asyncStorage: AsyncLocalStorage<ExecutionContext>;
  private spans: Map<string, ExecutionContext> = new Map();
  private config: TraceConfig;
  private spanIdCounter = 0;
  private fileConfigs: Map<string, TraceConfig> = new Map();
  private storePath: string;
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.asyncStorage = new AsyncLocalStorage();
    this.config = this.loadConfig();
    this.storePath = path.join(process.cwd(), '.ai-agents', 'logging', 'traces');
    this.ensureStorePath();
    this.startFlushTimer();
  }

  public static getInstance(): ExecutionTracer {
    if (!ExecutionTracer.instance) {
      ExecutionTracer.instance = new ExecutionTracer();
    }
    return ExecutionTracer.instance;
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): TraceConfig {
    return {
      enabled: process.env.TRACING_ENABLED !== 'false',
      level: parseInt(process.env.TRACING_DEFAULT_LEVEL || '2'),
      captureParams: process.env.TRACING_CAPTURE_PARAMS !== 'false',
      captureReturn: process.env.TRACING_CAPTURE_RETURN !== 'false',
      captureVars: process.env.TRACING_CAPTURE_VARS !== 'false',
      captureAsync: process.env.TRACING_CAPTURE_ASYNC !== 'false',
      maxDepth: parseInt(process.env.TRACING_MAX_DEPTH || '50'),
      maxCaptureSize: parseInt(process.env.TRACING_MAX_CAPTURE_SIZE || '10000'),
      sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '1.0')
    };
  }

  /**
   * Set configuration for specific file
   */
  public setFileConfig(file: string, config: Partial<TraceConfig>): void {
    const existing = this.fileConfigs.get(file) || { ...this.config };
    this.fileConfigs.set(file, { ...existing, ...config });
  }

  /**
   * Get configuration for file
   */
  private getConfigForFile(file: string): TraceConfig {
    return this.fileConfigs.get(file) || this.config;
  }

  /**
   * Check if should trace based on sampling
   */
  private shouldTrace(file: string): boolean {
    const config = this.getConfigForFile(file);
    if (!config.enabled || config.level === 0) return false;
    if (config.sampleRate >= 1.0) return true;
    return Math.random() < config.sampleRate;
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    return `span-${++this.spanIdCounter}-${Date.now()}`;
  }

  /**
   * Get or create trace ID
   */
  private getOrCreateTraceId(): string {
    const current = this.asyncStorage.getStore();
    if (current) return current.traceId;

    // Create new trace ID
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current context
   */
  private getCurrentContext(): ExecutionContext | undefined {
    return this.asyncStorage.getStore();
  }

  /**
   * Serialize value for capture
   */
  private serializeValue(value: any, maxSize: number): any {
    try {
      if (value === undefined) return undefined;
      if (value === null) return null;

      // Handle circular references
      const seen = new WeakSet();
      const serialized = JSON.stringify(value, (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular]';
          }
          seen.add(val);
        }
        return val;
      });

      // Check size
      if (serialized.length > maxSize) {
        return serialized.substring(0, maxSize) + '... [truncated]';
      }

      return JSON.parse(serialized);
    } catch (error) {
      return '[Unserializable]';
    }
  }

  /**
   * Start tracing a function
   */
  public startFunction(
    name: string,
    file: string,
    params?: any,
    lineNumber?: number
  ): ExecutionContext {
    if (!this.shouldTrace(file)) {
      // Return dummy context when not tracing
      return {} as ExecutionContext;
    }

    const config = this.getConfigForFile(file);
    const parent = this.getCurrentContext();

    // Check depth limit
    if (parent && this.getDepth(parent) >= config.maxDepth) {
      return {} as ExecutionContext;
    }

    const traceId = this.getOrCreateTraceId();
    const spanId = this.generateSpanId();

    const ctx: ExecutionContext = {
      traceId,
      spanId,
      parentSpanId: parent?.spanId || null,
      function: name,
      file,
      lineNumber,
      startTime: Date.now(),
      children: [],
      checkpoints: []
    };

    // Capture parameters if configured
    if (config.captureParams && params !== undefined) {
      ctx.params = this.serializeValue(params, config.maxCaptureSize);
    }

    // Store span
    this.spans.set(spanId, ctx);

    // Add to parent's children
    if (parent) {
      parent.children.push(spanId);
    }

    return ctx;
  }

  /**
   * End function tracing
   */
  public endFunction(ctx: ExecutionContext, returnValue?: any): any {
    if (!ctx.spanId) return returnValue; // Not tracing

    const config = this.getConfigForFile(ctx.file);

    ctx.endTime = Date.now();
    ctx.duration = ctx.endTime - ctx.startTime;

    // Capture return value if configured
    if (config.captureReturn && returnValue !== undefined) {
      ctx.returnValue = this.serializeValue(returnValue, config.maxCaptureSize);
    }

    // Update stored span
    this.spans.set(ctx.spanId, ctx);

    // Schedule flush if trace is complete (no parent)
    if (!ctx.parentSpanId) {
      this.scheduleFlush(ctx.traceId);
    }

    return returnValue;
  }

  /**
   * Record error in function
   */
  public errorFunction(ctx: ExecutionContext, error: Error): void {
    if (!ctx.spanId) return; // Not tracing

    ctx.endTime = Date.now();
    ctx.duration = ctx.endTime - ctx.startTime;
    ctx.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };

    this.spans.set(ctx.spanId, ctx);

    if (!ctx.parentSpanId) {
      this.scheduleFlush(ctx.traceId);
    }
  }

  /**
   * Record checkpoint (for level 4+)
   */
  public checkpoint(ctx: ExecutionContext, name: string, variables?: Record<string, any>): void {
    if (!ctx.spanId) return; // Not tracing

    const config = this.getConfigForFile(ctx.file);
    if (config.level < 4) return; // Checkpoints only at level 4+

    if (!ctx.checkpoints) {
      ctx.checkpoints = [];
    }

    const checkpoint: Checkpoint = {
      name,
      timestamp: Date.now()
    };

    if (config.captureVars && variables) {
      checkpoint.variables = this.serializeValue(variables, config.maxCaptureSize);
    }

    ctx.checkpoints.push(checkpoint);
    this.spans.set(ctx.spanId, ctx);
  }

  /**
   * Record line execution (for level 5)
   */
  public line(ctx: ExecutionContext, lineNumber: number): void {
    if (!ctx.spanId) return; // Not tracing

    const config = this.getConfigForFile(ctx.file);
    if (config.level < 5) return; // Line tracking only at level 5

    this.checkpoint(ctx, `line-${lineNumber}`, { lineNumber });
  }

  /**
   * Record variable value (for level 4+)
   */
  public var(ctx: ExecutionContext, name: string, value: any): void {
    if (!ctx.spanId) return; // Not tracing

    const config = this.getConfigForFile(ctx.file);
    if (config.level < 4) return;

    this.checkpoint(ctx, `var-${name}`, { [name]: value });
  }

  /**
   * Wrap synchronous function call (for level 3+)
   */
  public wrap<T>(fn: () => T, name: string, parent: ExecutionContext): T {
    if (!parent.spanId) return fn(); // Not tracing

    const config = this.getConfigForFile(parent.file);
    if (config.level < 3) return fn(); // Wrapping only at level 3+

    return this.asyncStorage.run(parent, () => {
      const ctx = this.startFunction(name, parent.file);
      try {
        const result = fn();
        this.endFunction(ctx, result);
        return result;
      } catch (error) {
        this.errorFunction(ctx, error as Error);
        throw error;
      }
    });
  }

  /**
   * Wrap async function call (for level 3+)
   */
  public async wrapAsync<T>(
    promise: Promise<T>,
    name: string,
    parent: ExecutionContext
  ): Promise<T> {
    if (!parent.spanId) return promise; // Not tracing

    const config = this.getConfigForFile(parent.file);
    if (config.level < 3) return promise; // Wrapping only at level 3+

    const ctx = this.startFunction(name, parent.file);

    try {
      const result = await promise;
      this.endFunction(ctx, result);
      return result;
    } catch (error) {
      this.errorFunction(ctx, error as Error);
      throw error;
    }
  }

  /**
   * Run function with context
   */
  public run<T>(ctx: ExecutionContext, fn: () => T): T {
    return this.asyncStorage.run(ctx, fn);
  }

  /**
   * Get depth of context
   */
  private getDepth(ctx: ExecutionContext): number {
    let depth = 0;
    let current: ExecutionContext | undefined = ctx;

    while (current?.parentSpanId) {
      depth++;
      current = this.spans.get(current.parentSpanId);
    }

    return depth;
  }

  /**
   * Get complete trace
   */
  public getTrace(traceId: string): ExecutionContext[] {
    const spans: ExecutionContext[] = [];

    for (const span of this.spans.values()) {
      if (span.traceId === traceId) {
        spans.push(span);
      }
    }

    return spans;
  }

  /**
   * Get trace tree (root span with nested children)
   */
  public getTraceTree(traceId: string): ExecutionContext | null {
    const spans = this.getTrace(traceId);
    if (spans.length === 0) return null;

    // Find root span
    const root = spans.find(s => !s.parentSpanId);
    if (!root) return null;

    // Build tree recursively
    const buildTree = (span: ExecutionContext): ExecutionContext => {
      const children = spans.filter(s => s.parentSpanId === span.spanId);
      return {
        ...span,
        children: children.map(c => c.spanId) // Keep as IDs for now
      };
    };

    return buildTree(root);
  }

  /**
   * Ensure storage path exists
   */
  private ensureStorePath(): void {
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  /**
   * Schedule trace flush
   */
  private scheduleFlush(traceId: string): void {
    // Flush immediately for now
    // In production, could batch flushes
    this.flushTrace(traceId);
  }

  /**
   * Flush trace to disk
   */
  private flushTrace(traceId: string): void {
    const spans = this.getTrace(traceId);
    if (spans.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `trace-${traceId}-${timestamp}.json`;
    const filepath = path.join(this.storePath, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(spans, null, 2));

      // Remove from memory
      for (const span of spans) {
        this.spans.delete(span.spanId);
      }
    } catch (error) {
      console.error('[Tracer] Failed to flush trace:', error);
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    const interval = parseInt(process.env.TRACING_FLUSH_INTERVAL || '5000');

    this.flushTimer = setInterval(() => {
      this.flushAll();
    }, interval);
  }

  /**
   * Flush all traces
   */
  public flushAll(): void {
    const traceIds = new Set<string>();

    for (const span of this.spans.values()) {
      traceIds.add(span.traceId);
    }

    for (const traceId of traceIds) {
      this.flushTrace(traceId);
    }
  }

  /**
   * Shutdown tracer
   */
  public shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.flushAll();
  }
}

// Export singleton instance
export const __tracer = ExecutionTracer.getInstance();

// Graceful shutdown
process.on('SIGINT', () => __tracer.shutdown());
process.on('SIGTERM', () => __tracer.shutdown());
