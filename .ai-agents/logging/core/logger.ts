/**
 * Core Logger - Autonomous Logging System
 *
 * Provides comprehensive logging with automatic rotation, archival,
 * and deep integration with OpenMemory + ai-agents system.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogCategory = 'main' | 'error' | 'ai-agent' | 'api' | 'debug' | 'system' | 'performance';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  source: string;
  message: string;
  context?: Record<string, any>;
  agent?: string;
  sessionId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  stackTrace?: string;
}

export interface LoggerOptions {
  source: string;
  category?: LogCategory;
  sessionId?: string;
  agent?: string;
  autoFlush?: boolean;
  bufferSize?: number;
}

export interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  categories: Record<LogCategory, LogLevel[]>;
  bufferSizeKB: number;
  flushIntervalMS: number;
  asyncEnabled: boolean;
  sanitizeSensitive: boolean;
  logDir: string;
}

/**
 * Main Logger Class
 * Singleton pattern with per-source instances
 */
export class Logger extends EventEmitter {
  private static instances: Map<string, Logger> = new Map();
  private static config: LoggerConfig | null = null;
  private static writeQueue: LogEntry[] = [];
  private static flushTimer: NodeJS.Timeout | null = null;

  private source: string;
  private category: LogCategory;
  private sessionId?: string;
  private agent?: string;
  private autoFlush: boolean;
  private buffer: LogEntry[] = [];
  private timers: Map<string, number> = new Map();

  private constructor(options: LoggerOptions) {
    super();
    this.source = options.source;
    this.category = options.category || 'main';
    this.sessionId = options.sessionId;
    this.agent = options.agent || 'unknown';
    this.autoFlush = options.autoFlush ?? true;
  }

  /**
   * Get logger instance for a specific source file
   */
  public static getInstance(source: string, options?: Partial<LoggerOptions>): Logger {
    if (!Logger.instances.has(source)) {
      Logger.instances.set(source, new Logger({
        source,
        ...options
      }));
    }
    return Logger.instances.get(source)!;
  }

  /**
   * Load configuration from environment and config files
   */
  public static async loadConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), '.ai-agents', 'logging', 'config', 'logging.config.json');
    const envPath = path.join(process.cwd(), '.ai-agents', 'logging', 'config', '.env.logging');

    // Load environment variables
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const envVars = Logger.parseEnvFile(envContent);

      // Apply to process.env
      Object.entries(envVars).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
    }

    // Load JSON config
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      Logger.config = {
        enabled: process.env.LOGGING_ENABLED === 'true',
        minLevel: (process.env.LOGGING_MIN_LEVEL as LogLevel) || 'info',
        categories: config.logLevels || {},
        bufferSizeKB: parseInt(process.env.LOGGING_BUFFER_SIZE_KB || '64'),
        flushIntervalMS: parseInt(process.env.LOGGING_FLUSH_INTERVAL_MS || '1000'),
        asyncEnabled: process.env.LOGGING_ASYNC_ENABLED !== 'false',
        sanitizeSensitive: process.env.LOGGING_SANITIZE_SENSITIVE !== 'false',
        logDir: path.join(process.cwd(), '.ai-agents', 'logging', 'logs')
      };
    } else {
      // Default config
      Logger.config = {
        enabled: true,
        minLevel: 'info',
        categories: {
          main: ['info', 'warn', 'error', 'fatal'],
          error: ['error', 'fatal'],
          'ai-agent': ['info', 'warn', 'error', 'debug'],
          api: ['info', 'error'],
          debug: ['debug', 'trace'],
          system: ['info', 'warn', 'error'],
          performance: ['info', 'warn']
        },
        bufferSizeKB: 64,
        flushIntervalMS: 1000,
        asyncEnabled: true,
        sanitizeSensitive: true,
        logDir: path.join(process.cwd(), '.ai-agents', 'logging', 'logs')
      };
    }

    // Start flush timer if async enabled
    if (Logger.config.asyncEnabled) {
      Logger.startFlushTimer();
    }
  }

  /**
   * Parse .env file format
   */
  private static parseEnvFile(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        result[key.trim()] = valueParts.join('=').trim();
      }
    }

    return result;
  }

  /**
   * Start automatic flush timer
   */
  private static startFlushTimer(): void {
    if (Logger.flushTimer) {
      clearInterval(Logger.flushTimer);
    }

    Logger.flushTimer = setInterval(() => {
      Logger.flushAll();
    }, Logger.config?.flushIntervalMS || 1000);
  }

  /**
   * Flush all buffered logs to disk
   */
  public static async flushAll(): Promise<void> {
    if (Logger.writeQueue.length === 0) return;

    const entriesToWrite = [...Logger.writeQueue];
    Logger.writeQueue = [];

    // Group by category for efficient writes
    const byCategory = new Map<LogCategory, LogEntry[]>();

    for (const entry of entriesToWrite) {
      if (!byCategory.has(entry.category)) {
        byCategory.set(entry.category, []);
      }
      byCategory.get(entry.category)!.push(entry);
    }

    // Write to each category file
    for (const [category, entries] of byCategory) {
      await Logger.writeToFile(category, entries);
    }
  }

  /**
   * Write log entries to file
   */
  private static async writeToFile(category: LogCategory, entries: LogEntry[]): Promise<void> {
    if (!Logger.config) return;

    const logDir = path.join(Logger.config.logDir, 'latest');
    const logFile = path.join(logDir, `${category}.latest.log`);

    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Format entries as JSON lines
    const lines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';

    // Write to file
    if (Logger.config.asyncEnabled) {
      fs.appendFile(logFile, lines, (err) => {
        if (err) {
          console.error(`[Logging] Failed to write to ${logFile}:`, err);
        }
      });
    } else {
      try {
        fs.appendFileSync(logFile, lines);
      } catch (err) {
        console.error(`[Logging] Failed to write to ${logFile}:`, err);
      }
    }

    // Check if rotation needed
    Logger.checkRotation(category, logFile);
  }

  /**
   * Check if log file needs rotation
   */
  private static checkRotation(category: LogCategory, logFile: string): void {
    if (!fs.existsSync(logFile)) return;

    const stats = fs.statSync(logFile);
    const sizeMB = stats.size / (1024 * 1024);
    const maxSizeMB = parseInt(process.env.LOGGING_MAX_FILE_SIZE_MB || '100');

    if (sizeMB >= maxSizeMB) {
      Logger.rotateLog(category, logFile);
    }
  }

  /**
   * Rotate log file to archive
   */
  private static rotateLog(category: LogCategory, logFile: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('-').slice(0, -5);
    const archiveDir = path.join(path.dirname(path.dirname(logFile)), 'archive', timestamp);
    const archiveFile = path.join(archiveDir, `${category}.${timestamp}.log`);

    // Create archive directory
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Move current log to archive
    try {
      fs.renameSync(logFile, archiveFile);
      console.log(`[Logging] Rotated ${category} log to archive: ${archiveFile}`);

      // Compress if enabled
      if (process.env.LOGGING_COMPRESS_ARCHIVES === 'true') {
        Logger.compressLog(archiveFile);
      }
    } catch (err) {
      console.error(`[Logging] Failed to rotate log:`, err);
    }
  }

  /**
   * Compress archived log file
   */
  private static compressLog(logFile: string): void {
    // TODO: Implement compression using zlib
    // For now, this is a placeholder
  }

  /**
   * Log a trace message
   */
  public trace(message: string, context?: Record<string, any>): void {
    this.log('trace', message, context);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, contextOrError?: Record<string, any> | Error): void {
    const context = contextOrError instanceof Error
      ? { error: contextOrError.message, stack: contextOrError.stack }
      : contextOrError;

    this.log('error', message, context);
  }

  /**
   * Log a fatal error message
   */
  public fatal(message: string, contextOrError?: Record<string, any> | Error): void {
    const context = contextOrError instanceof Error
      ? { error: contextOrError.message, stack: contextOrError.stack }
      : contextOrError;

    this.log('fatal', message, context);
  }

  /**
   * Start a performance timer
   */
  public startTimer(label?: string): { done: (meta?: Record<string, any>) => void } {
    const timerLabel = label || `timer_${Date.now()}`;
    const startTime = Date.now();
    this.timers.set(timerLabel, startTime);

    return {
      done: (meta?: Record<string, any>) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.timers.delete(timerLabel);

        this.log('info', `Timer: ${timerLabel}`, {
          duration,
          ...meta
        });
      }
    };
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!Logger.config || !Logger.config.enabled) return;

    // Check if level is allowed for this category
    const allowedLevels = Logger.config.categories[this.category];
    if (allowedLevels && !allowedLevels.includes(level)) return;

    // Sanitize sensitive data if enabled
    const sanitizedContext = Logger.config.sanitizeSensitive && context
      ? Logger.sanitizeContext(context)
      : context;

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      source: this.source,
      message,
      context: sanitizedContext,
      agent: this.agent,
      sessionId: this.sessionId
    };

    // Add to write queue
    Logger.writeQueue.push(entry);

    // Immediate flush if not async or buffer full
    if (!Logger.config.asyncEnabled || this.autoFlush) {
      Logger.flushAll();
    }

    // Emit event for listeners
    this.emit('log', entry);
  }

  /**
   * Sanitize sensitive data from context
   */
  private static sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'apikey', 'api_key', 'secret', 'auth', 'authorization'];
    const sanitized = { ...context };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Shutdown logger and flush remaining logs
   */
  public static async shutdown(): Promise<void> {
    if (Logger.flushTimer) {
      clearInterval(Logger.flushTimer);
      Logger.flushTimer = null;
    }

    await Logger.flushAll();
    Logger.instances.clear();
  }
}

// Auto-load configuration on module import
Logger.loadConfig().catch(err => {
  console.error('[Logging] Failed to load configuration:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await Logger.shutdown();
});

process.on('SIGTERM', async () => {
  await Logger.shutdown();
});
