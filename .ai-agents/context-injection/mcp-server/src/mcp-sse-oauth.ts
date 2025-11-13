#!/usr/bin/env node
/**
 * OpenMemory MCP SSE Server with OAuth Authentication
 *
 * This implements Model Context Protocol over SSE with OAuth 2.0 Client Credentials flow
 * for secure access from Claude custom connectors.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

const PORT = parseInt(process.env.MCP_SSE_PORT || '8084');
const CONTEXT_MANAGER_URL = process.env.CONTEXT_MANAGER_URL || 'http://localhost:8081';
const OPENMEMORY_URL = process.env.OPENMEMORY_URL || 'http://localhost:8080';

// OAuth credentials
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || crypto.randomBytes(16).toString('hex');
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || crypto.randomBytes(32).toString('hex');

// Store active tokens (in production, use Redis or database)
const activeTokens = new Map<string, { clientId: string, expiresAt: number }>();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('================================================================');
console.log('OpenMemory MCP SSE Server with OAuth v1.0.0');
console.log('================================================================');
console.log('');
console.log('✓ Starting MCP SSE Server with OAuth...');
console.log(`✓ Port: ${PORT}`);
console.log('');
console.log('🔒 OAUTH CREDENTIALS - SAVE THESE!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Client ID:     ${OAUTH_CLIENT_ID}`);
console.log(`Client Secret: ${OAUTH_CLIENT_SECRET}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

/**
 * OAuth Token Endpoint
 * Implements OAuth 2.0 Client Credentials flow
 */
app.post('/oauth/token', (req: Request, res: Response) => {
  const { grant_type, client_id, client_secret } = req.body;

  console.log('OAuth token request received:', { grant_type, client_id });

  // Validate grant type
  if (grant_type !== 'client_credentials') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Only client_credentials grant type is supported'
    });
  }

  // Validate credentials
  if (client_id !== OAUTH_CLIENT_ID || client_secret !== OAUTH_CLIENT_SECRET) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }

  // Generate access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresIn = 3600; // 1 hour
  const expiresAt = Date.now() + (expiresIn * 1000);

  // Store token
  activeTokens.set(accessToken, {
    clientId: client_id,
    expiresAt
  });

  console.log('✓ OAuth token generated successfully');

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn
  });
});

/**
 * Middleware to validate OAuth token
 */
function validateOAuthToken(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health and token endpoints
  if (req.path === '/health' || req.path === '/oauth/token') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Missing or invalid Authorization header'
    });
  }

  const token = authHeader.substring(7);
  const tokenData = activeTokens.get(token);

  if (!tokenData) {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token not found or expired'
    });
  }

  if (tokenData.expiresAt < Date.now()) {
    activeTokens.delete(token);
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token expired'
    });
  }

  // Token is valid, proceed
  next();
}

app.use(validateOAuthToken);

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'openmemory-mcp-sse-oauth',
    version: '1.0.0',
    transport: 'sse',
    auth: 'oauth2',
    endpoints: {
      token: '/oauth/token',
      sse: '/sse',
      message: '/message'
    }
  });
});

/**
 * Make API call to backend
 */
async function callBackend(service: string, endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const baseUrls: Record<string, string> = {
    openmemory: OPENMEMORY_URL,
    context: CONTEXT_MANAGER_URL,
  };

  const url = `${baseUrls[service]}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  return await response.json();
}

/**
 * Define all MCP tools
 */
const tools: Tool[] = [
  {
    name: 'record_decision',
    description: 'Record an architectural decision in project memory',
    inputSchema: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Name of the project' },
        decision: { type: 'string', description: 'The decision made' },
        rationale: { type: 'string', description: 'Why this decision was made' },
        alternatives: { type: 'string', description: 'Alternatives considered (optional)' },
        consequences: { type: 'string', description: 'Expected consequences (optional)' }
      },
      required: ['project_name', 'decision', 'rationale']
    }
  },
  {
    name: 'record_action',
    description: 'Record a development action in project history',
    inputSchema: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Name of the project' },
        agent_name: { type: 'string', description: 'Name of the agent performing the action' },
        action: { type: 'string', description: 'The action performed' },
        context: { type: 'string', description: 'Context for the action (optional)' },
        outcome: { type: 'string', description: 'Outcome of the action (optional)' }
      },
      required: ['project_name', 'agent_name', 'action']
    }
  },
  {
    name: 'query_memory',
    description: 'Search project memories',
    inputSchema: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Name of the project' },
        query: { type: 'string', description: 'Search query' },
        memory_type: { type: 'string', description: 'Type of memory (all, decisions, actions, patterns, etc.)' },
        k: { type: 'number', description: 'Number of results to return' }
      },
      required: ['project_name', 'query']
    }
  },
  {
    name: 'get_project_context',
    description: 'Get comprehensive context for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Name of the project' }
      },
      required: ['project_name']
    }
  }
];

/**
 * SSE endpoint for MCP
 */
app.get('/sse', async (req: Request, res: Response) => {
  console.log('✓ New MCP SSE connection established');

  const server = new Server(
    {
      name: 'openmemory',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'record_decision':
          const decisionResult = await callBackend('openmemory', '/memory/record-decision', 'POST', args);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(decisionResult, null, 2)
            }]
          };

        case 'record_action':
          const actionResult = await callBackend('openmemory', '/memory/record-action', 'POST', args);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(actionResult, null, 2)
            }]
          };

        case 'query_memory':
          const queryResult = await callBackend('openmemory', '/memory/query', 'POST', args);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(queryResult, null, 2)
            }]
          };

        case 'get_project_context':
          const projectName = (args as any)?.project_name;
          if (!projectName) {
            throw new Error('project_name is required');
          }
          const contextResult = await callBackend('context', `/context/${projectName}?format=markdown`, 'GET');
          return {
            content: [{
              type: 'text',
              text: contextResult.context || 'No context available'
            }]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  });

  const transport = new SSEServerTransport('/message', res);
  await server.connect(transport);

  console.log('✓ MCP server connected via SSE');
});

/**
 * Message endpoint (required by SSE transport)
 */
app.post('/message', (req: Request, res: Response) => {
  // SSE transport handles this
  res.status(200).end();
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('MCP SSE Endpoints:');
  console.log(`  OAuth Token: http://localhost:${PORT}/oauth/token`);
  console.log(`  Health:      http://localhost:${PORT}/health`);
  console.log(`  SSE:         http://localhost:${PORT}/sse`);
  console.log(`  Messages:    http://localhost:${PORT}/message`);
  console.log('');
  console.log(`✅ MCP SSE Server with OAuth running on http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Configure Claude Custom Connector:');
  console.log('  URL: (your ngrok URL)');
  console.log(`  OAuth Client ID: ${OAUTH_CLIENT_ID}`);
  console.log(`  OAuth Client Secret: ${OAUTH_CLIENT_SECRET}`);
  console.log('');
  console.log('================================================================');
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Shutting down MCP SSE server...');
  process.exit(0);
});
