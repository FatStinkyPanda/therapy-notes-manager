#!/usr/bin/env node
/**
 * OpenMemory MCP SSE Server with OAuth Authorization Code Flow
 *
 * Full OAuth 2.0 Authorization Code flow for Claude custom connectors
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
const LOGGING_API_URL = process.env.LOGGING_API_URL || 'http://localhost:8083';

// OAuth credentials
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || crypto.randomBytes(16).toString('hex');
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || crypto.randomBytes(32).toString('hex');

// Store authorization codes and tokens
const authCodes = new Map<string, { clientId: string, redirectUri: string, expiresAt: number }>();
const accessTokens = new Map<string, { clientId: string, expiresAt: number }>();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('================================================================');
console.log('OpenMemory MCP SSE Server - OAuth Authorization Code Flow');
console.log('================================================================');
console.log('');
console.log('✓ Starting MCP SSE Server with OAuth Authorization Code...');
console.log(`✓ Port: ${PORT}`);
console.log('');
console.log('🔒 OAUTH CREDENTIALS - SAVE THESE!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Client ID:     ${OAUTH_CLIENT_ID}`);
console.log(`Client Secret: ${OAUTH_CLIENT_SECRET}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

/**
 * OAuth Authorization Endpoint
 * Step 1: User authorizes the application
 */
app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state, scope } = req.query;

  console.log('Authorization request:', { response_type, client_id, redirect_uri, state });

  // Validate response_type
  if (response_type !== 'code') {
    return res.status(400).send('Invalid response_type. Only "code" is supported.');
  }

  // Validate client_id
  if (client_id !== OAUTH_CLIENT_ID) {
    return res.status(400).send('Invalid client_id');
  }

  // Validate redirect_uri
  if (!redirect_uri) {
    return res.status(400).send('Missing redirect_uri');
  }

  // Auto-approve (in production, show user consent page)
  // Generate authorization code
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

  // Store authorization code
  authCodes.set(code, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    expiresAt
  });

  console.log('✓ Authorization code generated:', code);

  // Redirect back to Claude with code
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  console.log('✓ Redirecting to:', redirectUrl.toString());
  res.redirect(redirectUrl.toString());
});

/**
 * OAuth Token Endpoint
 * Step 2: Exchange authorization code for access token
 */
app.post('/oauth/token', (req: Request, res: Response) => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

  console.log('Token request:', { grant_type, code, client_id });

  // Validate grant_type
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Only authorization_code grant type is supported'
    });
  }

  // Validate client credentials
  if (client_id !== OAUTH_CLIENT_ID || client_secret !== OAUTH_CLIENT_SECRET) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    });
  }

  // Validate authorization code
  const codeData = authCodes.get(code);
  if (!codeData) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Invalid or expired authorization code'
    });
  }

  // Check expiration
  if (codeData.expiresAt < Date.now()) {
    authCodes.delete(code);
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Authorization code expired'
    });
  }

  // Validate redirect_uri matches
  if (codeData.redirectUri !== redirect_uri) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Redirect URI mismatch'
    });
  }

  // Delete used authorization code (one-time use)
  authCodes.delete(code);

  // Generate access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresIn = 3600; // 1 hour
  const expiresAt = Date.now() + (expiresIn * 1000);

  // Store access token
  accessTokens.set(accessToken, {
    clientId: client_id,
    expiresAt
  });

  console.log('✓ Access token generated successfully');

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
  // Skip auth for public endpoints
  if (req.path === '/health' || req.path === '/authorize' || req.path === '/oauth/token') {
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
  const tokenData = accessTokens.get(token);

  if (!tokenData) {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token not found or expired'
    });
  }

  if (tokenData.expiresAt < Date.now()) {
    accessTokens.delete(token);
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token expired'
    });
  }

  next();
}

app.use(validateOAuthToken);

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'openmemory-mcp-sse-oauth-authcode',
    version: '1.0.0',
    transport: 'sse',
    auth: 'oauth2_authorization_code',
    endpoints: {
      authorize: '/authorize',
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
 * Define MCP tools
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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

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

app.post('/message', (req: Request, res: Response) => {
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log('OAuth Endpoints:');
  console.log(`  Authorize: http://localhost:${PORT}/authorize`);
  console.log(`  Token:     http://localhost:${PORT}/oauth/token`);
  console.log('');
  console.log('MCP SSE Endpoints:');
  console.log(`  Health:    http://localhost:${PORT}/health`);
  console.log(`  SSE:       http://localhost:${PORT}/sse`);
  console.log(`  Messages:  http://localhost:${PORT}/message`);
  console.log('');
  console.log(`✅ MCP SSE Server with OAuth Authorization Code running on http://localhost:${PORT}`);
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
