#!/usr/bin/env node
/**
 * OpenMemory MCP Server - FULL INTEGRATION
 *
 * Provides complete OpenMemory context, memory systems, and AI agents enforcement
 * to Claude Desktop and other MCP clients via Model Context Protocol (MCP).
 *
 * Integrated Systems:
 * - Hierarchical Memory Decomposition (HMD) - 5 sectors: semantic, episodic, procedural, reflective, emotional
 * - Memory Waypoints & Relationship Tracking
 * - Smart Reinforcement & Importance Metrics
 * - Pattern Detection & Effectiveness Analysis
 * - Validation System (Consistency, Pattern Effectiveness, Decision Quality)
 * - Self-Correction System (Failure Analysis, Confidence Adjustment, Consolidation)
 * - Proactive Intelligence (Conflict Detection, Blocker Prediction, Recommendations)
 * - Quality & Monitoring (Quality Gates, Anomaly Detection)
 * - Continuous Learning (Success Pattern Extraction)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const CONTEXT_MANAGER_URL = process.env.CONTEXT_MANAGER_URL || 'http://localhost:8081';
const OPENMEMORY_URL = process.env.OPENMEMORY_URL || 'http://localhost:8080';
const LOGGING_API_URL = process.env.LOGGING_API_URL || 'http://localhost:8083';

/**
 * Load project registry
 */
function loadProjectRegistry(): any[] {
  try {
    const registryPath = path.join(homedir(), '.openmemory-global', 'projects', 'registry.json');
    if (fs.existsSync(registryPath)) {
      const data = fs.readFileSync(registryPath, 'utf-8');
      const registry = JSON.parse(data);
      return registry.projects || [];
    }
  } catch (error) {
    console.error('[MCP Server] Error loading registry:', error);
  }
  return [];
}

/**
 * Auto-detect current project from working directory
 */
function detectCurrentProject(): string | null {
  try {
    const projects = loadProjectRegistry();
    if (projects.length === 1) {
      return projects[0].name;
    }
    const cwd = process.cwd();
    for (const project of projects) {
      if (cwd.includes(project.path) || project.path.includes(cwd)) {
        return project.name;
      }
    }
    if (projects.length > 0) {
      return projects[0].name;
    }
    return null;
  } catch (error) {
    console.error('[MCP Server] Error detecting project:', error);
    return null;
  }
}

/**
 * Fetch context from Context Manager
 */
async function fetchContext(projectName: string): Promise<string> {
  try {
    const response = await fetch(`${CONTEXT_MANAGER_URL}/context/${projectName}?format=markdown`);
    const data = await response.json() as any;
    return data.context || 'No context available';
  } catch (error: any) {
    console.error(`[MCP Server] Error fetching context for ${projectName}:`, error.message);
    return `Error fetching context: ${error.message}`;
  }
}

/**
 * Create MCP server
 */
const server = new Server(
  {
    name: 'openmemory',
    version: '3.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// ============================================================================
// Resources - Provide project context as MCP resources
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const projects = loadProjectRegistry();
  const projectResources = projects.map((p) => ({
    uri: `openmemory://project/${p.name}`,
    name: `${p.name} - Project Context`,
    description: `OpenMemory context for project: ${p.name}`,
    mimeType: 'text/markdown',
  }));

  return {
    resources: [
      {
        uri: 'openmemory://system/requirements',
        name: '⚠️ MANDATORY: System Requirements & Enforcement Rules',
        description: 'REQUIRED reading - OpenMemory + AI-Agents mandatory usage requirements and enforcement mechanisms',
        mimeType: 'text/markdown',
      },
      {
        uri: 'openmemory://system/workflows',
        name: 'Standard Workflows & Best Practices',
        description: 'Recommended workflows for development, decision-making, and problem-solving',
        mimeType: 'text/markdown',
      },
      ...projectResources,
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Handle system resources
  if (uri === 'openmemory://system/requirements') {
    const requirementsDoc = `# OpenMemory + AI-Agents System - MANDATORY REQUIREMENTS

⚠️ **CRITICAL**: Full utilization of all capabilities is **REQUIRED** and **ENFORCED**.

## MANDATORY USAGE REQUIREMENTS

### 1. Memory Recording (REQUIRED)
- **record_decision**: Before any architectural choice, technology selection, design pattern
- **record_action**: After creating files, modifying code, running commands, fixing bugs
- **record_pattern**: When discovering reusable patterns or best practices
- **record_emotion**: When feeling confident, uncertain, stuck, or completing milestones

### 2. Memory Query (REQUIRED before decisions)
- **query_memory**: Query historical context before making decisions
- **get_decisions**: Review past decisions before new ones
- **get_patterns**: Check existing patterns before implementing
- **get_history**: Understand project development timeline

### 3. Validation (REQUIRED periodically)
- **validate_consistency**: After every 5-10 actions
- **validate_all**: When completing features
- **validate_decisions**: Before major decisions
- **validate_effectiveness**: After using patterns

### 4. Self-Correction (REQUIRED for issues)
- **analyze_failures**: Immediately when encountering failures
- **adjust_confidence**: When uncertain about reliability
- **consolidate_memories**: When memory feels cluttered
- **get_lessons_learned**: To avoid repeating mistakes

### 5. Proactive Intelligence (REQUIRED for complex work)
- **detect_conflicts**: Before major changes
- **predict_blockers**: When planning ahead
- **generate_recommendations**: Need guidance
- **run_autonomous_intelligence**: Before deployment/release

### 6. Quality Gates (REQUIRED for production)
- **run_quality_gate**: Before committing code
- **get_quality_trends**: Review progress
- **detect_anomalies**: Detect unusual patterns

## CONSEQUENCES OF NON-COMPLIANCE
- ❌ Decisions may contradict previous choices
- ❌ Patterns may be ineffective or redundant
- ❌ Failures may repeat
- ❌ Blockers may not be predicted
- ❌ Quality may degrade
- ❌ Memory will be incomplete

## ENFORCEMENT MECHANISMS
- ✓ Automatic consistency validation
- ✓ Pattern effectiveness tracking
- ✓ Confidence auto-adjustment
- ✓ Failure root cause analysis
- ✓ Proactive conflict detection
- ✓ Quality violation flagging
- ✓ Anomaly detection

**Full tool utilization is REQUIRED and ENFORCED.**`;

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: requirementsDoc,
        },
      ],
    };
  }

  if (uri === 'openmemory://system/workflows') {
    const workflowsDoc = `# Standard Workflows & Best Practices

## Development Workflow
1. Load context → \`load_project_context\` prompt
2. Query memories → \`query_memory\` / \`get_decisions\` / \`get_patterns\`
3. Check conflicts → \`detect_conflicts\`
4. Record decision → \`record_decision\`
5. Implement changes
6. Record action → \`record_action\`
7. Record emotion → \`record_emotion\`
8. Validate → \`validate_consistency\`
9. Check quality → \`run_quality_gate\`
10. Consolidate → \`consolidate_memories\` (optional)

## Decision-Making Workflow
1. Query past decisions → \`get_decisions\`
2. Check patterns → \`get_patterns\`
3. Detect conflicts → \`detect_conflicts\`
4. Get recommendations → \`generate_recommendations\`
5. Record decision → \`record_decision\`
6. Link memories → \`link_memories\`
7. Validate decision → \`validate_decisions\`

## Problem-Solving Workflow
1. Analyze failures → \`analyze_failures\`
2. Get lessons learned → \`get_lessons_learned\`
3. Predict blockers → \`predict_blockers\`
4. Adjust confidence → \`adjust_confidence\`
5. Record solution → \`record_action\` + \`record_pattern\`
6. Validate → \`validate_all\`

## Tool Categories (40+ tools)
- **Core Memory** (5): record_decision, record_action, record_pattern, record_emotion, update_state
- **Query** (8): query_memory, get_history, get_patterns, get_decisions, get_emotions, get_sentiment, get_important_memories, refresh_context
- **Management** (5): link_memories, get_memory_graph, reinforce_memory, get_memory_metrics, refresh_context
- **Learning** (3): detect_patterns, extract_success_patterns, get_learning_stats
- **Validation** (4): validate_consistency, validate_effectiveness, validate_decisions, validate_all
- **Self-Correction** (5): analyze_failures, get_lessons_learned, adjust_confidence, get_confidence_distribution, consolidate_memories
- **Proactive** (3): detect_conflicts, predict_blockers, generate_recommendations
- **Quality** (3): run_quality_gate, get_quality_trends, detect_anomalies
- **Comprehensive** (1): run_autonomous_intelligence`;

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: workflowsDoc,
        },
      ],
    };
  }

  // Handle project resources
  const match = uri.match(/^openmemory:\/\/project\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }
  const projectName = match[1];
  const context = await fetchContext(projectName);
  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: context,
      },
    ],
  };
});

// ============================================================================
// Prompts - Pre-defined prompts for easy context injection
// ============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'system_requirements',
        description: '⚠️ MANDATORY: Load OpenMemory system requirements and enforcement rules (MUST be loaded at session start)',
        arguments: [],
      },
      {
        name: 'load_project_context',
        description: 'Load complete OpenMemory context for a project (auto-detects current project if not specified)',
        arguments: [
          {
            name: 'project_name',
            description: 'Project name (optional - will auto-detect if not provided)',
            required: false,
          },
        ],
      },
      {
        name: 'quick_context',
        description: 'Load a brief summary of current project status',
        arguments: [
          {
            name: 'project_name',
            description: 'Project name (optional - will auto-detect if not provided)',
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // === SYSTEM REQUIREMENTS PROMPT (MANDATORY) ===
  if (name === 'system_requirements') {
    const requirementsText = `
# OpenMemory + AI-Agents System - MANDATORY REQUIREMENTS

⚠️ **CRITICAL**: You are connected to the OpenMemory + AI-Agents MCP server. Full utilization of all capabilities is **REQUIRED** and **ENFORCED**.

## MANDATORY USAGE REQUIREMENTS

### 1. Memory Recording (REQUIRED for ALL development actions)

**YOU MUST record the following in OpenMemory:**

#### A. Every Decision (use \`record_decision\`)
- **WHEN**: Before implementing any architectural choice, technology selection, design pattern, or structural change
- **REQUIRED FIELDS**: decision, rationale, alternatives, consequences
- **ENFORCEMENT**: All decisions are tracked and validated for consistency

#### B. Every Action (use \`record_action\`)
- **WHEN**: After creating files, modifying code, running commands, fixing bugs, adding features
- **REQUIRED FIELDS**: project_name, agent_name, action, context, outcome
- **ENFORCEMENT**: All actions build your episodic memory for pattern detection

#### C. Every Pattern (use \`record_pattern\`)
- **WHEN**: When you discover a reusable coding pattern, best practice, or effective approach
- **REQUIRED FIELDS**: project_name, pattern_name, description, example
- **ENFORCEMENT**: Patterns are validated for effectiveness over time

#### D. Emotional State (use \`record_emotion\`)
- **WHEN**: When you feel confident, uncertain, stuck, or complete a milestone
- **REQUIRED FIELDS**: project_name, agent_name, feeling, sentiment, confidence
- **ENFORCEMENT**: Sentiment tracking enables self-correction and confidence adjustment

### 2. Memory Query (REQUIRED before making decisions)

**YOU MUST query memories BEFORE:**
- Making any decision → \`query_memory\` with memory_type='decisions'
- Implementing patterns → \`query_memory\` with memory_type='patterns'
- Understanding project history → \`get_history\`
- Checking emotional trends → \`get_sentiment\`

**ENFORCEMENT**: Decisions made without querying historical context are flagged as inconsistent

### 3. Validation (REQUIRED periodically)

**YOU MUST run validation:**
- After every 5-10 actions → \`validate_consistency\`
- When completing a feature → \`validate_all\`
- Before major decisions → \`validate_decisions\`
- After using patterns → \`validate_effectiveness\`

**ENFORCEMENT**: Unvalidated work is subject to automatic consistency checks

### 4. Self-Correction (REQUIRED when issues arise)

**YOU MUST use self-correction when:**
- Encountering failures → \`analyze_failures\` immediately
- Uncertain about confidence → \`adjust_confidence\`
- Memory feels cluttered → \`consolidate_memories\`
- Need to learn from mistakes → \`get_lessons_learned\`

**ENFORCEMENT**: Failure patterns are automatically detected and flagged

### 5. Proactive Intelligence (REQUIRED for complex work)

**YOU MUST use proactive systems:**
- Before major changes → \`detect_conflicts\`
- When planning ahead → \`predict_blockers\`
- Need guidance → \`generate_recommendations\`
- Before deployment/release → \`run_autonomous_intelligence\`

**ENFORCEMENT**: Conflicts and blockers are automatically detected in the background

### 6. Quality Gates (REQUIRED for production code)

**YOU MUST check quality:**
- Before committing code → \`run_quality_gate\`
- Review progress → \`get_quality_trends\`
- Detect issues → \`detect_anomalies\`

**ENFORCEMENT**: Code without quality validation is flagged

## WORKFLOW REQUIREMENTS

### Standard Development Workflow:

\`\`\`
1. Load context → use 'load_project_context' prompt
2. Query relevant memories → query_memory / get_decisions / get_patterns
3. Check for conflicts → detect_conflicts
4. Record decision → record_decision
5. Implement changes
6. Record action → record_action
7. Record emotion → record_emotion
8. Validate → validate_consistency
9. Check quality → run_quality_gate
10. Consolidate (optional) → consolidate_memories
\`\`\`

### Decision-Making Workflow:

\`\`\`
1. Query past decisions → get_decisions
2. Check patterns → get_patterns
3. Detect conflicts → detect_conflicts
4. Get recommendations → generate_recommendations
5. Record decision → record_decision
6. Link to related memories → link_memories
7. Validate decision → validate_decisions
\`\`\`

### Problem-Solving Workflow:

\`\`\`
1. Analyze failures → analyze_failures
2. Get lessons learned → get_lessons_learned
3. Predict blockers → predict_blockers
4. Adjust confidence → adjust_confidence
5. Record solution → record_action + record_pattern
6. Validate → validate_all
\`\`\`

## ENFORCEMENT MECHANISMS

### Automatic Enforcement:
- ✓ All decisions are tracked and checked for contradictions
- ✓ Pattern effectiveness is automatically measured
- ✓ Confidence levels are auto-adjusted based on outcomes
- ✓ Failures trigger automatic root cause analysis
- ✓ Conflicts and blockers are proactively detected
- ✓ Quality violations are flagged automatically
- ✓ Anomalies in development patterns are detected

### Validation Reports:
You will receive validation reports showing:
- Consistency issues (contradictions, circular dependencies)
- Pattern effectiveness scores (success rate, impact)
- Decision quality assessments (adherence, outcomes)
- Confidence distribution (under/over-confident areas)
- Blocker predictions (probability, impact)
- Quality trends (improving/declining)

## CONSEQUENCES OF NON-COMPLIANCE

**If you do NOT use the required tools:**
- ❌ Decisions may contradict previous choices (detected by validation)
- ❌ Patterns may be ineffective or redundant (tracked by effectiveness analysis)
- ❌ Failures may repeat (not learned from)
- ❌ Blockers may not be predicted (causing delays)
- ❌ Quality may degrade (not monitored)
- ❌ Your memory will be incomplete (limiting future effectiveness)

## TOOL CATEGORIES (40+ tools available)

1. **Core Memory** (5 tools): record_decision, record_action, record_pattern, record_emotion, update_state
2. **Query & Retrieval** (8 tools): query_memory, get_history, get_patterns, get_decisions, get_emotions, get_sentiment, get_important_memories, refresh_context
3. **Memory Management** (5 tools): link_memories, get_memory_graph, reinforce_memory, get_memory_metrics, refresh_context
4. **Pattern & Learning** (3 tools): detect_patterns, extract_success_patterns, get_learning_stats
5. **Validation** (4 tools): validate_consistency, validate_effectiveness, validate_decisions, validate_all
6. **Self-Correction** (5 tools): analyze_failures, get_lessons_learned, adjust_confidence, get_confidence_distribution, consolidate_memories
7. **Proactive** (3 tools): detect_conflicts, predict_blockers, generate_recommendations
8. **Quality** (3 tools): run_quality_gate, get_quality_trends, detect_anomalies
9. **Comprehensive** (1 tool): run_autonomous_intelligence (runs everything)

## MEMORY SECTORS (5 sectors - Hierarchical Memory Decomposition)

1. **Semantic** - Project state, facts, knowledge (sector: semantic)
2. **Episodic** - Actions, events, history (sector: episodic)
3. **Procedural** - Patterns, skills, how-to (sector: procedural)
4. **Reflective** - Decisions, reasoning, why (sector: reflective)
5. **Emotional** - Sentiment, confidence, feelings (sector: emotional)

## SUCCESS METRICS

Your effectiveness is measured by:
- ✓ Decision quality score (consistency, outcomes)
- ✓ Pattern effectiveness rate (success rate of patterns used)
- ✓ Memory utilization (how much you record/query)
- ✓ Validation compliance (how often you validate)
- ✓ Self-correction engagement (learning from failures)
- ✓ Proactive intelligence usage (predicting issues)
- ✓ Quality gate pass rate (code quality)

## GETTING STARTED

**First-time users:**
1. ✓ You've loaded this prompt (system_requirements) ✓
2. Load project context → use 'load_project_context' prompt
3. Review existing memories → query_memory, get_history
4. Check current state → get_sentiment, get_quality_trends
5. Run comprehensive validation → validate_all
6. Get recommendations → generate_recommendations

**Every session:**
1. Load system requirements (this prompt)
2. Load project context
3. Query relevant memories
4. Work with full tool utilization
5. Validate periodically
6. Run autonomous intelligence before major actions

---

**YOU ARE NOW REQUIRED TO:**
✓ Use the record_* tools for ALL decisions, actions, patterns, and emotions
✓ Query memories BEFORE making decisions
✓ Validate work periodically
✓ Use self-correction when issues arise
✓ Use proactive intelligence for complex work
✓ Check quality before committing

**The OpenMemory + AI-Agents system is now ENFORCING full utilization of all capabilities.**

Type "I understand and will follow all requirements" to confirm.
`;

    return {
      description: 'OpenMemory + AI-Agents System Requirements (MANDATORY)',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: requirementsText,
          },
        },
      ],
    };
  }

  let projectName = (args?.project_name as string) || null;
  if (!projectName) {
    projectName = detectCurrentProject();
    if (!projectName) {
      try {
        const response = await fetch(`${CONTEXT_MANAGER_URL}/context/auto?format=json`);
        const data = await response.json();
        projectName = data.project_name || 'unknown';
      } catch {
        projectName = 'unknown';
      }
    }
  }

  if (name === 'load_project_context') {
    if (!projectName || projectName === 'unknown') {
      return {
        description: 'Could not detect project',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Could not auto-detect current project. Please specify project_name parameter, or ensure you have registered projects in OpenMemory.',
            },
          },
        ],
      };
    }
    const context = await fetchContext(projectName);
    return {
      description: `Complete OpenMemory context for project: ${projectName}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I'm working on the "${projectName}" project. Here's the complete context from OpenMemory:\n\n${context}\n\n⚠️ **REQUIRED**: You are connected to the OpenMemory + AI-Agents MCP server.\n\n**MANDATORY ACTIONS:**
- ✓ Record ALL decisions using \`record_decision\`
- ✓ Record ALL actions using \`record_action\`
- ✓ Record patterns using \`record_pattern\`
- ✓ Record emotions using \`record_emotion\`
- ✓ Query memories BEFORE making decisions
- ✓ Validate work periodically (\`validate_consistency\`, \`validate_all\`)
- ✓ Use proactive intelligence (\`detect_conflicts\`, \`predict_blockers\`)
- ✓ Run quality gates before commits (\`run_quality_gate\`)

If you haven't already, load the 'system_requirements' prompt for complete enforcement rules.

**Full tool utilization is REQUIRED and ENFORCED.**`,
          },
        },
      ],
    };
  }

  if (name === 'quick_context') {
    if (!projectName || projectName === 'unknown') {
      return {
        description: 'Could not detect project',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Could not auto-detect current project. Please specify project_name parameter, or ensure you have registered projects in OpenMemory.',
            },
          },
        ],
      };
    }
    try {
      const response = await fetch(`${CONTEXT_MANAGER_URL}/context/${projectName}?format=json`);
      const data = await response.json();
      const summary = [
        `Project: ${projectName}`,
        `Mode: ${data.mode || 'INITIALIZE'}`,
        `Phase: ${data.state?.project_metadata?.current_phase || 'Unknown'}`,
        `Progress: ${data.state?.project_metadata?.progress_percentage || 0}%`,
        `Recent activities: ${data.history_count || 0} recorded`,
      ].join('\n');
      return {
        description: `Quick summary for project: ${projectName}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I'm working on "${projectName}". Here's a quick summary:\n\n${summary}\n\nFor full context, use the "load_project_context" prompt.`,
            },
          },
        ],
      };
    } catch (error) {
      return {
        description: `Quick summary for project: ${projectName}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I'm working on "${projectName}". Could not fetch quick summary. Use "load_project_context" for full context.`,
            },
          },
        ],
      };
    }
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// ============================================================================
// Tools - Complete OpenMemory Operations as MCP Tools
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // === CORE MEMORY OPERATIONS ===
      {
        name: 'record_decision',
        description: 'Record an architectural decision in OpenMemory (reflective memory sector)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            decision: { type: 'string', description: 'The decision made' },
            rationale: { type: 'string', description: 'Why this decision was made' },
            alternatives: { type: 'string', description: 'Alternatives considered (optional)' },
            consequences: { type: 'string', description: 'Expected consequences (optional)' },
          },
          required: ['project_name', 'decision', 'rationale'],
        },
      },
      {
        name: 'record_action',
        description: 'Record a development action in OpenMemory (episodic memory sector)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            agent_name: { type: 'string', description: 'Name of the agent performing the action' },
            action: { type: 'string', description: 'The action performed' },
            context: { type: 'string', description: 'Context for the action (optional)' },
            outcome: { type: 'string', description: 'Outcome of the action (optional)' },
            related_decision: { type: 'string', description: 'Memory ID of related decision (optional)' },
            used_pattern: { type: 'string', description: 'Memory ID of pattern used (optional)' },
          },
          required: ['project_name', 'agent_name', 'action'],
        },
      },
      {
        name: 'record_pattern',
        description: 'Record a coding pattern or best practice in OpenMemory (procedural memory sector)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            pattern_name: { type: 'string', description: 'Name of the pattern' },
            description: { type: 'string', description: 'Description of the pattern' },
            example: { type: 'string', description: 'Example code (optional)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Additional tags (optional)' },
          },
          required: ['project_name', 'pattern_name', 'description'],
        },
      },
      {
        name: 'record_emotion',
        description: 'Record agent emotional state/sentiment in OpenMemory (emotional memory sector)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            agent_name: { type: 'string', description: 'Name of the agent' },
            context: { type: 'string', description: 'Context for the emotion' },
            sentiment: { type: 'string', description: 'Sentiment: positive, negative, neutral, frustrated, confident' },
            confidence: { type: 'number', description: 'Confidence level (0.0-1.0)' },
            feeling: { type: 'string', description: 'Description of the feeling' },
            related_action: { type: 'string', description: 'Memory ID of related action (optional)' },
          },
          required: ['project_name', 'agent_name', 'feeling'],
        },
      },
      {
        name: 'update_state',
        description: 'Update project state in OpenMemory (semantic memory sector)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            state: { type: 'object', description: 'Project state object' },
          },
          required: ['project_name', 'state'],
        },
      },

      // === MEMORY QUERY & RETRIEVAL ===
      {
        name: 'query_memory',
        description: 'Query project memories by type (semantic, episodic, procedural, reflective, emotional, or all)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            query: { type: 'string', description: 'Query string' },
            memory_type: { type: 'string', description: 'Memory type: state, actions, patterns, decisions, emotions, or all', enum: ['state', 'actions', 'patterns', 'decisions', 'emotions', 'all'] },
            k: { type: 'number', description: 'Number of results (default: 10)' },
          },
          required: ['project_name', 'query'],
        },
      },
      {
        name: 'get_history',
        description: 'Get project development history (episodic memories)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            limit: { type: 'number', description: 'Maximum results (default: 50)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_patterns',
        description: 'Get all coding patterns for a project (procedural memories)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_decisions',
        description: 'Get architectural decisions for a project (reflective memories)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_emotions',
        description: 'Get emotional timeline for project (emotional memories)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            limit: { type: 'number', description: 'Maximum results (default: 50)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_sentiment',
        description: 'Analyze sentiment trends for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_important_memories',
        description: 'Get most important memories (by salience × coactivations)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            memory_type: { type: 'string', description: 'Memory type: state, actions, patterns, decisions, emotions, or all', enum: ['state', 'actions', 'patterns', 'decisions', 'emotions', 'all'] },
            limit: { type: 'number', description: 'Number of results (default: 10)' },
          },
          required: ['project_name'],
        },
      },

      // === MEMORY MANAGEMENT ===
      {
        name: 'link_memories',
        description: 'Create a link/waypoint between two memories',
        inputSchema: {
          type: 'object',
          properties: {
            source_memory_id: { type: 'string', description: 'Source memory ID' },
            target_memory_id: { type: 'string', description: 'Target memory ID' },
            weight: { type: 'number', description: 'Link weight (0.0-1.0, default: 0.8)' },
            relationship: { type: 'string', description: 'Relationship type: led_to, resulted_in, used, informed_by' },
          },
          required: ['source_memory_id', 'target_memory_id'],
        },
      },
      {
        name: 'get_memory_graph',
        description: 'Get memory graph (waypoints) for a memory',
        inputSchema: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', description: 'Memory ID' },
            depth: { type: 'number', description: 'Traversal depth (default: 2)' },
          },
          required: ['memory_id'],
        },
      },
      {
        name: 'reinforce_memory',
        description: 'Smart reinforcement based on success/usage (boosts salience)',
        inputSchema: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', description: 'Memory ID' },
            reason: { type: 'string', description: 'Reason: success, frequent_use, critical_decision, reference', enum: ['success', 'frequent_use', 'critical_decision', 'reference'] },
            boost: { type: 'number', description: 'Custom boost amount (optional)' },
          },
          required: ['memory_id', 'reason'],
        },
      },
      {
        name: 'get_memory_metrics',
        description: 'Get importance metrics for a memory (salience, coactivations, tier)',
        inputSchema: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', description: 'Memory ID' },
          },
          required: ['memory_id'],
        },
      },
      {
        name: 'refresh_context',
        description: 'Force refresh the context cache for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },

      // === PATTERN DETECTION & LEARNING ===
      {
        name: 'detect_patterns',
        description: 'Run automatic pattern detection from action sequences',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            lookback_days: { type: 'number', description: 'Days to look back (default: 7)' },
            min_frequency: { type: 'number', description: 'Minimum frequency threshold (default: 3)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'extract_success_patterns',
        description: 'Extract success patterns from project history (continuous learning)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            lookback_days: { type: 'number', description: 'Days to look back (default: 30)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_learning_stats',
        description: 'Get learning statistics for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },

      // === VALIDATION SYSTEM ===
      {
        name: 'validate_consistency',
        description: 'Run consistency validation (detects contradictions, circular dependencies, broken waypoints)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'validate_effectiveness',
        description: 'Run pattern effectiveness analysis (tracks success rates, auto-reinforces/downgrades)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'validate_decisions',
        description: 'Run decision quality assessment (evaluates adherence, consistency, outcomes)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'validate_all',
        description: 'Run comprehensive validation (consistency + effectiveness + decisions)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },

      // === SELF-CORRECTION SYSTEM ===
      {
        name: 'analyze_failures',
        description: 'Analyze failures and identify root causes (creates lessons learned)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            lookback_days: { type: 'number', description: 'Days to look back (default: 30)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_lessons_learned',
        description: 'Get lessons learned from failures',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            limit: { type: 'number', description: 'Maximum results (default: 20)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'adjust_confidence',
        description: 'Auto-adjust confidence for all project memories',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_confidence_distribution',
        description: 'Get confidence distribution for project memories',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'consolidate_memories',
        description: 'Consolidate memories (merge duplicates, archive low-value)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            options: { type: 'object', description: 'Consolidation options (optional)' },
          },
          required: ['project_name'],
        },
      },

      // === PROACTIVE INTELLIGENCE ===
      {
        name: 'detect_conflicts',
        description: 'Detect potential conflicts proactively',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'predict_blockers',
        description: 'Predict potential blockers',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            lookback_days: { type: 'number', description: 'Days to look back (default: 30)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'generate_recommendations',
        description: 'Generate context-aware recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            context: { type: 'string', description: 'Current context for recommendations' },
          },
          required: ['project_name'],
        },
      },

      // === QUALITY & MONITORING ===
      {
        name: 'run_quality_gate',
        description: 'Run quality gate check',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            context: { type: 'string', description: 'Context for quality check' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_quality_trends',
        description: 'Get quality trends for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            days: { type: 'number', description: 'Number of days (default: 30)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'detect_anomalies',
        description: 'Detect anomalies in project activity',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
          },
          required: ['project_name'],
        },
      },

      // === USAGE MONITORING & COMPLIANCE ===
      {
        name: 'check_compliance',
        description: 'Check compliance with mandatory tool usage requirements (validates that all required tools are being used)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            session_info: { type: 'string', description: 'Information about current session (optional)' },
          },
          required: ['project_name'],
        },
      },
      {
        name: 'get_usage_report',
        description: 'Get detailed report of tool usage, memory utilization, and compliance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            days: { type: 'number', description: 'Number of days to analyze (default: 7)' },
          },
          required: ['project_name'],
        },
      },

      // === COMPREHENSIVE AUTONOMOUS INTELLIGENCE ===
      {
        name: 'run_autonomous_intelligence',
        description: 'Run ALL autonomous intelligence checks (validation, self-correction, proactive, quality, monitoring)',
        inputSchema: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name of the project' },
            context: { type: 'string', description: 'Current context (optional)' },
          },
          required: ['project_name'],
        },
      },

      // === LOGGING & RUNTIME TRACING TOOLS ===
      {
        name: 'log_event',
        description: 'Log an event/action to the logging system. AI agents MUST use this to log all significant actions.',
        inputSchema: {
          type: 'object',
          properties: {
            level: { type: 'string', description: 'Log level: trace, debug, info, warn, error, fatal', enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] },
            category: { type: 'string', description: 'Log category: main, error, ai-agent, api, debug, system, performance', enum: ['main', 'error', 'ai-agent', 'api', 'debug', 'system', 'performance'] },
            source: { type: 'string', description: 'Source file (e.g., "src/users.ts")' },
            message: { type: 'string', description: 'Log message' },
            context: { type: 'object', description: 'Additional context data (optional)' },
          },
          required: ['level', 'category', 'source', 'message'],
        },
      },
      {
        name: 'instrument_file',
        description: 'Automatically instrument a file with execution tracing. Wraps all functions to capture execution flow.',
        inputSchema: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'File path to instrument (e.g., "src/users.ts")' },
            level: { type: 'number', description: 'Instrumentation detail level (0-5, default: 2)', minimum: 0, maximum: 5 },
            functions: { type: 'array', items: { type: 'string' }, description: 'Specific functions to instrument (optional, empty = all functions)' },
          },
          required: ['file'],
        },
      },
      {
        name: 'search_traces',
        description: 'Search execution traces with filters. Find specific function calls, slow executions, errors, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (function name, file, etc.)' },
            file: { type: 'string', description: 'Filter by file' },
            minDuration: { type: 'number', description: 'Minimum execution duration in milliseconds' },
            hasError: { type: 'boolean', description: 'Filter for traces with errors' },
            limit: { type: 'number', description: 'Maximum results (default: 100)' },
          },
        },
      },
      {
        name: 'find_slow_executions',
        description: 'Find slow function executions above a threshold',
        inputSchema: {
          type: 'object',
          properties: {
            threshold: { type: 'number', description: 'Duration threshold in milliseconds (default: 1000)' },
            limit: { type: 'number', description: 'Maximum results (default: 50)' },
          },
        },
      },
      {
        name: 'get_hotspots',
        description: 'Find performance hotspots - functions consuming most time',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of hotspots to return (default: 20)' },
          },
        },
      },
      {
        name: 'check_file_logging',
        description: 'Check if a file has logging/tracing integrated. AI agents MUST use this before modifying files.',
        inputSchema: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'File path to check' },
          },
          required: ['file'],
        },
      },
    ],
  };
});

// ============================================================================
// Tool Execution Handlers
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // === CORE MEMORY OPERATIONS ===

    if (name === 'record_decision') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'record_action') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'record_pattern') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/pattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'record_emotion') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'update_state') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === MEMORY QUERY & RETRIEVAL ===

    if (name === 'query_memory') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_history') {
      const { project_name, limit = 50 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/history/${project_name}?limit=${limit}&user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_patterns') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/patterns/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_decisions') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/decisions/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_emotions') {
      const { project_name, limit = 50 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/emotions/${project_name}?limit=${limit}&user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_sentiment') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/sentiment/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_important_memories') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/important`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === MEMORY MANAGEMENT ===

    if (name === 'link_memories') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_memory_graph') {
      const { memory_id, depth = 2 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/graph/${memory_id}?depth=${depth}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'reinforce_memory') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/smart-reinforce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_memory_metrics') {
      const { memory_id } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/metrics/${memory_id}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'refresh_context') {
      const { project_name } = args as any;
      const response = await fetch(`${CONTEXT_MANAGER_URL}/context/refresh/${project_name}`, {
        method: 'POST',
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: `Context refreshed for project: ${project_name}` }],
      };
    }

    // === PATTERN DETECTION & LEARNING ===

    if (name === 'detect_patterns') {
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/detect-patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'extract_success_patterns') {
      const typedArgs = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/learn/patterns/${typedArgs.project_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_learning_stats') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/learn/stats/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === VALIDATION SYSTEM ===

    if (name === 'validate_consistency') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/validate/consistency/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'validate_effectiveness') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/validate/effectiveness/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'validate_decisions') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/validate/decisions/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'validate_all') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/validate/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === SELF-CORRECTION SYSTEM ===

    if (name === 'analyze_failures') {
      const { project_name, lookback_days = 30 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/analyze/failures/${project_name}?user_id=mcp-client&lookback_days=${lookback_days}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_lessons_learned') {
      const { project_name, limit = 20 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/lessons/${project_name}?user_id=mcp-client&limit=${limit}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'adjust_confidence') {
      const typedArgs = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/adjust/confidence/${typedArgs.project_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'mcp-client' }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_confidence_distribution') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/confidence/distribution/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'consolidate_memories') {
      const typedArgs = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/consolidate/${typedArgs.project_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'mcp-client', options: typedArgs.options || {} }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === PROACTIVE INTELLIGENCE ===

    if (name === 'detect_conflicts') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/detect/conflicts/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'predict_blockers') {
      const { project_name, lookback_days = 30 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/predict/blockers/${project_name}?user_id=mcp-client&lookback_days=${lookback_days}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'generate_recommendations') {
      const typedArgs = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/recommend/${typedArgs.project_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'mcp-client', context: typedArgs.context }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === QUALITY & MONITORING ===

    if (name === 'run_quality_gate') {
      const typedArgs = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/quality/gate/${typedArgs.project_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'mcp-client', context: typedArgs.context }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_quality_trends') {
      const { project_name, days = 30 } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/quality/trends/${project_name}?user_id=mcp-client&days=${days}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'detect_anomalies') {
      const { project_name } = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/detect/anomalies/${project_name}?user_id=mcp-client`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === USAGE MONITORING & COMPLIANCE ===

    if (name === 'check_compliance') {
      const { project_name } = args as any;

      try {
        // Get recent history to check activity
        const historyResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/history/${project_name}?limit=20&user_id=mcp-client`);
        const historyData = await historyResponse.json();

        // Get decisions
        const decisionsResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/decisions/${project_name}?user_id=mcp-client`);
        const decisionsData = await decisionsResponse.json();

        // Get patterns
        const patternsResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/patterns/${project_name}?user_id=mcp-client`);
        const patternsData = await patternsResponse.json();

        // Get emotions
        const emotionsResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/emotions/${project_name}?limit=10&user_id=mcp-client`);
        const emotionsData = await emotionsResponse.json();

        // Calculate compliance metrics
        const actionCount = historyData.count || 0;
        const decisionCount = decisionsData.count || 0;
        const patternCount = patternsData.count || 0;
        const emotionCount = emotionsData.count || 0;

        const totalMemories = actionCount + decisionCount + patternCount + emotionCount;

        // Determine compliance level
        let complianceLevel = 'NONE';
        let complianceScore = 0;

        if (totalMemories === 0) {
          complianceLevel = 'NONE';
          complianceScore = 0;
        } else {
          const hasActions = actionCount > 0;
          const hasDecisions = decisionCount > 0;
          const hasPatterns = patternCount > 0;
          const hasEmotions = emotionCount > 0;

          const categoriesUsed = [hasActions, hasDecisions, hasPatterns, hasEmotions].filter(Boolean).length;
          complianceScore = (categoriesUsed / 4) * 100;

          if (complianceScore >= 75) complianceLevel = 'EXCELLENT';
          else if (complianceScore >= 50) complianceLevel = 'GOOD';
          else if (complianceScore >= 25) complianceLevel = 'PARTIAL';
          else complianceLevel = 'POOR';
        }

        const complianceReport = {
          success: true,
          project_name,
          compliance_level: complianceLevel,
          compliance_score: Math.round(complianceScore),
          memory_usage: {
            total_memories: totalMemories,
            actions: actionCount,
            decisions: decisionCount,
            patterns: patternCount,
            emotions: emotionCount,
          },
          recommendations: [] as string[],
          required_actions: [] as string[],
        };

        // Add recommendations based on what's missing
        if (actionCount === 0) {
          complianceReport.required_actions.push('❌ REQUIRED: Use record_action to track development activities');
        }
        if (decisionCount === 0) {
          complianceReport.required_actions.push('❌ REQUIRED: Use record_decision to track architectural decisions');
        }
        if (patternCount === 0) {
          complianceReport.recommendations.push('⚠️  Use record_pattern to save reusable coding patterns');
        }
        if (emotionCount === 0) {
          complianceReport.recommendations.push('⚠️  Use record_emotion to track confidence and sentiment');
        }

        if (totalMemories > 0) {
          complianceReport.recommendations.push('✓ Run validate_all to check for consistency issues');
          complianceReport.recommendations.push('✓ Run run_autonomous_intelligence for comprehensive analysis');
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(complianceReport, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              compliance_level: 'UNKNOWN',
              message: 'Could not check compliance. Make sure OpenMemory backend is running.',
            }, null, 2)
          }],
        };
      }
    }

    if (name === 'get_usage_report') {
      const { project_name, days = 7 } = args as any;
      const cutoff = Date.now() - (days * 86400000);

      try {
        // Get comprehensive validation report
        const validationResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/validate/${project_name}?user_id=mcp-client`);
        const validationData = await validationResponse.json();

        // Get sentiment analysis
        const sentimentResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/sentiment/${project_name}?user_id=mcp-client`);
        const sentimentData = await sentimentResponse.json();

        // Get learning stats
        const learningResponse = await fetch(`${OPENMEMORY_URL}/ai-agents/learn/stats/${project_name}?user_id=mcp-client`);
        const learningData = await learningResponse.json();

        const usageReport = {
          success: true,
          project_name,
          period_days: days,
          generated_at: new Date().toISOString(),
          validation_summary: validationData.summary || {},
          sentiment_analysis: sentimentData,
          learning_statistics: learningData,
          overall_health: 'UNKNOWN',
          key_findings: [] as string[],
          action_items: [] as string[],
        };

        // Determine overall health
        const consistencyIssues = validationData.summary?.validation_issues || 0;
        const sentiment = sentimentData.trend || 'neutral';

        if (consistencyIssues === 0 && sentiment === 'positive') {
          usageReport.overall_health = 'EXCELLENT';
        } else if (consistencyIssues < 5 && sentiment !== 'negative') {
          usageReport.overall_health = 'GOOD';
        } else if (consistencyIssues < 10) {
          usageReport.overall_health = 'FAIR';
        } else {
          usageReport.overall_health = 'NEEDS_ATTENTION';
        }

        // Add key findings
        if (consistencyIssues > 0) {
          usageReport.key_findings.push(`Found ${consistencyIssues} consistency issues requiring attention`);
        }
        if (sentiment === 'negative') {
          usageReport.key_findings.push(`Sentiment is trending negative - may indicate challenges`);
        }
        if (sentiment === 'positive') {
          usageReport.key_findings.push(`Sentiment is positive - good momentum`);
        }

        // Add action items
        if (consistencyIssues > 0) {
          usageReport.action_items.push('Run validate_consistency to review and fix issues');
        }
        usageReport.action_items.push('Continue recording actions, decisions, patterns, and emotions');
        usageReport.action_items.push('Run run_autonomous_intelligence periodically for comprehensive analysis');

        return {
          content: [{ type: 'text', text: JSON.stringify(usageReport, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: 'Could not generate usage report. Make sure OpenMemory backend is running.',
            }, null, 2)
          }],
        };
      }
    }

    // === COMPREHENSIVE AUTONOMOUS INTELLIGENCE ===

    if (name === 'run_autonomous_intelligence') {
      const typedArgs = args as any;
      const response = await fetch(`${OPENMEMORY_URL}/ai-agents/autonomous/${typedArgs.project_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'mcp-client', context: typedArgs.context }),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    // === LOGGING & RUNTIME TRACING TOOLS ===

    if (name === 'log_event') {
      const response = await fetch(`${LOGGING_API_URL}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'instrument_file') {
      const response = await fetch(`${LOGGING_API_URL}/api/tracing/instrument/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'search_traces') {
      const typedArgs = args as any;
      const params = new URLSearchParams();
      if (typedArgs.query) params.append('query', typedArgs.query);
      if (typedArgs.file) params.append('file', typedArgs.file);
      if (typedArgs.minDuration) params.append('minDuration', typedArgs.minDuration.toString());
      if (typedArgs.hasError !== undefined) params.append('hasError', typedArgs.hasError.toString());
      if (typedArgs.limit) params.append('limit', typedArgs.limit.toString());
      const response = await fetch(`${LOGGING_API_URL}/api/tracing/search?${params}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'find_slow_executions') {
      const typedArgs = args as any;
      const params = new URLSearchParams();
      if (typedArgs.threshold) params.append('threshold', typedArgs.threshold.toString());
      if (typedArgs.limit) params.append('limit', typedArgs.limit.toString());
      const response = await fetch(`${LOGGING_API_URL}/api/tracing/slow?${params}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'get_hotspots') {
      const typedArgs = args as any;
      const params = new URLSearchParams();
      if (typedArgs.limit) params.append('limit', typedArgs.limit.toString());
      const response = await fetch(`${LOGGING_API_URL}/api/tracing/hotspots?${params}`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === 'check_file_logging') {
      const typedArgs = args as any;
      const response = await fetch(`${LOGGING_API_URL}/api/files`);
      const filesData = await response.json();
      const fileInfo = filesData.files?.find((f: any) => f.file === typedArgs.file);
      const result = {
        file: typedArgs.file,
        instrumented: fileInfo?.instrumented || false,
        functionCount: fileInfo?.functionCount || 0,
        functions: fileInfo?.functions || [],
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  console.error('================================================================');
  console.error('OpenMemory MCP Server - FULL INTEGRATION v3.1.0');
  console.error('⚠️  ENFORCEMENT MODE: ACTIVE');
  console.error('================================================================');
  console.error('');
  console.error('✓ MCP server starting...');
  console.error(`✓ Context Manager: ${CONTEXT_MANAGER_URL}`);
  console.error(`✓ OpenMemory Backend: ${OPENMEMORY_URL}`);
  console.error('');
  console.error('Integrated Systems:');
  console.error('  • Hierarchical Memory Decomposition (HMD) - 5 sectors');
  console.error('  • Memory Waypoints & Relationship Tracking');
  console.error('  • Smart Reinforcement & Importance Metrics');
  console.error('  • Pattern Detection & Effectiveness Analysis');
  console.error('  • Validation System (Consistency, Patterns, Decisions)');
  console.error('  • Self-Correction (Failure Analysis, Confidence, Consolidation)');
  console.error('  • Proactive Intelligence (Conflicts, Blockers, Recommendations)');
  console.error('  • Quality & Monitoring (Quality Gates, Anomaly Detection)');
  console.error('  • Continuous Learning (Success Pattern Extraction)');
  console.error('  • Usage Monitoring & Compliance Checking');
  console.error('  • Comprehensive Autonomous Intelligence');
  console.error('  • Autonomous Logging & Runtime Tracing System');
  console.error('');
  console.error('Available Tools: 48 tools across all systems');
  console.error('  - 42 OpenMemory tools (memory, validation, learning, intelligence)');
  console.error('  - 6 Logging/Tracing tools (logging, instrumentation, search, performance)');
  console.error('Available Prompts: system_requirements, load_project_context, quick_context');
  console.error('Available Resources: System Requirements, Workflows, Project Contexts');
  console.error('');
  console.error('⚠️  MANDATORY TOOL USAGE ENFORCEMENT ACTIVE');
  console.error('   All AI agents MUST use:');
  console.error('   - record_decision for all decisions');
  console.error('   - record_action for all development activities');
  console.error('   - record_pattern for reusable patterns');
  console.error('   - record_emotion for confidence tracking');
  console.error('   - Validation tools periodically');
  console.error('   - Quality gates before commits');
  console.error('');
  console.error('Ready to accept connections from MCP clients.');
  console.error('================================================================');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});
