# Runtime Execution Tracing System - Architecture

## Overview

A comprehensive runtime execution tracing and instrumentation system that automatically captures and logs the complete execution flow of running code across all project files and languages.

## Core Concept

Instead of manually adding `logger.info()` calls, this system **automatically instruments your code** to capture:

- Every function call with parameters
- Every return value
- Execution time for each function
- Complete call hierarchy (parent → child relationships)
- Async operation tracking
- Error propagation and stack traces
- Database queries and external API calls
- Variable state at key points
- Cross-file execution flow
- Request/response lifecycle

## System Components

### 1. Code Instrumentation Engine

Automatically wraps functions with tracing code using AST (Abstract Syntax Tree) manipulation.

#### Input (Original Code):
```typescript
// src/users.ts
export async function getUser(userId: number) {
  const user = await database.query('SELECT * FROM users WHERE id = ?', [userId]);
  return user;
}
```

#### Output (Instrumented Code):
```typescript
// src/users.ts
import { __tracer } from './.ai-agents/logging/runtime/tracer';

export async function getUser(userId: number) {
  const __ctx = __tracer.startFunction('getUser', 'src/users.ts', { userId });
  try {
    const user = await __tracer.wrapAsync(
      database.query('SELECT * FROM users WHERE id = ?', [userId]),
      'database.query',
      __ctx
    );
    __tracer.endFunction(__ctx, user);
    return user;
  } catch (error) {
    __tracer.errorFunction(__ctx, error);
    throw error;
  }
}
```

#### Generated Trace Output:
```json
{
  "traceId": "req-abc-123",
  "spanId": "span-001",
  "parentSpanId": null,
  "function": "getUser",
  "file": "src/users.ts",
  "startTime": "2025-01-15T14:30:25.107Z",
  "endTime": "2025-01-15T14:30:25.160Z",
  "duration": 53,
  "params": { "userId": 123 },
  "returnValue": { "id": 123, "name": "John" },
  "children": [
    {
      "spanId": "span-002",
      "parentSpanId": "span-001",
      "function": "database.query",
      "startTime": "2025-01-15T14:30:25.108Z",
      "endTime": "2025-01-15T14:30:25.153Z",
      "duration": 45,
      "params": ["SELECT * FROM users WHERE id = ?", [123]],
      "returnValue": { "id": 123, "name": "John" }
    }
  ]
}
```

### 2. Multi-Language Instrumentation

Each language has its own instrumentation adapter:

#### JavaScript/TypeScript (Babel/TypeScript Compiler)
```typescript
// .ai-agents/logging/runtime/adapters/typescript.adapter.ts
class TypeScriptInstrumenter {
  async instrumentFile(filePath: string, options: InstrumentOptions): Promise<void> {
    // 1. Parse file to AST
    const ast = parseTypeScript(filePath);

    // 2. Find all function declarations
    const functions = findFunctions(ast);

    // 3. Wrap each function
    for (const fn of functions) {
      wrapFunction(fn, options.detailLevel);
    }

    // 4. Write instrumented file
    await writeInstrumentedFile(filePath, ast);
  }
}
```

#### Python (ast module)
```python
# .ai-agents/logging/runtime/adapters/python_adapter.py
class PythonInstrumenter:
    def instrument_file(self, file_path: str, options: dict):
        # 1. Parse Python file to AST
        with open(file_path) as f:
            tree = ast.parse(f.read())

        # 2. Transform AST to add instrumentation
        transformer = FunctionWrapper(options)
        new_tree = transformer.visit(tree)

        # 3. Write instrumented file
        code = ast.unparse(new_tree)
        write_instrumented_file(file_path, code)
```

### 3. Execution Context Tracking

Track the complete execution context across async boundaries:

```typescript
// .ai-agents/logging/runtime/tracer.ts
class ExecutionTracer {
  private contexts: Map<string, ExecutionContext> = new Map();

  startFunction(name: string, file: string, params: any): ExecutionContext {
    const ctx: ExecutionContext = {
      traceId: this.getCurrentTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId: this.getCurrentSpanId(),
      function: name,
      file: file,
      startTime: Date.now(),
      params: this.serializeParams(params),
      children: []
    };

    this.contexts.set(ctx.spanId, ctx);
    this.pushContext(ctx);

    return ctx;
  }

  endFunction(ctx: ExecutionContext, returnValue: any): void {
    ctx.endTime = Date.now();
    ctx.duration = ctx.endTime - ctx.startTime;
    ctx.returnValue = this.serializeValue(returnValue);

    this.popContext();
    this.recordTrace(ctx);
  }

  async wrapAsync<T>(promise: Promise<T>, name: string, parent: ExecutionContext): Promise<T> {
    const ctx = this.startFunction(name, 'async-operation', {});
    ctx.parentSpanId = parent.spanId;

    try {
      const result = await promise;
      this.endFunction(ctx, result);
      return result;
    } catch (error) {
      this.errorFunction(ctx, error);
      throw error;
    }
  }
}
```

### 4. Detail Levels

Five levels of instrumentation detail:

#### Level 0: OFF
No instrumentation, zero overhead.

#### Level 1: MINIMAL (Function Entry/Exit Only)
```typescript
function processData(data) {
  __tracer.enter('processData', 'src/processor.ts');
  // ... original code ...
  __tracer.exit('processData');
}
```

Captures:
- Function name
- File location
- Execution time

#### Level 2: STANDARD (+ Parameters & Return)
```typescript
function processData(data) {
  const __ctx = __tracer.start('processData', 'src/processor.ts', { data });
  try {
    // ... original code ...
    return __tracer.end(__ctx, result);
  } catch (e) {
    __tracer.error(__ctx, e);
    throw e;
  }
}
```

Captures:
- All from Level 1
- Function parameters
- Return values
- Errors

#### Level 3: DETAILED (+ Child Calls & Async)
```typescript
function processData(data) {
  const __ctx = __tracer.start('processData', 'src/processor.ts', { data });
  try {
    // Wrap all function calls
    const validated = __tracer.wrap(() => validateData(data), 'validateData', __ctx);
    const transformed = __tracer.wrap(() => transformData(validated), 'transformData', __ctx);

    // Wrap async operations
    const saved = await __tracer.wrapAsync(
      database.save(transformed),
      'database.save',
      __ctx
    );

    return __tracer.end(__ctx, saved);
  } catch (e) {
    __tracer.error(__ctx, e);
    throw e;
  }
}
```

Captures:
- All from Level 2
- Child function calls
- Async operations
- Call hierarchy

#### Level 4: VERBOSE (+ Variables & Statements)
```typescript
function processData(data) {
  const __ctx = __tracer.start('processData', 'src/processor.ts', { data });
  try {
    __tracer.checkpoint(__ctx, 'start-validation', { data });
    const validated = __tracer.wrap(() => validateData(data), 'validateData', __ctx);

    __tracer.checkpoint(__ctx, 'validation-complete', { validated });
    const transformed = __tracer.wrap(() => transformData(validated), 'transformData', __ctx);

    __tracer.checkpoint(__ctx, 'transformation-complete', { transformed });
    const saved = await __tracer.wrapAsync(
      database.save(transformed),
      'database.save',
      __ctx
    );

    __tracer.checkpoint(__ctx, 'save-complete', { saved });
    return __tracer.end(__ctx, saved);
  } catch (e) {
    __tracer.error(__ctx, e);
    throw e;
  }
}
```

Captures:
- All from Level 3
- Variable values at checkpoints
- Statement-level execution
- Complete state snapshots

#### Level 5: EXTREME (+ Line-by-Line)
```typescript
function processData(data) {
  const __ctx = __tracer.start('processData', 'src/processor.ts', { data });
  try {
    __tracer.line(__ctx, 15); // Line 15
    const validated = __tracer.wrap(() => {
      __tracer.line(__ctx, 16); // Line 16
      return validateData(data);
    }, 'validateData', __ctx);

    __tracer.line(__ctx, 18); // Line 18
    __tracer.var(__ctx, 'validated', validated);

    __tracer.line(__ctx, 19); // Line 19
    const transformed = __tracer.wrap(() => transformData(validated), 'transformData', __ctx);

    // ... every line instrumented ...

    return __tracer.end(__ctx, saved);
  } catch (e) {
    __tracer.error(__ctx, e);
    throw e;
  }
}
```

Captures:
- All from Level 4
- Line-by-line execution
- Every variable assignment
- Complete execution path

### 5. API Endpoints

#### Configuration API

```typescript
// GET /api/tracing/config
// Get current tracing configuration
{
  "enabled": true,
  "defaultLevel": 2,
  "files": {
    "src/users.ts": { "enabled": true, "level": 3 },
    "src/database.ts": { "enabled": true, "level": 4 },
    "src/utils.ts": { "enabled": false, "level": 0 }
  }
}

// PUT /api/tracing/config/file
// Configure tracing for specific file
{
  "file": "src/api.ts",
  "enabled": true,
  "level": 3,
  "captureParams": true,
  "captureReturn": true,
  "captureAsync": true
}

// PUT /api/tracing/config/function
// Configure tracing for specific function
{
  "file": "src/processor.ts",
  "function": "processData",
  "level": 5,
  "captureVars": ["validated", "transformed"]
}

// PUT /api/tracing/config/global
// Set global default
{
  "enabled": true,
  "defaultLevel": 2,
  "autoInstrument": true
}
```

#### Instrumentation API

```typescript
// POST /api/tracing/instrument/file
// Instrument a specific file
{
  "file": "src/users.ts",
  "level": 3,
  "force": false  // Re-instrument if already instrumented
}

// POST /api/tracing/instrument/function
// Instrument specific function(s)
{
  "file": "src/processor.ts",
  "functions": ["processData", "validateData"],
  "level": 4
}

// POST /api/tracing/instrument/all
// Instrument all executable files
{
  "level": 2,
  "exclude": ["*.test.ts", "*.spec.ts"],
  "languages": ["typescript", "javascript", "python"]
}

// POST /api/tracing/uninstrument/file
// Remove instrumentation from file
{
  "file": "src/users.ts",
  "restore": true  // Restore original code
}

// POST /api/tracing/uninstrument/function
// Remove instrumentation from specific functions
{
  "file": "src/processor.ts",
  "functions": ["processData"]
}

// POST /api/tracing/uninstrument/all
// Remove all instrumentation
{
  "restore": true
}
```

#### Search & Query API

```typescript
// GET /api/tracing/search
// Search execution traces
{
  "query": "database.query",
  "file": "src/users.ts",
  "minDuration": 100,
  "maxDuration": 5000,
  "hasError": false,
  "timeRange": {
    "start": "2025-01-15T00:00:00Z",
    "end": "2025-01-15T23:59:59Z"
  }
}

// GET /api/tracing/trace/{traceId}
// Get complete trace tree
{
  "traceId": "req-abc-123",
  "includeChildren": true,
  "maxDepth": 10
}

// GET /api/tracing/function/{file}/{function}
// Get all traces for a specific function
{
  "file": "src/users.ts",
  "function": "getUser",
  "limit": 100,
  "orderBy": "duration",
  "order": "desc"
}

// GET /api/tracing/slow
// Find slow executions
{
  "threshold": 1000,  // ms
  "limit": 50
}

// GET /api/tracing/errors
// Find failed executions
{
  "errorType": "DatabaseError",
  "limit": 100
}
```

#### Analysis API

```typescript
// GET /api/tracing/stats/file/{file}
// Get statistics for a file
{
  "file": "src/users.ts",
  "avgDuration": 45,
  "maxDuration": 250,
  "minDuration": 12,
  "callCount": 1523,
  "errorCount": 3,
  "errorRate": 0.002
}

// GET /api/tracing/stats/function/{file}/{function}
// Get statistics for a function
{
  "file": "src/users.ts",
  "function": "getUser",
  "p50": 45,
  "p95": 120,
  "p99": 200,
  "avgDuration": 53,
  "callCount": 1234
}

// GET /api/tracing/hotspots
// Find performance hotspots
[
  {
    "function": "database.query",
    "file": "src/database.ts",
    "totalTime": 45000,
    "callCount": 1000,
    "avgDuration": 45
  }
]

// GET /api/tracing/flow/{traceId}
// Get execution flow visualization
{
  "traceId": "req-abc-123",
  "format": "tree" | "flamegraph" | "timeline"
}
```

### 6. Environment Configuration

```env
# .ai-agents/logging/config/.env.tracing

# ═══════════════════════════════════════════════════════════════════════
# RUNTIME EXECUTION TRACING - MASTER CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════
# ⚠️  PROTECTED: Only humans can modify this file
# ═══════════════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────────────
# CORE SYSTEM CONTROL
# ───────────────────────────────────────────────────────────────────────

# Enable/disable runtime tracing entirely
TRACING_ENABLED=true

# Auto-instrument all executable files on startup
TRACING_AUTO_INSTRUMENT=true

# Default detail level (0-5)
# 0=OFF, 1=MINIMAL, 2=STANDARD, 3=DETAILED, 4=VERBOSE, 5=EXTREME
TRACING_DEFAULT_LEVEL=2

# ───────────────────────────────────────────────────────────────────────
# AUTOMATIC INSTRUMENTATION
# ───────────────────────────────────────────────────────────────────────

# Automatically wrap all functions in executable files
TRACING_AUTO_WRAP_FUNCTIONS=true

# Automatically track async operations
TRACING_AUTO_TRACK_ASYNC=true

# Automatically capture errors
TRACING_AUTO_CAPTURE_ERRORS=true

# Re-instrument files when they change
TRACING_AUTO_REINSTRUMENT=true

# Watch for new files and auto-instrument
TRACING_WATCH_NEW_FILES=true

# ───────────────────────────────────────────────────────────────────────
# LANGUAGE SUPPORT
# ───────────────────────────────────────────────────────────────────────

# Supported languages (comma-separated)
TRACING_LANGUAGES=typescript,javascript,python

# Language-specific levels
TRACING_LEVEL_TYPESCRIPT=2
TRACING_LEVEL_JAVASCRIPT=2
TRACING_LEVEL_PYTHON=2

# ───────────────────────────────────────────────────────────────────────
# CAPTURE CONFIGURATION
# ───────────────────────────────────────────────────────────────────────

# Capture function parameters
TRACING_CAPTURE_PARAMS=true

# Capture return values
TRACING_CAPTURE_RETURN=true

# Capture variable values (levels 4+)
TRACING_CAPTURE_VARS=true

# Capture async operations
TRACING_CAPTURE_ASYNC=true

# Capture database queries
TRACING_CAPTURE_DATABASE=true

# Capture HTTP requests/responses
TRACING_CAPTURE_HTTP=true

# Maximum parameter/return value size (bytes)
TRACING_MAX_CAPTURE_SIZE=10000

# ───────────────────────────────────────────────────────────────────────
# PERFORMANCE OPTIMIZATION
# ───────────────────────────────────────────────────────────────────────

# Sample rate (0.0-1.0, 1.0 = trace everything)
TRACING_SAMPLE_RATE=1.0

# Maximum trace depth (prevent infinite recursion)
TRACING_MAX_DEPTH=50

# Maximum traces stored in memory
TRACING_MAX_TRACES_MEMORY=10000

# Flush traces to disk interval (ms)
TRACING_FLUSH_INTERVAL=5000

# Enable trace compression
TRACING_COMPRESS_TRACES=true

# ───────────────────────────────────────────────────────────────────────
# FILTERING & EXCLUSIONS
# ───────────────────────────────────────────────────────────────────────

# Exclude specific files (glob patterns, comma-separated)
TRACING_EXCLUDE_FILES=*.test.ts,*.spec.ts,*.test.js,*.spec.js,*.config.ts

# Exclude specific functions (comma-separated)
TRACING_EXCLUDE_FUNCTIONS=toString,valueOf,constructor

# Exclude node_modules
TRACING_EXCLUDE_NODE_MODULES=true

# Minimum function duration to trace (ms)
TRACING_MIN_DURATION=0

# ───────────────────────────────────────────────────────────────────────
# AI AGENT PERMISSIONS
# ───────────────────────────────────────────────────────────────────────

# Allow AI agents to use instrumentation API
TRACING_ALLOW_AI_INSTRUMENTATION=true

# Allow AI agents to wrap functions
TRACING_ALLOW_AI_WRAP=true

# Allow AI agents to unwrap functions
TRACING_ALLOW_AI_UNWRAP=true

# Allow AI agents to change detail levels
TRACING_ALLOW_AI_CONFIGURE=true

# Require human approval for AI instrumentation
TRACING_AI_REQUIRE_APPROVAL=false

# ───────────────────────────────────────────────────────────────────────
# STORAGE & RETENTION
# ───────────────────────────────────────────────────────────────────────

# Store traces to disk
TRACING_STORE_TRACES=true

# Trace retention period (days)
TRACING_RETENTION_DAYS=7

# Maximum trace storage size (GB)
TRACING_MAX_STORAGE_GB=5

# Auto-cleanup old traces
TRACING_AUTO_CLEANUP=true

# ═══════════════════════════════════════════════════════════════════════
# HUMAN SIGNATURE (required for modifications)
# Date: _______________
# Name: _______________
# Changes: _________________________________________
# ═══════════════════════════════════════════════════════════════════════
```

### 7. Execution Flow Example

Complete trace of HTTP request:

```json
{
  "traceId": "req-abc-123",
  "type": "http-request",
  "method": "GET",
  "url": "/api/users/123",
  "startTime": "2025-01-15T14:30:25.100Z",
  "endTime": "2025-01-15T14:30:25.161Z",
  "duration": 61,
  "statusCode": 200,
  "spans": [
    {
      "spanId": "span-001",
      "parentSpanId": null,
      "function": "handleRequest",
      "file": "src/server.ts",
      "startTime": "2025-01-15T14:30:25.100Z",
      "endTime": "2025-01-15T14:30:25.161Z",
      "duration": 61,
      "children": ["span-002", "span-003"]
    },
    {
      "spanId": "span-002",
      "parentSpanId": "span-001",
      "function": "validateToken",
      "file": "src/middleware/auth.ts",
      "startTime": "2025-01-15T14:30:25.101Z",
      "endTime": "2025-01-15T14:30:25.106Z",
      "duration": 5,
      "params": { "token": "eyJ..." },
      "returnValue": { "valid": true, "userId": 123 }
    },
    {
      "spanId": "span-003",
      "parentSpanId": "span-001",
      "function": "getUser",
      "file": "src/controllers/users.ts",
      "startTime": "2025-01-15T14:30:25.107Z",
      "endTime": "2025-01-15T14:30:25.160Z",
      "duration": 53,
      "params": { "userId": 123 },
      "returnValue": { "id": 123, "name": "John", "email": "john@example.com" },
      "children": ["span-004", "span-005"]
    },
    {
      "spanId": "span-004",
      "parentSpanId": "span-003",
      "function": "database.query",
      "file": "src/database.ts",
      "startTime": "2025-01-15T14:30:25.108Z",
      "endTime": "2025-01-15T14:30:25.153Z",
      "duration": 45,
      "params": {
        "query": "SELECT * FROM users WHERE id = $1",
        "values": [123]
      },
      "returnValue": { "rows": [{ "id": 123, "name": "John", "email": "john@example.com" }] }
    },
    {
      "spanId": "span-005",
      "parentSpanId": "span-003",
      "function": "serialize",
      "file": "src/serializers/user.ts",
      "startTime": "2025-01-15T14:30:25.154Z",
      "endTime": "2025-01-15T14:30:25.159Z",
      "duration": 5,
      "params": { "user": { "id": 123, "name": "John" } },
      "returnValue": { "id": 123, "name": "John", "email": "john@example.com" }
    }
  ]
}
```

## Performance Overhead

| Detail Level | Overhead | Use Case |
|--------------|----------|----------|
| 0 (OFF) | 0% | Production, no tracing needed |
| 1 (MINIMAL) | 1-5% | Production monitoring |
| 2 (STANDARD) | 5-15% | Development, staging |
| 3 (DETAILED) | 15-30% | Debugging specific issues |
| 4 (VERBOSE) | 30-50% | Deep debugging |
| 5 (EXTREME) | 50-100%+ | Performance profiling, one-off investigations |

## File Backup Strategy

Before instrumentation:
1. Create backup: `.ai-agents/logging/backups/original/{file-path}`
2. Instrument file
3. On unwrap: restore from backup

## Integration with OpenMemory

All tracing activities recorded in OpenMemory:

```typescript
// When AI agent instruments a file
await recordAction({
  project_name: 'MyProject',
  agent_name: 'claude-code',
  action: 'instrumented_file',
  context: {
    file: 'src/users.ts',
    level: 3,
    functions_wrapped: 5
  },
  outcome: 'success'
});

// When slow execution detected
await recordPattern({
  project_name: 'MyProject',
  pattern_name: 'slow-database-query',
  description: 'database.query in src/users.ts averaging 200ms',
  tags: ['performance', 'database']
});
```

## Next Steps

1. Implement TypeScript/JavaScript instrumenter
2. Implement Python instrumenter
3. Build API server
4. Create tracing runtime
5. Integrate with logging system
6. Add MCP tools for AI agents
7. Build visualization UI
