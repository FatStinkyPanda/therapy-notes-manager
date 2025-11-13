#!/usr/bin/env node
/**
 * OpenMemory HTTP Gateway for Claude Custom Connectors
 *
 * Exposes OpenMemory MCP tools as REST API endpoints that can be tunneled via ngrok
 * and used with Claude custom connectors.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

const CONTEXT_MANAGER_URL = process.env.CONTEXT_MANAGER_URL || 'http://localhost:8081';
const OPENMEMORY_URL = process.env.OPENMEMORY_URL || 'http://localhost:8080';
const LOGGING_API_URL = process.env.LOGGING_API_URL || 'http://localhost:8083';
const PORT = parseInt(process.env.MCP_HTTP_PORT || '8084');

const app = express();

// Enable CORS for Claude custom connectors
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

console.log('================================================================');
console.log('OpenMemory HTTP Gateway for Claude Custom Connectors v1.0.0');
console.log('================================================================');
console.log('');
console.log('✓ Starting HTTP Gateway...');
console.log(`✓ Port: ${PORT}`);
console.log(`✓ Context Manager: ${CONTEXT_MANAGER_URL}`);
console.log(`✓ OpenMemory Backend: ${OPENMEMORY_URL}`);
console.log(`✓ Logging API: ${LOGGING_API_URL}`);
console.log('');

/**
 * Make API call to backend services
 */
async function callBackend(service: string, endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const baseUrls: Record<string, string> = {
    openmemory: OPENMEMORY_URL,
    context: CONTEXT_MANAGER_URL,
    logging: LOGGING_API_URL
  };

  const baseUrl = baseUrls[service];
  if (!baseUrl) {
    throw new Error(`Unknown service: ${service}`);
  }

  const url = `${baseUrl}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return await response.json();
}

// ============================================================================
// HEALTH & INFO ENDPOINTS
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'openmemory-http-gateway',
    version: '1.0.0',
    port: PORT,
    backends: {
      openmemory: OPENMEMORY_URL,
      context: CONTEXT_MANAGER_URL,
      logging: LOGGING_API_URL
    }
  });
});

app.get('/tools', (req: Request, res: Response) => {
  res.json({
    tools: {
      memory: 42,
      logging: 6,
      total: 48
    },
    categories: [
      'memory_management',
      'validation',
      'learning',
      'intelligence',
      'logging',
      'tracing'
    ],
    endpoints: {
      memory: '/api/memory/*',
      logging: '/api/logging/*',
      context: '/api/context/*'
    }
  });
});

// ============================================================================
// MEMORY MANAGEMENT ENDPOINTS
// ============================================================================

// Record decision
app.post('/api/memory/record-decision', async (req: Request, res: Response) => {
  try {
    const { project_name, decision, rationale, alternatives, consequences } = req.body;
    const result = await callBackend('openmemory', '/memory/record-decision', 'POST', {
      project_name,
      decision,
      rationale,
      alternatives,
      consequences
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record action
app.post('/api/memory/record-action', async (req: Request, res: Response) => {
  try {
    const { project_name, agent_name, action, context, outcome } = req.body;
    const result = await callBackend('openmemory', '/memory/record-action', 'POST', {
      project_name,
      agent_name,
      action,
      context,
      outcome
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Query memory
app.post('/api/memory/query', async (req: Request, res: Response) => {
  try {
    const { project_name, query, memory_type, k } = req.body;
    const result = await callBackend('openmemory', `/memory/query`, 'POST', {
      project_name,
      query,
      memory_type,
      k
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get history
app.get('/api/memory/history/:project_name', async (req: Request, res: Response) => {
  try {
    const { project_name } = req.params;
    const limit = req.query.limit || '50';
    const result = await callBackend('openmemory', `/memory/history/${project_name}?limit=${limit}`, 'GET');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CONTEXT ENDPOINTS
// ============================================================================

app.get('/api/context/:project_name', async (req: Request, res: Response) => {
  try {
    const { project_name } = req.params;
    const format = req.query.format || 'markdown';
    const result = await callBackend('context', `/context/${project_name}?format=${format}`, 'GET');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOGGING ENDPOINTS
// ============================================================================

app.post('/api/logging/log', async (req: Request, res: Response) => {
  try {
    const { level, category, source, message, context } = req.body;
    const result = await callBackend('logging', '/api/log', 'POST', {
      level,
      category,
      source,
      message,
      context
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logging/traces', async (req: Request, res: Response) => {
  try {
    const { query, file, limit } = req.query;
    let endpoint = '/api/tracing/search?';
    if (query) endpoint += `query=${query}&`;
    if (file) endpoint += `file=${file}&`;
    if (limit) endpoint += `limit=${limit}`;

    const result = await callBackend('logging', endpoint, 'GET');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VALIDATION & INTELLIGENCE ENDPOINTS
// ============================================================================

app.post('/api/intelligence/validate-all', async (req: Request, res: Response) => {
  try {
    const { project_name } = req.body;
    const result = await callBackend('openmemory', '/intelligence/validate-all', 'POST', {
      project_name
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/intelligence/run-autonomous', async (req: Request, res: Response) => {
  try {
    const { project_name, context } = req.body;
    const result = await callBackend('openmemory', '/intelligence/run-autonomous', 'POST', {
      project_name,
      context
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('Available Endpoints:');
  console.log('');
  console.log('Health & Info:');
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/tools`);
  console.log('');
  console.log('Memory Management:');
  console.log(`  POST http://localhost:${PORT}/api/memory/record-decision`);
  console.log(`  POST http://localhost:${PORT}/api/memory/record-action`);
  console.log(`  POST http://localhost:${PORT}/api/memory/query`);
  console.log(`  GET  http://localhost:${PORT}/api/memory/history/:project_name`);
  console.log('');
  console.log('Context:');
  console.log(`  GET  http://localhost:${PORT}/api/context/:project_name`);
  console.log('');
  console.log('Logging & Tracing:');
  console.log(`  POST http://localhost:${PORT}/api/logging/log`);
  console.log(`  GET  http://localhost:${PORT}/api/logging/traces`);
  console.log('');
  console.log('Intelligence:');
  console.log(`  POST http://localhost:${PORT}/api/intelligence/validate-all`);
  console.log(`  POST http://localhost:${PORT}/api/intelligence/run-autonomous`);
  console.log('');
  console.log(`✅ HTTP Gateway running on http://localhost:${PORT}`);
  console.log('');
  console.log('🚀 Ready for ngrok tunnel!');
  console.log(`   Run: ngrok http ${PORT}`);
  console.log('');
  console.log('================================================================');
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Shutting down HTTP Gateway...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Shutting down HTTP Gateway...');
  process.exit(0);
});

export default app;
