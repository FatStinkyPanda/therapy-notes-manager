# Autonomous Logging System Architecture

## Overview

A comprehensive, self-managing logging system deeply integrated with OpenMemory + ai-agents that provides automated log rotation, archival, search capabilities, and AI agent enforcement.

## Core Principles

1. **Autonomous Management**: Logs automatically rotate, archive, and clean up
2. **Latest-First Design**: Current logs always named "latest", old logs timestamped and archived
3. **API-Driven**: All operations accessible via REST API endpoints
4. **Deep Integration**: Required for all AI agents via OpenMemory enforcement
5. **Human-Controlled**: Core configuration locked from AI agent modification
6. **Zero-Overhead When Disabled**: Complete shutdown capability

## Directory Structure

```
.ai-agents/
  logging/
    ├── config/
    │   ├── .env.logging              # Human-only master config (AI-protected)
    │   ├── logging.config.json       # Runtime configuration
    │   └── filters.json              # Keyword/regex filters
    │
    ├── logs/
    │   ├── latest/                   # Current active logs
    │   │   ├── main.latest.log
    │   │   ├── error.latest.log
    │   │   ├── ai-agent.latest.log
    │   │   ├── api.latest.log
    │   │   └── debug.latest.log
    │   │
    │   └── archive/                  # Timestamped archived logs
    │       ├── 2025-01-15-143022/
    │       │   ├── main.2025-01-15-143022.log
    │       │   ├── error.2025-01-15-143022.log
    │       │   └── ai-agent.2025-01-15-143022.log
    │       └── 2025-01-14-091533/
    │           └── ...
    │
    ├── integrations/
    │   ├── registry.json             # Tracks which files have logging
    │   ├── hooks/                    # Integration code snippets
    │   │   ├── typescript.hook.ts
    │   │   ├── javascript.hook.js
    │   │   ├── python.hook.py
    │   │   └── generic.hook.txt
    │   └── templates/                # Code templates for integration
    │
    ├── api/
    │   ├── server.ts                 # Main API server
    │   ├── endpoints/
    │   │   ├── log.endpoints.ts      # Logging endpoints
    │   │   ├── search.endpoints.ts   # Search/filter endpoints
    │   │   ├── config.endpoints.ts   # Configuration endpoints
    │   │   └── files.endpoints.ts    # File integration endpoints
    │   ├── middleware/
    │   │   ├── auth.middleware.ts    # API authentication
    │   │   └── enforce.middleware.ts # AI agent enforcement
    │   └── utils/
    │       ├── rotation.util.ts      # Log rotation logic
    │       ├── archive.util.ts       # Archival logic
    │       └── search.util.ts        # Search/filter logic
    │
    ├── core/
    │   ├── logger.ts                 # Core logger class
    │   ├── manager.ts                # Log management
    │   ├── archiver.ts               # Archival system
    │   └── integrator.ts             # File integration
    │
    └── enforcement/
        ├── ai-agent-rules.json       # AI agent logging requirements
        └── compliance-checker.ts     # Enforcement validator

```

## Components

### 1. Configuration System

#### .env.logging (Human-Only)
```env
# LOGGING SYSTEM MASTER CONFIGURATION
# ⚠️  WARNING: This file is PROTECTED from AI agent modification
# Only human developers can change these settings

LOGGING_ENABLED=true
LOGGING_API_PORT=8082
LOGGING_MAX_FILE_SIZE_MB=100
LOGGING_ROTATION_INTERVAL_HOURS=24
LOGGING_ARCHIVE_RETENTION_DAYS=30
LOGGING_AUTO_CLEANUP_ENABLED=true
LOGGING_REQUIRE_AI_AGENTS=true
```

#### logging.config.json (Runtime)
```json
{
  "version": "1.0.0",
  "enabled": true,
  "logLevels": {
    "main": ["info", "warn", "error"],
    "error": ["error", "fatal"],
    "ai-agent": ["info", "warn", "error", "debug"],
    "api": ["info", "error"],
    "debug": ["debug", "trace"]
  },
  "rotation": {
    "maxSizeMB": 100,
    "maxAgeDays": 1,
    "compress": true
  },
  "archive": {
    "enabled": true,
    "retentionDays": 30,
    "compress": true
  },
  "filters": {
    "enabled": true,
    "configFile": "filters.json"
  }
}
```

### 2. Log File Management

#### Rotation Strategy
1. Monitor log file size (default: 100MB max)
2. When threshold reached or time interval passed:
   - Generate timestamp: `YYYY-MM-DD-HHmmss`
   - Rename `*.latest.log` → `*.TIMESTAMP.log`
   - Move to `archive/TIMESTAMP/`
   - Create new `*.latest.log`
3. Compress archived logs (optional)

#### Archive Cleanup
- Automatically delete archives older than retention period
- Configurable retention (default: 30 days)
- Can be disabled via configuration

### 3. API Endpoints

#### Logging Endpoints
```
POST   /api/log              - Write log entry
POST   /api/log/batch        - Write multiple entries
GET    /api/log/latest       - Get latest logs
GET    /api/log/stream       - Stream logs (Server-Sent Events)
```

#### Search/Filter Endpoints
```
GET    /api/search           - Search logs with query
POST   /api/search/regex     - Search with regex pattern
GET    /api/filter           - Filter by level/file/timestamp
GET    /api/filter/keywords  - Filter by keywords
```

#### Configuration Endpoints
```
GET    /api/config           - Get current configuration
PUT    /api/config/filters   - Update keyword/regex filters
GET    /api/config/levels    - Get log levels
PUT    /api/config/levels    - Update log levels (per file)
```

#### File Integration Endpoints
```
GET    /api/files            - List all tracked files
GET    /api/files/integrated - Files with logging active
GET    /api/files/missing    - Files without logging
POST   /api/files/integrate  - Add logging to file
PUT    /api/files/enable     - Enable logging for file
PUT    /api/files/disable    - Disable logging for file
DELETE /api/files/remove     - Remove logging from file
```

#### System Endpoints
```
GET    /api/health           - Health check
GET    /api/status           - System status
POST   /api/rotate           - Force log rotation
POST   /api/archive/cleanup  - Run archive cleanup
GET    /api/stats            - Logging statistics
```

### 4. File Integration System

#### Integration Registry (registry.json)
```json
{
  "files": {
    "src/server/index.ts": {
      "enabled": true,
      "logLevel": "info",
      "category": "main",
      "integrated": "2025-01-15T14:30:22Z",
      "lastLogged": "2025-01-15T16:45:10Z",
      "totalLogs": 1523
    },
    "src/api/routes.ts": {
      "enabled": true,
      "logLevel": "debug",
      "category": "api",
      "integrated": "2025-01-15T14:30:22Z",
      "lastLogged": "2025-01-15T16:45:08Z",
      "totalLogs": 892
    },
    "src/core/processor.ts": {
      "enabled": false,
      "logLevel": "info",
      "category": "main",
      "integrated": "2025-01-15T14:30:22Z",
      "lastLogged": null,
      "totalLogs": 0
    }
  }
}
```

### 5. AI Agent Integration

#### OpenMemory Integration
- New MCP tools for logging:
  - `log_event` - Log an event/action
  - `search_logs` - Search historical logs
  - `get_file_logging_status` - Check if file has logging
  - `integrate_logging` - Add logging to file
  - `configure_logging` - Update logging configuration

#### Enforcement Rules (ai-agent-rules.json)
```json
{
  "rules": {
    "must_log_actions": {
      "description": "AI agents must log all significant actions",
      "required": true,
      "categories": ["file_modification", "code_generation", "configuration_change"]
    },
    "must_log_errors": {
      "description": "AI agents must log all errors encountered",
      "required": true,
      "minLevel": "error"
    },
    "must_check_integration": {
      "description": "AI agents must check logging status before modifying files",
      "required": true
    },
    "must_use_api": {
      "description": "AI agents must use logging API, not direct file writes",
      "required": true
    }
  },
  "violations": {
    "trackInOpenMemory": true,
    "blockOnCritical": true,
    "notifyHuman": true
  }
}
```

### 6. Log Entry Format

```json
{
  "timestamp": "2025-01-15T16:45:10.234Z",
  "level": "info",
  "category": "main",
  "source": "src/server/index.ts:42",
  "message": "Server started successfully",
  "context": {
    "port": 8080,
    "environment": "development"
  },
  "agent": "claude-code",
  "sessionId": "abc-123-def",
  "tags": ["startup", "server"],
  "metadata": {
    "duration": 123,
    "memory": "45MB"
  }
}
```

## Integration Examples

### TypeScript Integration
```typescript
import { Logger } from './.ai-agents/logging/core/logger';

const logger = Logger.getInstance('src/myfile.ts');

// Simple logging
logger.info('Operation completed');
logger.error('Operation failed', { error: err });

// Contextual logging
logger.debug('Processing item', {
  itemId: 123,
  stage: 'validation'
});

// Performance logging
const timer = logger.startTimer();
// ... do work ...
timer.done({ message: 'Work completed' });
```

### JavaScript Integration
```javascript
const { Logger } = require('./.ai-agents/logging/core/logger');

const logger = Logger.getInstance('src/myfile.js');

logger.info('Started processing');
logger.warn('Low memory warning', { available: '100MB' });
```

### Python Integration
```python
from ai_agents.logging.core.logger import Logger

logger = Logger.get_instance('src/myfile.py')

logger.info('Process started')
logger.error('Failed to connect', {'host': 'localhost', 'port': 8080})
```

## Search & Filter Capabilities

### Keyword Search
```bash
GET /api/search?q=error&category=main&since=2025-01-15
```

### Regex Search
```bash
POST /api/search/regex
{
  "pattern": "Failed to \\w+ at \\d{2}:\\d{2}",
  "category": "error",
  "limit": 100
}
```

### Advanced Filtering
```bash
GET /api/filter?level=error,warn&source=src/server/*&after=2025-01-15T00:00:00Z
```

## Performance Considerations

- **Asynchronous Logging**: Non-blocking writes
- **Buffering**: Batch writes to reduce I/O
- **Compression**: Automatic compression of archived logs
- **Streaming**: Server-Sent Events for real-time log viewing
- **Indexing**: Optional indexing for faster searches (future)

## Security

1. **API Authentication**: Token-based auth for API endpoints
2. **Human-Only Config**: `.env.logging` protected from AI modification
3. **Rate Limiting**: Prevent log flooding
4. **Sanitization**: Auto-sanitize sensitive data (API keys, passwords)
5. **Access Control**: Role-based access to logs

## Monitoring & Alerts

- Log rotation failures
- Disk space warnings
- Missing integrations detected
- AI agent compliance violations
- Archive cleanup errors

## Future Enhancements

1. **Log Analytics Dashboard**: Web UI for log visualization
2. **Distributed Logging**: Multi-project log aggregation
3. **Export Capabilities**: Export to external systems (Elasticsearch, Splunk)
4. **Machine Learning**: Anomaly detection in logs
5. **Performance Profiling**: Automatic performance tracking
