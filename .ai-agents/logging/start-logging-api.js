#!/usr/bin/env node
/**
 * Logging API Server Startup Script
 *
 * Starts the logging and tracing API server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, 'logs');
const API_PORT = process.env.LOGGING_API_PORT || 8083;

console.log('================================================================');
console.log('Autonomous Logging + Runtime Tracing API Server');
console.log('================================================================');
console.log('');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log('✓ Created logs directory');
}

// Check if API server is built
const apiServerPath = path.join(__dirname, 'dist', 'api', 'server.js');
if (!fs.existsSync(apiServerPath)) {
  console.error('❌ API server not built. Please run: npm run build');
  console.error('   Or run: cd .ai-agents/logging && npm install && npm run build');
  process.exit(1);
}

console.log('✓ Starting Logging API server...');
console.log(`✓ Port: ${API_PORT}`);
console.log('✓ System components:');
console.log('  • Autonomous Logging (auto-rotation, archival, search)');
console.log('  • Runtime Execution Tracing (instrumentation, performance)');
console.log('  • 22 MCP tools available via MCP server');
console.log('');
console.log('API Endpoints available at http://localhost:' + API_PORT);
console.log('  - POST /api/log - Log an event');
console.log('  - GET  /api/log/latest - Search logs');
console.log('  - POST /api/tracing/instrument/file - Instrument a file');
console.log('  - GET  /api/tracing/search - Search traces');
console.log('  - GET  /api/tracing/slow - Find slow executions');
console.log('  - GET  /api/tracing/hotspots - Find performance hotspots');
console.log('  - GET  /api/status - System status');
console.log('');
console.log('Press Ctrl+C to stop');
console.log('================================================================');
console.log('');

// Set environment
process.env.LOGGING_API_PORT = API_PORT;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start server
const server = spawn('node', [apiServerPath], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Shutting down Logging API server...');
  server.kill('SIGINT');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Shutting down Logging API server...');
  server.kill('SIGTERM');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
