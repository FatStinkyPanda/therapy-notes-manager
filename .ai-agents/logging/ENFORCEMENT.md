# Autonomous Logging + Runtime Tracing System - AI Agent Enforcement

## Critical Requirements

### ⚠️ MANDATORY: All AI Agents MUST Use Logging AND Tracing

The autonomous logging and runtime execution tracing systems are **REQUIRED** for all AI agents working within projects containing a `.ai-agents` folder. This requirement is **ENFORCED** through OpenMemory integration.

**Two integrated systems:**
1. **Autonomous Logging** - Traditional logging with auto-rotation and search
2. **Runtime Execution Tracing** - Automatic code instrumentation to capture execution flow

## Enforcement Mechanisms

### 1. MCP Server Integration

The logging system is exposed through the `openmemory-code-global` MCP server with the following tools:

#### Core Logging Tools
- `log_event` - Log a single event/action/decision
- `log_batch` - Log multiple events efficiently
- `log_error` - Log errors with stack traces
- `log_performance` - Log performance metrics

#### File Integration Tools
- `check_file_logging` - Check if a file has logging integrated
- `get_logging_status` - Get overall logging system status
- `get_unintegrated_files` - List files without logging
- `integrate_file_logging` - Add logging to a file
- `enable_file_logging` - Enable logging for a file
- `disable_file_logging` - Disable logging for a file

#### Search & Analysis Tools
- `search_logs` - Search logs with keywords/regex
- `filter_logs` - Filter logs by level/category/time
- `get_log_stats` - Get logging statistics
- `analyze_log_patterns` - Analyze patterns in logs

### 2. OpenMemory Compliance Tracking

All AI agent logging activities are tracked in OpenMemory as **actions**:

```typescript
// Every log operation creates an OpenMemory action
await recordAction({
  project_name: projectName,
  agent_name: agentName,
  action: 'logged_event',
  context: {
    level: 'info',
    category: 'ai-agent',
    file: 'src/example.ts',
    integrated: true
  },
  outcome: 'success'
});
```

### 3. Violation Detection

The system automatically detects violations:

#### Type 1: Missing Logging
**Violation**: AI agent modifies file without logging the action

**Detection**: File modification detected but no corresponding log entry

**Action**:
- Violation recorded in OpenMemory
- Warning issued to AI agent
- Human notification (if configured)

#### Type 2: Unintegrated File Modification
**Violation**: AI agent creates/modifies file without integrating logging

**Detection**: New/modified file has no logging integration

**Action**:
- Auto-integration triggered (if enabled)
- Compliance violation recorded
- File added to monitoring list

#### Type 3: Failed Integration Check
**Violation**: AI agent skips checking file logging status before modification

**Detection**: File modified without prior `check_file_logging` call

**Action**:
- Violation logged to OpenMemory
- Pattern detection triggered
- Recommendation generated for proper workflow

#### Type 4: Insufficient Logging Detail
**Violation**: AI agent logs action without required context

**Detection**: Log entry missing required fields (source, context, etc.)

**Action**:
- Log entry flagged as incomplete
- AI agent warned
- Compliance score impacted

### 4. Enforcement Rules

#### Rule 1: Log All Significant Actions
```json
{
  "rule": "must_log_significant_actions",
  "description": "AI agents must log all file modifications, code generation, and configuration changes",
  "required": true,
  "categories": [
    "file_modification",
    "code_generation",
    "configuration_change",
    "decision_made",
    "error_encountered"
  ],
  "minLevel": "info",
  "requiredFields": [
    "source",
    "message",
    "context",
    "agent",
    "sessionId"
  ]
}
```

#### Rule 2: Check Integration Before Modification
```json
{
  "rule": "must_check_integration",
  "description": "AI agents must check if file has logging before modifying",
  "required": true,
  "exemptions": [
    ".gitignore",
    "package.json",
    "*.md"
  ]
}
```

#### Rule 3: Use Logging API Only
```json
{
  "rule": "must_use_api",
  "description": "AI agents must use logging API, not direct file writes",
  "required": true,
  "blocked": [
    "fs.writeFile (to .log files)",
    "fs.appendFile (to .log files)",
    "console.log (for persistent logging)"
  ]
}
```

#### Rule 4: Log Errors Immediately
```json
{
  "rule": "must_log_errors",
  "description": "AI agents must log all errors as they occur",
  "required": true,
  "minLevel": "error",
  "requireStackTrace": true
}
```

## AI Agent Workflow Requirements

### When Creating New Files

1. **MUST** create file with logging integration hooks
2. **MUST** log file creation event
3. **MUST** register file in integration registry
4. **MUST** verify integration successful

Example:
```typescript
// 1. Create file
await writeFile('src/new-module.ts', content);

// 2. Integrate logging
await mcpTool('integrate_file_logging', {
  file_path: 'src/new-module.ts',
  category: 'main',
  level: 'info'
});

// 3. Log creation
await mcpTool('log_event', {
  level: 'info',
  category: 'ai-agent',
  source: 'src/new-module.ts',
  message: 'Created new module with logging integration',
  context: {
    file: 'src/new-module.ts',
    integrated: true
  }
});

// 4. Verify
const status = await mcpTool('check_file_logging', {
  file_path: 'src/new-module.ts'
});
```

### When Modifying Existing Files

1. **MUST** check logging status first
2. **MUST** integrate if missing
3. **MUST** log modification
4. **MUST** include context about changes

Example:
```typescript
// 1. Check status
const status = await mcpTool('check_file_logging', {
  file_path: 'src/existing.ts'
});

// 2. Integrate if needed
if (!status.integrated) {
  await mcpTool('integrate_file_logging', {
    file_path: 'src/existing.ts'
  });
}

// 3. Make modification
await modifyFile('src/existing.ts', changes);

// 4. Log modification
await mcpTool('log_event', {
  level: 'info',
  category: 'ai-agent',
  source: 'src/existing.ts',
  message: 'Modified file: added error handling',
  context: {
    linesChanged: 15,
    changeType: 'enhancement',
    integrated: true
  }
});
```

### When Encountering Errors

1. **MUST** log error immediately
2. **MUST** include stack trace
3. **MUST** include context
4. **MUST** log recovery attempt

Example:
```typescript
try {
  // ... operation ...
} catch (error) {
  // REQUIRED: Log error immediately
  await mcpTool('log_error', {
    source: 'src/module.ts',
    message: 'Failed to process data',
    error: error,
    context: {
      operation: 'processData',
      input: data,
      stage: 'validation'
    }
  });

  // Log recovery
  await mcpTool('log_event', {
    level: 'info',
    source: 'src/module.ts',
    message: 'Attempting error recovery',
    context: {
      strategy: 'retry',
      maxAttempts: 3
    }
  });
}
```

### When Making Decisions

1. **MUST** log decision and rationale
2. **MUST** include alternatives considered
3. **MUST** link to related OpenMemory decision

Example:
```typescript
// 1. Log to OpenMemory (reflective memory)
const decision = await mcpTool('record_decision', {
  project_name: 'MyProject',
  decision: 'Use TypeScript for new module',
  rationale: 'Type safety improves code quality',
  alternatives: 'JavaScript, Flow'
});

// 2. Log to logging system
await mcpTool('log_event', {
  level: 'info',
  category: 'ai-agent',
  source: 'decision-process',
  message: 'Decision made: Use TypeScript',
  context: {
    alternatives: ['JavaScript', 'Flow'],
    rationale: 'Type safety',
    openmemory_decision_id: decision.memory_id
  }
});
```

## Compliance Monitoring

### Real-Time Monitoring

The system monitors in real-time:
- Log entry frequency
- Missing integrations
- API usage patterns
- Error rates
- Compliance score

### Compliance Dashboard

Available via API:
```bash
GET /api/compliance/status
```

Returns:
```json
{
  "overall_score": 98.5,
  "violations": {
    "total": 3,
    "by_type": {
      "missing_logging": 1,
      "unintegrated_file": 1,
      "insufficient_detail": 1
    }
  },
  "files": {
    "total": 45,
    "integrated": 43,
    "unintegrated": 2,
    "disabled": 0
  },
  "last_24h": {
    "log_entries": 1523,
    "errors": 12,
    "violations": 3
  }
}
```

### Automated Reports

Daily compliance reports generated and stored in:
```
.ai-agents/logging/reports/compliance-YYYY-MM-DD.json
```

## Benefits of Compliance

### For AI Agents
- Clear audit trail of all actions
- Easy debugging and troubleshooting
- Performance insights
- Pattern detection

### For Developers
- Complete visibility into AI agent actions
- Quick problem diagnosis
- Historical analysis
- Compliance assurance

### For Projects
- Comprehensive documentation
- Automated issue detection
- Quality assurance
- Continuous improvement

## Exemptions

### Files Exempt from Logging
- Configuration files: `.gitignore`, `.npmrc`, etc.
- Documentation: `*.md` (unless explicitly requested)
- Package files: `package.json`, `composer.json`
- Lock files: `package-lock.json`, `yarn.lock`

### Operations Exempt from Logging
- Read-only operations
- Non-modifying analysis
- Help/information requests
- Configuration queries

## Enforcement Severity Levels

### Level 1: Warning (Low)
- First-time violation
- Non-critical file
- Low impact

**Action**: Warning logged, no blocking

### Level 2: Strict (Medium)
- Repeated violation
- Important file
- Medium impact

**Action**: Warning logged, auto-correction attempted

### Level 3: Critical (High)
- Multiple violations
- Critical file
- High impact

**Action**: Operation blocked, human notification required

## Configuration

Enforcement levels configured in `.env.logging`:

```env
# Enforcement strictness: low, medium, high
LOGGING_ENFORCEMENT_LEVEL=medium

# Block operations on violations
LOGGING_BLOCK_ON_VIOLATION=false

# Notify human on violations
LOGGING_NOTIFY_ON_VIOLATION=true

# Auto-correct violations
LOGGING_AUTO_CORRECT=true
```

## Human Override

Humans can:
1. Disable enforcement entirely (via `.env.logging`)
2. Exempt specific files (via `filters.json`)
3. Adjust enforcement level
4. Review and approve violations
5. Clear violation history

## Support

For questions or issues:
- Documentation: `.ai-agents/logging/ARCHITECTURE.md`
- API Reference: `.ai-agents/logging/API.md`
- Troubleshooting: `.ai-agents/logging/TROUBLESHOOTING.md`
