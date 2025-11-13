# Quick Start Guide - Logging + Tracing System

## Installation

```bash
cd .ai-agents/logging
npm install
npm run build
```

## Starting the API Server

```bash
node start-logging-api.js
```

Or add to your OpenMemory startup:

```bash
# In start-openmemory.ps1
node .ai-agents/logging/start-logging-api.js
```

## Basic Usage

### 1. Logging Events (Traditional Logging)

```typescript
import { Logger } from './.ai-agents/logging/core/logger';

const logger = Logger.getInstance('src/myfile.ts');

// Log an event
logger.info('Application started', { port: 3000 });

// Log an error
logger.error('Failed to connect', new Error('Timeout'));

// Performance timing
const timer = logger.startTimer();
await doWork();
timer.done({ message: 'Work completed' });
```

### 2. Code Instrumentation (Runtime Tracing)

#### Via API:

```bash
# Instrument a file
curl -X POST http://localhost:8083/api/tracing/instrument/file \
  -H "Content-Type: application/json" \
  -d '{"file": "src/users.ts", "level": 2}'

# Search traces
curl http://localhost:8083/api/tracing/search?query=database

# Find slow executions
curl http://localhost:8083/api/tracing/slow?threshold=100

# Get performance stats
curl http://localhost:8083/api/tracing/stats/file/src/users.ts
```

#### Via MCP Tools (AI Agents):

```typescript
// Check if file has tracing
const status = await mcp__openmemory_code_global__check_file_logging({
  file: 'src/users.ts'
});

// Instrument file
await mcp__openmemory_code_global__instrument_file({
  file: 'src/users.ts',
  level: 2
});

// Search traces
const traces = await mcp__openmemory_code_global__search_traces({
  query: 'database.query',
  minDuration: 50
});

// Find performance hotspots
const hotspots = await mcp__openmemory_code_global__get_hotspots({
  limit: 20
});
```

## Tracing Detail Levels

| Level | Name | Captures | Overhead |
|-------|------|----------|----------|
| 0 | OFF | Nothing | 0% |
| 1 | MINIMAL | Entry/exit, timing | 1-5% |
| 2 | STANDARD | + Params, returns | 5-15% |
| 3 | DETAILED | + Child calls, async | 15-30% |
| 4 | VERBOSE | + Variables | 30-50% |
| 5 | EXTREME | + Line-by-line | 50-100%+ |

**Recommended: Level 2 (STANDARD) for most files**

## Configuration

### Logging Configuration (`.ai-agents/logging/config/.env.logging`)

```env
LOGGING_ENABLED=true
LOGGING_MAX_FILE_SIZE_MB=100
LOGGING_ROTATION_INTERVAL_HOURS=24
```

### Tracing Configuration (`.ai-agents/logging/config/.env.tracing`)

```env
TRACING_ENABLED=true
TRACING_DEFAULT_LEVEL=2
TRACING_ALLOW_AI_INSTRUMENTATION=true
TRACING_SAMPLE_RATE=1.0
```

## File Structure

```
.ai-agents/logging/
├── config/
│   ├── .env.logging           # Human-only logging config
│   └── .env.tracing           # Human-only tracing config
├── core/
│   └── logger.ts              # Core logger
├── runtime/
│   ├── tracer.ts              # Execution tracer
│   └── adapters/              # Language instrumenters
├── api/
│   └── server.ts              # API server
├── mcp/
│   └── tools.ts               # MCP tools
├── logs/                      # Log files
├── traces/                    # Execution traces
└── backups/                   # Original file backups
```

## Example Workflow

### For Developers:

1. **Start API server**
   ```bash
   node .ai-agents/logging/start-logging-api.js
   ```

2. **Instrument critical files**
   ```bash
   curl -X POST http://localhost:8083/api/tracing/instrument/file \
     -d '{"file": "src/database.ts", "level": 3}'
   ```

3. **Run your application**

4. **Search for slow operations**
   ```bash
   curl http://localhost:8083/api/tracing/slow?threshold=100
   ```

5. **Get performance stats**
   ```bash
   curl http://localhost:8083/api/tracing/stats/file/src/database.ts
   ```

### For AI Agents:

1. **Check file status before modifications**
   ```typescript
   await check_file_logging({ file: 'src/users.ts' })
   ```

2. **Log all significant actions**
   ```typescript
   await log_event({
     level: 'info',
     category: 'ai-agent',
     source: 'src/users.ts',
     message: 'Modified file to add authentication'
   })
   ```

3. **Use tracing for debugging**
   ```typescript
   const errors = await find_errors({ limit: 10 })
   const slowOps = await find_slow_executions({ threshold: 100 })
   ```

## Troubleshooting

### API server won't start

```bash
# Check if port 8083 is in use
netstat -ano | findstr ":8083"

# Build the project
cd .ai-agents/logging
npm run build
```

### Instrumentation fails

```bash
# Check file exists
# Check backup directory has write permissions
# Check TypeScript compiler is installed
```

### Traces not appearing

```bash
# Verify instrumentation:
curl http://localhost:8083/api/files/integrated

# Check tracing is enabled:
# Look at .env.tracing -> TRACING_ENABLED=true
```

## Documentation

- **Architecture**: See `ARCHITECTURE.md` and `RUNTIME_TRACING_ARCHITECTURE.md`
- **API Reference**: See API server code in `api/server.ts`
- **MCP Tools**: See `mcp/tools.ts`
- **Enforcement**: See `ENFORCEMENT.md`
- **Complete Summary**: See `COMPLETE_SYSTEM_SUMMARY.md`

## Support

For issues or questions:
1. Check documentation files
2. Review API server logs
3. Check `.env.logging` and `.env.tracing` configuration
4. Review `TROUBLESHOOTING.md` (if exists)
