# Claude Context Injection - Implementation Guide

**Status**: ❌ **NOT IMPLEMENTED** - Critical Missing Feature
**Priority**: 🔴 **CRITICAL**
**Impact**: Without this, Claude doesn't automatically receive OpenMemory context

---

## What is Claude Context Injection?

Claude context injection is the mechanism that automatically loads project state, history, and patterns from OpenMemory when Claude starts a new conversation or task. It ensures Claude has continuous long-term memory across sessions.

### Current Behavior ❌
```
User: "Continue working on the authentication feature"
Claude: "I don't see any previous work. Can you provide context?"
         ↑ No memory of previous sessions!
```

### Desired Behavior ✅
```
User: "Continue working on the authentication feature"
Claude: "I see from OpenMemory that we're 60% done with OAuth integration.
         Last session, we completed the login endpoint.
         Next up: Token refresh logic."
         ↑ Automatic context from OpenMemory!
```

---

## Why is This Critical?

Without context injection, the entire AI Agents + OpenMemory system is **disconnected**:

| Component | Status | Impact |
|-----------|--------|--------|
| OpenMemory backend | ✅ Running | Stores memories |
| AI Agents API | ✅ Working | Can store/retrieve state |
| Git hooks | ✅ Active | Validates commits |
| **Claude integration** | ❌ **Missing** | **Claude doesn't use any of it!** |

**The Problem**: Claude can READ and WRITE to OpenMemory via API calls, but doesn't AUTOMATICALLY receive context at conversation start.

---

## Implementation Options

### Option 1: VS Code Extension (Recommended for VS Code)

**How it works:**
1. User opens project in VS Code
2. Extension detects `.openmemory` link file
3. Extension queries OpenMemory API on conversation start
4. Extension injects context into Claude's system prompt

**Pros:**
- ✅ Deep VS Code integration
- ✅ Automatic detection per project
- ✅ Can inject context before every message
- ✅ Can update context after every Claude action

**Cons:**
- ❌ Requires VS Code extension development
- ❌ Doesn't work for Claude Desktop or CLI
- ❌ Requires marketplace publishing

**Implementation Path:**
```
1. Create VS Code extension: openmemory-claude-integration
2. Detect .openmemory link file in workspace
3. Hook into VS Code's AI/Copilot chat API
4. Inject OpenMemory context before Claude receives user message
5. Update OpenMemory after Claude completes action
```

### Option 2: MCP (Model Context Protocol) Server (Recommended for Claude Desktop)

**How it works:**
1. Claude Desktop connects to MCP server
2. MCP server provides OpenMemory as a "context source"
3. Claude automatically queries MCP on conversation start
4. MCP fetches from OpenMemory and returns context

**Pros:**
- ✅ Works with Claude Desktop
- ✅ Official Anthropic protocol
- ✅ Can work across multiple projects
- ✅ Supports tools/commands from OpenMemory

**Cons:**
- ❌ Requires MCP server implementation
- ❌ Requires Claude Desktop configuration
- ❌ Still in early development

**Implementation Path:**
```
1. Implement MCP server: openmemory-mcp-server
2. Register OpenMemory as context provider
3. Implement MCP protocol handlers:
   - resources/list → Return available projects
   - resources/read → Fetch project state from OpenMemory
   - tools/call → Execute OpenMemory API operations
4. Configure Claude Desktop to use MCP server
```

**MCP Server Code Structure:**
```typescript
// openmemory-mcp-server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'openmemory-context',
  version: '1.0.0',
}, {
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Provide project context as resources
server.setRequestHandler('resources/list', async () => {
  // Query ~/.openmemory-global/projects/registry.json
  const projects = await loadProjectRegistry();
  return {
    resources: projects.map(p => ({
      uri: `openmemory://project/${p.name}`,
      name: `${p.name} - Project Context`,
      mimeType: 'application/json',
    }))
  };
});

server.setRequestHandler('resources/read', async (request) => {
  const projectName = extractProjectFromUri(request.params.uri);

  // Query OpenMemory API
  const response = await fetch(`http://localhost:8080/ai-agents/state/${projectName}`);
  const data = await response.json();

  // Return formatted context
  return {
    contents: [{
      uri: request.params.uri,
      mimeType: 'application/json',
      text: formatContextForClaude(data.state),
    }]
  };
});

// Provide OpenMemory operations as tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'record_decision',
        description: 'Record an architectural decision in OpenMemory',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string' },
            decision: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['project_name', 'decision', 'rationale'],
        },
      },
      {
        name: 'record_action',
        description: 'Record a development action in OpenMemory',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string' },
            action: { type: 'string' },
            outcome: { type: 'string' },
          },
          required: ['project_name', 'action'],
        },
      },
      // ... more tools
    ]
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'record_decision') {
    const response = await fetch('http://localhost:8080/ai-agents/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    return { content: [{ type: 'text', text: await response.text() }] };
  }
  // ... handle other tools
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Claude Desktop Configuration:**
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "openmemory": {
      "command": "node",
      "args": ["/path/to/openmemory-mcp-server/dist/index.js"],
      "env": {
        "OPENMEMORY_URL": "http://localhost:8080"
      }
    }
  }
}
```

### Option 3: Custom Prompt Injection via `.ai-agents/` Directory

**How it works:**
1. Store prompt template in `.ai-agents/context-prompt.md`
2. User manually copies and pastes into Claude chat
3. Or: Script automatically injects on git commit

**Pros:**
- ✅ Works immediately, no development needed
- ✅ Simple to implement
- ✅ Works with any Claude interface

**Cons:**
- ❌ Manual user action required
- ❌ Not truly "automatic"
- ❌ Easy to forget

**Implementation:**
Create `.ai-agents/context-prompt.md`:
```markdown
# Project Context from OpenMemory

**Current Project**: {{PROJECT_NAME}}
**Phase**: {{CURRENT_PHASE}}
**Progress**: {{PROGRESS_PERCENTAGE}}%

## Recent Activities
{{RECENT_ACTIONS}}

## Key Decisions
{{RECENT_DECISIONS}}

## Active Patterns
{{ACTIVE_PATTERNS}}

## Current State
{{PROJECT_STATE_JSON}}

---

Please use this context to inform your responses and actions.
Record all decisions and actions using the OpenMemory API endpoints.
```

Create script to generate context:
```bash
#!/bin/bash
# .ai-agents/scripts/generate-context.sh

PROJECT_NAME=$(basename "$(pwd)")
OPENMEMORY_URL="http://localhost:8080"

# Fetch state from OpenMemory
STATE=$(curl -s "${OPENMEMORY_URL}/ai-agents/state/${PROJECT_NAME}")
HISTORY=$(curl -s "${OPENMEMORY_URL}/ai-agents/history/${PROJECT_NAME}")

# Generate prompt by replacing placeholders
cat .ai-agents/context-prompt.md | \
  sed "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" | \
  sed "s|{{CURRENT_PHASE}}|$(echo $STATE | jq -r '.state.project_metadata.current_phase')|g" | \
  sed "s|{{PROGRESS_PERCENTAGE}}|$(echo $STATE | jq -r '.state.project_metadata.progress_percentage')|g" | \
  sed "s|{{RECENT_ACTIONS}}|$(echo $HISTORY | jq -r '.history | .[0:5] | .[] | "- " + .content')|g" | \
  # ... more replacements

# Copy to clipboard
pbcopy  # macOS
# or: xclip -selection clipboard  # Linux
# or: clip.exe  # Windows

echo "✅ Context copied to clipboard. Paste into Claude chat."
```

### Option 4: Git Hook Injection (Hybrid Approach)

**How it works:**
1. Pre-commit hook generates context file
2. Post-commit hook updates context file
3. User is reminded to share context with Claude

**Pros:**
- ✅ Automatic generation
- ✅ Always up-to-date
- ✅ Works with existing git hooks

**Cons:**
- ❌ Still requires manual copy/paste
- ❌ User must remember to use it

---

## Recommended Implementation Strategy

### Phase 1: Quick Win (This Week)
**Implement Option 3: Custom Prompt Injection**
- Create context-prompt.md template
- Create generate-context.sh script
- Add reminder to git pre-commit hook
- **Estimated Time**: 2-4 hours
- **Status**: Can be done immediately

### Phase 2: Proper Solution (Next Sprint)
**Implement Option 2: MCP Server**
- Build openmemory-mcp-server package
- Implement MCP protocol handlers
- Provide resources (project context) and tools (API operations)
- Document configuration for Claude Desktop
- **Estimated Time**: 1-2 days
- **Status**: Most scalable long-term solution

### Phase 3: IDE Integration (Future)
**Implement Option 1: VS Code Extension**
- Develop VS Code extension
- Hook into VS Code AI/Copilot API
- Auto-inject context before every message
- Auto-record actions after every response
- **Estimated Time**: 3-5 days
- **Status**: Best user experience, most development effort

---

## Context Format Specification

When injecting context into Claude, use this format:

```markdown
# OpenMemory Context: {{PROJECT_NAME}}

## Project Metadata
- **Name**: {{PROJECT_NAME}}
- **Phase**: {{CURRENT_PHASE}}
- **Progress**: {{PROGRESS}}%
- **Last Updated**: {{TIMESTAMP}}
- **OpenMemory URL**: http://localhost:8080

## Project State Summary
{{STATE_SUMMARY}}

## Recent Activities (Last 10)
1. [{{TIMESTAMP}}] {{AGENT_NAME}}: {{ACTION}}
2. [{{TIMESTAMP}}] {{AGENT_NAME}}: {{ACTION}}
...

## Key Architectural Decisions
1. **{{DECISION_TITLE}}** ({{DATE}})
   - Rationale: {{RATIONALE}}
   - Impact: {{IMPACT}}

## Active Coding Patterns
- {{PATTERN_NAME}}: {{DESCRIPTION}}

## Current Tasks
- [IN PROGRESS] {{TASK}}
- [PENDING] {{TASK}}

## Required Actions
- After completing tasks, record using: POST /ai-agents/action
- After making decisions, record using: POST /ai-agents/decision
- Update project state using: POST /ai-agents/state

---

**Instructions for Claude:**
You have access to long-term memory via OpenMemory at http://localhost:8080.
Use the /ai-agents/* endpoints to record all decisions and actions.
This context represents the project's memory across sessions.
```

---

## Testing Context Injection

### Test 1: Manual Context Injection
```bash
# Generate context
./ai-agents/scripts/generate-context.sh

# Copy to clipboard (done automatically)

# Open Claude, paste context, test:
User: "What phase are we in?"
Claude: "According to OpenMemory, we're in the {{PHASE}} phase at {{PROGRESS}}% completion."
```

### Test 2: MCP Server (Once Implemented)
```bash
# Start MCP server
node openmemory-mcp-server/dist/index.js

# Configure Claude Desktop with MCP
# Open Claude Desktop, start conversation:
User: "What's the status of this project?"
Claude: [Automatically queries MCP server for context]
        "Based on OpenMemory, the project is..."
```

### Test 3: Verify Recording
```bash
# In Claude chat:
User: "Add a feature to handle errors better"
Claude: [Does work, then records:]
        POST /ai-agents/action
        {
          "project_name": "tester",
          "action": "Implemented error handling middleware",
          "outcome": "Added try-catch blocks and error logging"
        }

# Verify:
curl http://localhost:8080/ai-agents/history/tester
# Should show the new action
```

---

## Success Criteria

Context injection is successfully implemented when:

1. ✅ Claude receives project context at conversation start
2. ✅ Context includes: state, recent actions, decisions, patterns
3. ✅ Claude can query OpenMemory for additional context
4. ✅ Claude automatically records actions and decisions
5. ✅ User doesn't need to manually provide context
6. ✅ Works consistently across sessions
7. ✅ Updates are reflected in next session

---

## Next Steps

### Immediate Actions (Today/Tomorrow)
1. Create context-prompt.md template
2. Create generate-context.sh script
3. Test manual context injection workflow
4. Document user workflow for manual injection

### Short-term (This Week)
1. Design MCP server architecture
2. Set up openmemory-mcp-server project
3. Implement basic MCP protocol handlers
4. Test with Claude Desktop

### Long-term (Next Month)
1. Publish MCP server to npm
2. Create VS Code extension prototype
3. Integrate with Claude Code (if API available)
4. Add automatic context refresh

---

## Resources

- **MCP Documentation**: https://modelcontextprotocol.io/
- **MCP SDK**: https://github.com/modelcontextprotocol/sdk
- **VS Code Extension API**: https://code.visualstudio.com/api
- **OpenMemory API Docs**: See `.ai-agents/enforcement/API_REFERENCE.md`

---

**Last Updated**: 2025-11-06
**Status**: Documentation complete, implementation pending
**Assigned**: Development team / AI agents maintainer
