/**
 * Logging + Tracing API Server
 *
 * Comprehensive REST API for both logging and runtime tracing systems.
 * Provides endpoints for configuration, instrumentation, search, and analysis.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptInstrumenter, InstrumentOptions } from '../runtime/adapters/typescript.adapter';
import { Logger } from '../core/logger';
import { __tracer, ExecutionContext } from '../runtime/tracer';

const app = express();
const logger = Logger.getInstance('api/server.ts');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Instrumenters
const tsInstrumenter = new TypeScriptInstrumenter();

// Helper to load env config
function loadEnvConfig(envFile: string): Record<string, string> {
  const envPath = path.join(process.cwd(), '.ai-agents', 'logging', 'config', envFile);
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const config: Record<string, string> = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      config[key.trim()] = valueParts.join('=').trim();
    }
  });

  return config;
}

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ ok: true, service: 'logging-tracing-api', version: '1.0.0' });
});

app.get('/api/status', (req: Request, res: Response) => {
  const loggingConfig = loadEnvConfig('.env.logging');
  const tracingConfig = loadEnvConfig('.env.tracing');

  res.json({
    logging: {
      enabled: loggingConfig.LOGGING_ENABLED !== 'false',
      port: loggingConfig.LOGGING_API_PORT || '8082'
    },
    tracing: {
      enabled: tracingConfig.TRACING_ENABLED !== 'false',
      port: tracingConfig.TRACING_API_PORT || '8083',
      defaultLevel: parseInt(tracingConfig.TRACING_DEFAULT_LEVEL || '2'),
      autoInstrument: tracingConfig.TRACING_AUTO_INSTRUMENT === 'true'
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodejs: process.version
    }
  });
});

// ============================================================================
// LOGGING ENDPOINTS
// ============================================================================

app.post('/api/log', (req: Request, res: Response) => {
  try {
    const { level, category, source, message, context } = req.body;

    if (!level || !category || !source || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const loggerInstance = Logger.getInstance(source);
    (loggerInstance as any)[level](message, context);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/log/batch', (req: Request, res: Response) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries must be an array' });
    }

    entries.forEach(entry => {
      const { level, category, source, message, context } = entry;
      const loggerInstance = Logger.getInstance(source);
      (loggerInstance as any)[level](message, context);
    });

    res.json({ success: true, count: entries.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/log/latest', (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'main';
    const limit = parseInt((req.query.limit as string) || '100');

    const logPath = path.join(process.cwd(), '.ai-agents', 'logging', 'logs', 'latest', `${category}.latest.log`);

    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [] });
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    const logs = lines.slice(-limit).map(line => JSON.parse(line));

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TRACING CONFIGURATION ENDPOINTS
// ============================================================================

app.get('/api/tracing/config', (req: Request, res: Response) => {
  const config = loadEnvConfig('.env.tracing');
  res.json(config);
});

app.put('/api/tracing/config/file', (req: Request, res: Response) => {
  try {
    const { file, level, enabled, captureParams, captureReturn, captureAsync } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }

    __tracer.setFileConfig(file, {
      enabled: enabled ?? true,
      level: level ?? 2,
      captureParams: captureParams ?? true,
      captureReturn: captureReturn ?? true,
      captureVars: false,
      captureAsync: captureAsync ?? true,
      maxDepth: 50,
      maxCaptureSize: 10000,
      sampleRate: 1.0
    });

    res.json({ success: true, file, level });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tracing/config/global', (req: Request, res: Response) => {
  try {
    const { enabled, defaultLevel } = req.body;

    // Update env file (this would need human approval in production)
    const envPath = path.join(process.cwd(), '.ai-agents', 'logging', 'config', '.env.tracing');
    let content = fs.readFileSync(envPath, 'utf-8');

    if (enabled !== undefined) {
      content = content.replace(/TRACING_ENABLED=.*/g, `TRACING_ENABLED=${enabled}`);
    }

    if (defaultLevel !== undefined) {
      content = content.replace(/TRACING_DEFAULT_LEVEL=.*/g, `TRACING_DEFAULT_LEVEL=${defaultLevel}`);
    }

    // Note: In production, this should require human approval
    // For now, we just return the configuration
    res.json({ success: true, note: 'Configuration changes require human approval' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INSTRUMENTATION ENDPOINTS
// ============================================================================

app.post('/api/tracing/instrument/file', async (req: Request, res: Response) => {
  try {
    const { file, level, force, functions, excludeFunctions } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const options: InstrumentOptions = {
      level: level ?? 2,
      captureParams: true,
      captureReturn: true,
      captureVars: level >= 4,
      captureAsync: true,
      functions,
      excludeFunctions
    };

    const result = await tsInstrumenter.instrumentFile(filePath, options);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tracing/instrument/function', async (req: Request, res: Response) => {
  try {
    const { file, functions, level } = req.body;

    if (!file || !functions || !Array.isArray(functions)) {
      return res.status(400).json({ error: 'file and functions array are required' });
    }

    const filePath = path.join(process.cwd(), file);

    const options: InstrumentOptions = {
      level: level ?? 3,
      captureParams: true,
      captureReturn: true,
      captureVars: level >= 4,
      captureAsync: true,
      functions // Only instrument these specific functions
    };

    const result = await tsInstrumenter.instrumentFile(filePath, options);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tracing/instrument/all', async (req: Request, res: Response) => {
  try {
    const { level, exclude, languages } = req.body;

    const excludePatterns = exclude || ['*.test.ts', '*.spec.ts', 'node_modules/**'];
    const supportedLanguages = languages || ['typescript', 'javascript'];

    // Find all source files
    const glob = require('glob');
    const patterns = {
      typescript: 'src/**/*.ts',
      javascript: 'src/**/*.js',
      python: 'src/**/*.py'
    };

    const results: any[] = [];

    for (const lang of supportedLanguages) {
      const pattern = patterns[lang as keyof typeof patterns];
      if (!pattern) continue;

      const files = glob.sync(pattern, {
        ignore: excludePatterns,
        cwd: process.cwd()
      });

      for (const file of files) {
        const result = await tsInstrumenter.instrumentFile(
          path.join(process.cwd(), file),
          {
            level: level ?? 2,
            captureParams: true,
            captureReturn: true,
            captureVars: false,
            captureAsync: true
          }
        );

        results.push({
          file,
          ...result
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalWrapped = results.reduce((sum, r) => sum + (r.functionsWrapped || 0), 0);

    res.json({
      success: true,
      filesInstrumented: successful,
      filesFailed: failed,
      totalFunctionsWrapped: totalWrapped,
      details: results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tracing/uninstrument/file', async (req: Request, res: Response) => {
  try {
    const { file, restore } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const filePath = path.join(process.cwd(), file);
    const success = await tsInstrumenter.uninstrumentFile(filePath, restore ?? true);

    res.json({ success, file });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tracing/uninstrument/all', async (req: Request, res: Response) => {
  try {
    const { restore } = req.body;

    // Find all instrumented files
    const glob = require('glob');
    const files = glob.sync('src/**/*.{ts,js}', {
      cwd: process.cwd()
    });

    let uninstrumented = 0;

    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (content.includes('__tracer')) {
        const success = await tsInstrumenter.uninstrumentFile(filePath, restore ?? true);
        if (success) uninstrumented++;
      }
    }

    res.json({
      success: true,
      filesUninstrumented: uninstrumented
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SEARCH & QUERY ENDPOINTS
// ============================================================================

app.get('/api/tracing/search', (req: Request, res: Response) => {
  try {
    const { query, file, minDuration, maxDuration, hasError, limit } = req.query;

    // Convert query parameters to correct types
    const queryStr = typeof query === 'string' ? query : undefined;
    const fileStr = typeof file === 'string' ? file : undefined;

    const tracesPath = path.join(process.cwd(), '.ai-agents', 'logging', 'traces');

    if (!fs.existsSync(tracesPath)) {
      return res.json({ traces: [] });
    }

    const traceFiles = fs.readdirSync(tracesPath).filter(f => f.endsWith('.json'));
    let traces: any[] = [];

    for (const traceFile of traceFiles) {
      const content = fs.readFileSync(path.join(tracesPath, traceFile), 'utf-8');
      const traceSpans = JSON.parse(content);
      traces.push(...traceSpans);
    }

    // Apply filters
    if (queryStr) {
      traces = traces.filter(t =>
        t.function.includes(queryStr) ||
        t.file.includes(queryStr) ||
        JSON.stringify(t.params).includes(queryStr)
      );
    }

    if (fileStr) {
      traces = traces.filter(t => t.file === fileStr || t.file.includes(fileStr));
    }

    if (minDuration) {
      traces = traces.filter(t => t.duration && t.duration >= parseInt(minDuration as string));
    }

    if (maxDuration) {
      traces = traces.filter(t => t.duration && t.duration <= parseInt(maxDuration as string));
    }

    if (hasError === 'true') {
      traces = traces.filter(t => t.error);
    }

    // Limit results
    const limitNum = limit ? parseInt(limit as string) : 100;
    traces = traces.slice(0, limitNum);

    res.json({ traces, count: traces.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tracing/trace/:traceId', (req: Request, res: Response) => {
  try {
    const { traceId } = req.params;
    const tree = __tracer.getTraceTree(traceId);

    if (!tree) {
      return res.status(404).json({ error: 'Trace not found' });
    }

    res.json({ trace: tree });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tracing/slow', (req: Request, res: Response) => {
  try {
    const threshold = parseInt((req.query.threshold as string) || '1000');
    const limit = parseInt((req.query.limit as string) || '50');

    const tracesPath = path.join(process.cwd(), '.ai-agents', 'logging', 'traces');
    const traceFiles = fs.readdirSync(tracesPath).filter(f => f.endsWith('.json'));

    let slowTraces: any[] = [];

    for (const traceFile of traceFiles) {
      const content = fs.readFileSync(path.join(tracesPath, traceFile), 'utf-8');
      const traceSpans = JSON.parse(content);

      const slow = traceSpans.filter((t: any) => t.duration && t.duration >= threshold);
      slowTraces.push(...slow);
    }

    // Sort by duration descending
    slowTraces.sort((a, b) => (b.duration || 0) - (a.duration || 0));

    res.json({
      traces: slowTraces.slice(0, limit),
      count: slowTraces.length,
      threshold
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tracing/errors', (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '100');

    const tracesPath = path.join(process.cwd(), '.ai-agents', 'logging', 'traces');
    const traceFiles = fs.readdirSync(tracesPath).filter(f => f.endsWith('.json'));

    let errorTraces: any[] = [];

    for (const traceFile of traceFiles) {
      const content = fs.readFileSync(path.join(tracesPath, traceFile), 'utf-8');
      const traceSpans = JSON.parse(content);

      const errors = traceSpans.filter((t: any) => t.error);
      errorTraces.push(...errors);
    }

    res.json({
      traces: errorTraces.slice(0, limit),
      count: errorTraces.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATISTICS & ANALYSIS ENDPOINTS
// ============================================================================

app.get('/api/tracing/stats/file/:file(*)', (req: Request, res: Response) => {
  try {
    const file = req.params.file;

    const tracesPath = path.join(process.cwd(), '.ai-agents', 'logging', 'traces');
    const traceFiles = fs.readdirSync(tracesPath).filter(f => f.endsWith('.json'));

    let fileTraces: any[] = [];

    for (const traceFile of traceFiles) {
      const content = fs.readFileSync(path.join(tracesPath, traceFile), 'utf-8');
      const traceSpans = JSON.parse(content);

      const matching = traceSpans.filter((t: any) => t.file === file || t.file.includes(file));
      fileTraces.push(...matching);
    }

    if (fileTraces.length === 0) {
      return res.json({ error: 'No traces found for file', file });
    }

    const durations = fileTraces.map(t => t.duration || 0).sort((a, b) => a - b);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const errorCount = fileTraces.filter(t => t.error).length;

    res.json({
      file,
      callCount: fileTraces.length,
      avgDuration: Math.round(avgDuration),
      maxDuration: durations[durations.length - 1],
      minDuration: durations[0],
      errorCount,
      errorRate: errorCount / fileTraces.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tracing/hotspots', (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '20');

    const tracesPath = path.join(process.cwd(), '.ai-agents', 'logging', 'traces');
    const traceFiles = fs.readdirSync(tracesPath).filter(f => f.endsWith('.json'));

    const functionStats: Map<string, any> = new Map();

    for (const traceFile of traceFiles) {
      const content = fs.readFileSync(path.join(tracesPath, traceFile), 'utf-8');
      const traceSpans = JSON.parse(content);

      for (const span of traceSpans) {
        const key = `${span.file}:${span.function}`;

        if (!functionStats.has(key)) {
          functionStats.set(key, {
            function: span.function,
            file: span.file,
            totalTime: 0,
            callCount: 0,
            durations: []
          });
        }

        const stats = functionStats.get(key);
        stats.totalTime += span.duration || 0;
        stats.callCount++;
        stats.durations.push(span.duration || 0);
      }
    }

    const hotspots = Array.from(functionStats.values())
      .map(stats => ({
        ...stats,
        avgDuration: stats.totalTime / stats.callCount,
        durations: undefined
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);

    res.json({ hotspots });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FILE MANAGEMENT ENDPOINTS
// ============================================================================

app.get('/api/files', (req: Request, res: Response) => {
  try {
    const glob = require('glob');
    const files = glob.sync('src/**/*.{ts,js,py}', {
      ignore: ['node_modules/**', '*.test.*', '*.spec.*'],
      cwd: process.cwd()
    });

    const fileList = files.map((file: string) => {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const instrumented = content.includes('__tracer');
      const functions = tsInstrumenter.getFunctionsInFile(filePath);

      return {
        file,
        instrumented,
        functionCount: functions.length,
        functions
      };
    });

    res.json({ files: fileList, count: fileList.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/integrated', (req: Request, res: Response) => {
  try {
    const glob = require('glob');
    const files = glob.sync('src/**/*.{ts,js,py}', {
      ignore: ['node_modules/**'],
      cwd: process.cwd()
    });

    const integrated = files.filter((file: string) => {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.includes('__tracer');
    });

    res.json({ files: integrated, count: integrated.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/missing', (req: Request, res: Response) => {
  try {
    const glob = require('glob');
    const files = glob.sync('src/**/*.{ts,js,py}', {
      ignore: ['node_modules/**', '*.test.*', '*.spec.*'],
      cwd: process.cwd()
    });

    const missing = files.filter((file: string) => {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return !content.includes('__tracer');
    });

    res.json({ files: missing, count: missing.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = parseInt(process.env.TRACING_API_PORT || '8083');

app.listen(PORT, () => {
  logger.info(`Logging + Tracing API server started`, { port: PORT });
  console.log(`\n✅ Logging + Tracing API server running on http://localhost:${PORT}`);
  console.log(`\n📖 API Documentation:`);
  console.log(`   Health: GET http://localhost:${PORT}/api/health`);
  console.log(`   Status: GET http://localhost:${PORT}/api/status`);
  console.log(`   Instrument: POST http://localhost:${PORT}/api/tracing/instrument/file`);
  console.log(`   Search: GET http://localhost:${PORT}/api/tracing/search`);
  console.log(``);
});

export default app;
