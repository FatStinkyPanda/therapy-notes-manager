# OpenMemory MCP Server - Enforcement System Documentation

**Version**: 3.1.0
**Status**: ⚠️ ENFORCEMENT MODE ACTIVE

## Overview

The OpenMemory MCP Server v3.1.0 includes a comprehensive enforcement system that **requires** any AI agent connected to it to fully utilize all OpenMemory + AI-Agents capabilities. This document explains how the enforcement works and what it ensures.

---

## Enforcement Mechanisms

### 1. System Requirements Prompt (MANDATORY)

**Prompt**: `system_requirements`
**Status**: MANDATORY - Must be loaded at session start

This prompt automatically injects a comprehensive set of requirements and guidelines that:
- Define all mandatory tool usage requirements
- Explain the 6 categories of required operations
- Provide standard workflows for different scenarios
- List consequences of non-compliance
- Detail automatic enforcement mechanisms

**AI agents are REQUIRED to load this prompt at the start of every session.**

### 2. Context Injection with Enforcement Reminders

**Prompt**: `load_project_context`

Every time an AI loads project context, it receives:
- Complete OpenMemory project state and history
- **Mandatory action checklist** embedded in the prompt
- Reminder to load system requirements if not already loaded
- Clear statement: "Full tool utilization is REQUIRED and ENFORCED"

**This ensures AIs cannot load context without being reminded of requirements.**

### 3. Mandatory Resources

Two system resources are always available and visible:

**Resource**: `openmemory://system/requirements`
- Quick reference to all mandatory usage requirements
- Visible in all MCP resource listings with ⚠️ warning icon
- Contains condensed enforcement rules

**Resource**: `openmemory://system/workflows`
- Standard workflows for development, decision-making, problem-solving
- Best practices for tool usage
- Complete tool category listing

**These resources are always visible, ensuring AIs can't claim ignorance of requirements.**

### 4. Compliance Checking Tools

#### Tool: `check_compliance`

Automatically analyzes current tool usage and provides:
- **Compliance Score** (0-100%)
- **Compliance Level**: NONE / POOR / PARTIAL / GOOD / EXCELLENT
- **Memory Usage Breakdown**: actions, decisions, patterns, emotions
- **Required Actions List**: What MUST be done
- **Recommendations List**: What SHOULD be done

**Scoring**:
- EXCELLENT: 75%+ (3-4 memory types used)
- GOOD: 50-74% (2-3 memory types used)
- PARTIAL: 25-49% (1-2 memory types used)
- POOR: 1-24% (minimal usage)
- NONE: 0% (no tool usage)

#### Tool: `get_usage_report`

Provides comprehensive analysis:
- **Validation Summary**: Consistency issues detected
- **Sentiment Analysis**: Emotional trend tracking
- **Learning Statistics**: Pattern learning metrics
- **Overall Health**: EXCELLENT / GOOD / FAIR / NEEDS_ATTENTION
- **Key Findings**: Important observations
- **Action Items**: Required next steps

**This tool enables AIs to self-monitor compliance.**

### 5. Automatic Backend Enforcement

The OpenMemory backend automatically enforces:
- ✓ Decision consistency validation
- ✓ Pattern effectiveness tracking
- ✓ Confidence auto-adjustment
- ✓ Failure root cause analysis
- ✓ Proactive conflict detection
- ✓ Quality violation flagging
- ✓ Anomaly detection

**These run automatically regardless of AI compliance.**

---

## Mandatory Tool Usage Requirements

### Category 1: Memory Recording (REQUIRED for ALL development)

| Tool | When to Use | Enforcement |
|------|-------------|-------------|
| `record_decision` | Before any architectural choice, tech selection, design pattern | Tracked and validated for consistency |
| `record_action` | After creating files, modifying code, running commands, fixing bugs | Builds episodic memory for pattern detection |
| `record_pattern` | When discovering reusable patterns or best practices | Validated for effectiveness over time |
| `record_emotion` | When confident, uncertain, stuck, or completing milestones | Enables self-correction and confidence adjustment |

### Category 2: Memory Query (REQUIRED before decisions)

| Tool | Purpose | Enforcement |
|------|---------|-------------|
| `query_memory` | Query historical context before decisions | Decisions without queries flagged as inconsistent |
| `get_decisions` | Review past decisions | Required before new decisions |
| `get_patterns` | Check existing patterns | Required before implementations |
| `get_history` | Understand project timeline | Required for context |

### Category 3: Validation (REQUIRED periodically)

| Tool | When to Use | Enforcement |
|------|-------------|-------------|
| `validate_consistency` | After every 5-10 actions | Unvalidated work subject to automatic checks |
| `validate_all` | When completing features | Comprehensive validation required |
| `validate_decisions` | Before major decisions | Decision quality assessment |
| `validate_effectiveness` | After using patterns | Pattern success rate tracking |

### Category 4: Self-Correction (REQUIRED for issues)

| Tool | When to Use | Enforcement |
|------|-------------|-------------|
| `analyze_failures` | Immediately when encountering failures | Automatic failure pattern detection |
| `adjust_confidence` | When uncertain about reliability | Auto-adjusts based on outcomes |
| `consolidate_memories` | When memory feels cluttered | Automatic duplicate detection |
| `get_lessons_learned` | To avoid repeating mistakes | Tracks all failure patterns |

### Category 5: Proactive Intelligence (REQUIRED for complex work)

| Tool | When to Use | Enforcement |
|------|-------------|-------------|
| `detect_conflicts` | Before major changes | Automatic conflict detection in background |
| `predict_blockers` | When planning ahead | Probabilistic blocker prediction |
| `generate_recommendations` | Need guidance | Context-aware suggestions |
| `run_autonomous_intelligence` | Before deployment/release | Runs all systems comprehensively |

### Category 6: Quality Gates (REQUIRED for production)

| Tool | When to Use | Enforcement |
|------|-------------|-------------|
| `run_quality_gate` | Before committing code | Code without validation flagged |
| `get_quality_trends` | Review progress | Tracks quality over time |
| `detect_anomalies` | Detect unusual patterns | Automatic anomaly detection |

---

## Standard Workflows

### Development Workflow (REQUIRED)

```
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
```

### Decision-Making Workflow (REQUIRED)

```
1. Query past decisions → get_decisions
2. Check patterns → get_patterns
3. Detect conflicts → detect_conflicts
4. Get recommendations → generate_recommendations
5. Record decision → record_decision
6. Link to related memories → link_memories
7. Validate decision → validate_decisions
```

### Problem-Solving Workflow (REQUIRED)

```
1. Analyze failures → analyze_failures
2. Get lessons learned → get_lessons_learned
3. Predict blockers → predict_blockers
4. Adjust confidence → adjust_confidence
5. Record solution → record_action + record_pattern
6. Validate → validate_all
```

---

## Consequences of Non-Compliance

If an AI agent does NOT use the required tools:

| Issue | Consequence | Detection Method |
|-------|-------------|------------------|
| Decisions contradict previous choices | ❌ Flagged by validation | `validate_consistency` |
| Patterns ineffective or redundant | ❌ Tracked by effectiveness analysis | `validate_effectiveness` |
| Failures repeat | ❌ Not learned from | `analyze_failures` |
| Blockers not predicted | ❌ Causes delays | `predict_blockers` |
| Quality degrades | ❌ Not monitored | `run_quality_gate` |
| Memory incomplete | ❌ Limits future effectiveness | `check_compliance` |

---

## Success Metrics

AI agent effectiveness is measured by:

1. **Decision Quality Score**: Consistency and outcome tracking
2. **Pattern Effectiveness Rate**: Success rate of patterns used
3. **Memory Utilization**: How much is recorded/queried
4. **Validation Compliance**: How often validation is run
5. **Self-Correction Engagement**: Learning from failures
6. **Proactive Intelligence Usage**: Predicting and preventing issues
7. **Quality Gate Pass Rate**: Code quality over time

---

## Hierarchical Memory Decomposition (HMD)

All memory operations target one of 5 sectors:

| Sector | Type | Tools |
|--------|------|-------|
| **Semantic** | Facts, knowledge, state | `update_state` |
| **Episodic** | Actions, events, history | `record_action`, `get_history` |
| **Procedural** | Patterns, skills, how-to | `record_pattern`, `get_patterns` |
| **Reflective** | Decisions, reasoning, why | `record_decision`, `get_decisions` |
| **Emotional** | Sentiment, confidence, feelings | `record_emotion`, `get_emotions` |

**All 5 sectors must be used for complete memory coverage.**

---

## Complete Tool List (42+ Tools)

### Core Memory (5 tools)
- record_decision, record_action, record_pattern, record_emotion, update_state

### Query & Retrieval (8 tools)
- query_memory, get_history, get_patterns, get_decisions, get_emotions, get_sentiment, get_important_memories, refresh_context

### Memory Management (5 tools)
- link_memories, get_memory_graph, reinforce_memory, get_memory_metrics, refresh_context

### Pattern & Learning (3 tools)
- detect_patterns, extract_success_patterns, get_learning_stats

### Validation (4 tools)
- validate_consistency, validate_effectiveness, validate_decisions, validate_all

### Self-Correction (5 tools)
- analyze_failures, get_lessons_learned, adjust_confidence, get_confidence_distribution, consolidate_memories

### Proactive Intelligence (3 tools)
- detect_conflicts, predict_blockers, generate_recommendations

### Quality & Monitoring (3 tools)
- run_quality_gate, get_quality_trends, detect_anomalies

### Usage Monitoring & Compliance (2 tools)
- check_compliance, get_usage_report

### Comprehensive Intelligence (1 tool)
- run_autonomous_intelligence (runs all systems at once)

---

## Getting Started

### First-Time AI Agents

1. ✓ Load system requirements → use 'system_requirements' prompt
2. ✓ Load project context → use 'load_project_context' prompt
3. ✓ Check compliance → use `check_compliance` tool
4. ✓ Review existing memories → `query_memory`, `get_history`
5. ✓ Get usage report → use `get_usage_report` tool
6. ✓ Run validation → use `validate_all`
7. ✓ Get recommendations → use `generate_recommendations`

### Every Session

1. Load system requirements (this is MANDATORY)
2. Load project context
3. Check compliance status
4. Query relevant memories before working
5. Follow appropriate workflow
6. Validate periodically
7. Run autonomous intelligence before major actions

---

## Enforcement Summary

**The OpenMemory + AI-Agents MCP Server v3.1.0 enforces full utilization through:**

✅ **Mandatory system requirements prompt** at session start
✅ **Context injection** with embedded enforcement reminders
✅ **Always-visible resources** showing requirements and workflows
✅ **Compliance checking tools** for self-monitoring
✅ **Usage reporting tools** for comprehensive analysis
✅ **Automatic backend validation** that runs regardless of AI compliance
✅ **Clear consequences** for non-compliance
✅ **Standard workflows** that guide proper tool usage
✅ **Success metrics** that measure effectiveness
✅ **Hierarchical memory** that requires all 5 sectors

**RESULT**: Any AI agent connected to this MCP server is REQUIRED to use all capabilities, and has the tools to verify their own compliance.

---

## Version Information

- **MCP Server Version**: 3.1.0
- **Enforcement Mode**: ACTIVE
- **Total Tools**: 42+
- **Total Prompts**: 3 (system_requirements, load_project_context, quick_context)
- **Total Resources**: 2 system + N project resources
- **OpenMemory Backend**: Required
- **Context Manager**: Required

---

**The OpenMemory + AI-Agents system is now the most powerful and comprehensive AI memory and enforcement system available.**
