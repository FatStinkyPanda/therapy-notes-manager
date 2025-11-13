# Autonomous Logging System

A comprehensive, self-managing logging system deeply integrated with OpenMemory + ai-agents that provides automated log rotation, archival, search capabilities, and mandatory AI agent enforcement.

## Quick Start

### 1. Initialize the Logging System

```bash
# From project root
node .ai-agents/logging/init-logging.js
```

This will:
- ✅ Create all necessary directories
- ✅ Generate default configuration files
- ✅ Set up log rotation and archival
- ✅ Initialize the file integration registry
- ✅ Start the logging API server

### 2. Verify Installation

```bash
# Check system status
curl http://localhost:8082/api/status

# Should return:
{
  "status": "running",
  "version": "1.0.0",
  "enabled": true,
  "files_integrated": 0,
  "total_logs": 0
}
```

### 3. Configure (Optional)

Edit `.ai-agents/logging/config/.env.logging` to customize:
- Master on/off switch
- Log rotation intervals
- Archive retention
- AI agent enforcement rules
- And more...

**Note**: This file is PROTECTED from AI agent modification. Only humans can edit it.

## Features

### ✨ Automatic Log Management
- **Latest Files**: Current logs always named `*.latest.log`
- **Auto-Rotation**: Rotates when size/time thresholds reached
- **Timestamped Archives**: Old logs moved to `archive/YYYY-MM-DD-HHmmss/`
- **Auto-Cleanup**: Old archives deleted based on retention policy
- **Compression**: Optional compression of archived logs

### 🔍 Powerful Search & Filtering
- **Keyword Search**: Find logs by keywords
- **Regex Search**: Advanced pattern matching
- **Multi-Filter**: Filter by level, category, time, source
- **Real-Time Streaming**: Watch logs as they happen
- **Export**: Export search results to JSON/CSV

### 🔗 Deep Integration
- **OpenMemory**: All logging tracked in memory system
- **AI Agent Enforcement**: Mandatory logging for AI agents
- **File Tracking**: Knows which files have logging
- **Auto-Integration**: Automatically adds logging to new files
- **Compliance Monitoring**: Tracks AI agent compliance

### 🛡️ Human-Controlled
- **Protected Config**: `.env.logging` cannot be modified by AI agents
- **Enable/Disable**: Master switch to turn system on/off
- **Zero Overhead**: When disabled, uses NO resources
- **Override Controls**: Humans can override any enforcement

### 📊 API-Driven
- **REST API**: All operations via HTTP API
- **MCP Tools**: Integrated with MCP server for AI agents
- **Webhooks**: Send logs to external systems
- **Health Monitoring**: Real-time system health checks

## Directory Structure

```
.ai-agents/logging/
├── config/
│   ├── .env.logging              # Human-only master config
│   ├── logging.config.json       # Runtime configuration
│   └── filters.json              # Search filters
├── logs/
│   ├── latest/                   # Current logs
│   │   ├── main.latest.log
│   │   ├── error.latest.log
│   │   ├── ai-agent.latest.log
│   │   ├── api.latest.log
│   │   └── debug.latest.log
│   └── archive/                  # Archived logs
│       └── 2025-01-15-143022/
├── integrations/
│   ├── registry.json             # File integration tracking
│   └── hooks/                    # Integration code snippets
├── api/
│   └── server.ts                 # API server
└── core/
    └── logger.ts                 # Core logger implementation
```

## Usage Examples

### TypeScript/JavaScript

```typescript
import { Logger } from './.ai-agents/logging/core/logger';

const logger = Logger.getInstance('src/myfile.ts');

// Basic logging
logger.info('Operation started');
logger.warn('Low memory detected', { available: '100MB' });
logger.error('Operation failed', new Error('Connection timeout'));

// Performance logging
const timer = logger.startTimer('database-query');
await database.query('SELECT * FROM users');
timer.done({ rows: 1523 });

// Contextual logging
logger.debug('Processing user', {
  userId: 123,
  action: 'login',
  ip: '192.168.1.1'
});
```

### Via API

```bash
# Log an event
curl -X POST http://localhost:8082/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "category": "main",
    "source": "src/app.ts",
    "message": "Application started",
    "context": { "port": 3000 }
  }'

# Search logs
curl "http://localhost:8082/api/search?q=error&category=main&limit=10"

# Get file logging status
curl "http://localhost:8082/api/files/integrated"
```

### Via MCP Tools (AI Agents)

```typescript
// Log event
await mcp__openmemory_code_global__log_event({
  level: 'info',
  category: 'ai-agent',
  source: 'src/module.ts',
  message: 'AI agent modified file',
  context: {
    changes: 'Added error handling',
    linesAdded: 15
  }
});

// Check file logging status
const status = await mcp__openmemory_code_global__check_file_logging({
  file_path: 'src/module.ts'
});

// Search logs
const results = await mcp__openmemory_code_global__search_logs({
  query: 'error',
  category: 'error',
  limit: 100
});
```

## API Endpoints

### Logging
- `POST /api/log` - Write log entry
- `POST /api/log/batch` - Write multiple entries
- `GET /api/log/latest` - Get latest logs
- `GET /api/log/stream` - Stream logs (SSE)

### Search & Filter
- `GET /api/search?q=...` - Search logs
- `POST /api/search/regex` - Regex search
- `GET /api/filter?level=...` - Filter logs

### Files
- `GET /api/files` - List all files
- `GET /api/files/integrated` - Files with logging
- `GET /api/files/missing` - Files without logging
- `POST /api/files/integrate` - Add logging to file
- `PUT /api/files/enable` - Enable logging for file
- `PUT /api/files/disable` - Disable logging for file

### System
- `GET /api/health` - Health check
- `GET /api/status` - System status
- `POST /api/rotate` - Force rotation
- `GET /api/stats` - Statistics

## AI Agent Requirements

**⚠️ MANDATORY**: AI agents working in projects with `.ai-agents` folder MUST:

1. **Log all significant actions**
   - File modifications
   - Code generation
   - Configuration changes
   - Decisions made
   - Errors encountered

2. **Check integration before modifying files**
   ```typescript
   const status = await check_file_logging({ file_path: 'src/file.ts' });
   if (!status.integrated) {
     await integrate_file_logging({ file_path: 'src/file.ts' });
   }
   ```

3. **Use logging API only**
   - Never write directly to log files
   - Always use MCP tools or API

4. **Log errors immediately**
   ```typescript
   try {
     // operation
   } catch (error) {
     await log_error({
       source: 'src/file.ts',
       message: 'Operation failed',
       error: error
     });
   }
   ```

See [ENFORCEMENT.md](./ENFORCEMENT.md) for complete requirements.

## Configuration

### Master Enable/Disable

```env
# In .env.logging
LOGGING_ENABLED=true  # or false to disable completely
```

When disabled:
- API server stops
- No background processes
- Zero CPU/memory usage
- No disk I/O

### Log Rotation

```env
LOGGING_MAX_FILE_SIZE_MB=100         # Rotate at 100MB
LOGGING_ROTATION_INTERVAL_HOURS=24   # Or rotate daily
```

### Archive Management

```env
LOGGING_AUTO_CLEANUP_ENABLED=true    # Auto-delete old archives
LOGGING_ARCHIVE_RETENTION_DAYS=30    # Keep for 30 days
LOGGING_MAX_ARCHIVE_SIZE_GB=10       # Max 10GB total
```

### AI Agent Enforcement

```env
LOGGING_REQUIRE_AI_AGENTS=true               # Require AI agents to log
LOGGING_BLOCK_UNINTEGRATED_FILES=false       # Block unintegrated file mods
LOGGING_AUTO_INTEGRATE_NEW_FILES=true        # Auto-integrate new files
```

## Troubleshooting

### Logs not appearing?

1. Check if logging is enabled:
   ```bash
   curl http://localhost:8082/api/status
   ```

2. Check log files directly:
   ```bash
   ls .ai-agents/logging/logs/latest/
   cat .ai-agents/logging/logs/latest/main.latest.log
   ```

3. Check API server is running:
   ```bash
   curl http://localhost:8082/api/health
   ```

### API server not starting?

1. Check port 8082 is available:
   ```bash
   netstat -an | findstr "8082"
   ```

2. Check for errors in system log:
   ```bash
   cat .ai-agents/logging/logs/latest/system.latest.log
   ```

3. Try restarting:
   ```bash
   node .ai-agents/logging/init-logging.js --restart
   ```

### File integration not working?

1. Check registry:
   ```bash
   cat .ai-agents/logging/integrations/registry.json
   ```

2. Manually integrate:
   ```bash
   curl -X POST http://localhost:8082/api/files/integrate \
     -H "Content-Type: application/json" \
     -d '{"file_path": "src/myfile.ts"}'
   ```

### Can't modify .env.logging?

This is **intentional** - only humans can modify this file. AI agents are blocked from changing it.

To modify:
1. Open in your text editor
2. Make changes
3. Add human signature at bottom
4. Save

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Detailed system architecture
- Component descriptions
- Data flow diagrams
- Performance considerations
- Security measures

## AI Agent Enforcement

See [ENFORCEMENT.md](./ENFORCEMENT.md) for:
- Mandatory requirements
- Enforcement mechanisms
- Violation types
- Compliance monitoring
- Workflow requirements

## API Reference

Full API documentation available at:
```bash
curl http://localhost:8082/api/docs
```

Or see [API.md](./API.md)

## License

MIT License - See project root LICENSE file

## Support

- **Issues**: Create issue in project repository
- **Documentation**: `.ai-agents/logging/` directory
- **Examples**: `.ai-agents/logging/examples/`

## Version

Current version: **1.0.0**

Last updated: 2025-01-15
