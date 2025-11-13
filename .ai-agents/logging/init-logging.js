#!/usr/bin/env node
/**
 * Autonomous Logging System - Initialization Script
 *
 * Sets up the complete logging infrastructure:
 * - Creates directory structure
 * - Generates configuration files
 * - Initializes registries
 * - Starts API server (optional)
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function printBanner() {
  console.log('');
  log('═'.repeat(70), colors.cyan);
  log('      Autonomous Logging System - Initialization', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);
  console.log('');
}

function printSuccess() {
  console.log('');
  log('═'.repeat(70), colors.green);
  log('✅ Logging System Initialized Successfully!', colors.bright + colors.green);
  log('═'.repeat(70), colors.green);
  console.log('');
}

/**
 * Create directory structure
 */
function createDirectories() {
  log('Creating directory structure...', colors.blue);

  const basePath = path.join(process.cwd(), '.ai-agents', 'logging');
  const directories = [
    'config',
    'logs/latest',
    'logs/archive',
    'integrations',
    'integrations/hooks',
    'integrations/templates',
    'api',
    'api/endpoints',
    'api/middleware',
    'api/utils',
    'core',
    'enforcement',
    'reports',
    'scripts'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(basePath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`  ✓ Created: ${dir}`, colors.green);
    } else {
      log(`  ⊙ Exists: ${dir}`, colors.yellow);
    }
  });

  console.log('');
}

/**
 * Verify configuration files exist
 */
function verifyConfigFiles() {
  log('Verifying configuration files...', colors.blue);

  const basePath = path.join(process.cwd(), '.ai-agents', 'logging');
  const requiredFiles = [
    'config/.env.logging',
    'config/logging.config.json',
    'config/filters.json',
    'integrations/registry.json'
  ];

  let allExist = true;
  requiredFiles.forEach(file => {
    const fullPath = path.join(basePath, file);
    if (fs.existsSync(fullPath)) {
      log(`  ✓ Found: ${file}`, colors.green);
    } else {
      log(`  ✗ Missing: ${file}`, colors.red);
      allExist = false;
    }
  });

  if (!allExist) {
    log('\n⚠️  Some configuration files are missing!', colors.yellow);
    log('Please ensure all required files are present.', colors.yellow);
  }

  console.log('');
  return allExist;
}

/**
 * Initialize log files
 */
function initializeLogFiles() {
  log('Initializing log files...', colors.blue);

  const logsPath = path.join(process.cwd(), '.ai-agents', 'logging', 'logs', 'latest');
  const logFiles = [
    'main.latest.log',
    'error.latest.log',
    'ai-agent.latest.log',
    'api.latest.log',
    'debug.latest.log',
    'system.latest.log',
    'performance.latest.log'
  ];

  logFiles.forEach(file => {
    const fullPath = path.join(logsPath, file);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '');
      log(`  ✓ Created: ${file}`, colors.green);
    } else {
      log(`  ⊙ Exists: ${file}`, colors.yellow);
    }
  });

  console.log('');
}

/**
 * Load environment variables from .env.logging
 */
function loadEnvironment() {
  const envPath = path.join(process.cwd(), '.ai-agents', 'logging', 'config', '.env.logging');

  if (!fs.existsSync(envPath)) {
    log('⚠️  .env.logging not found, using defaults', colors.yellow);
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

/**
 * Check if logging is enabled
 */
function checkEnabled() {
  const env = loadEnvironment();
  const enabled = env.LOGGING_ENABLED !== 'false';

  if (!enabled) {
    log('⚠️  Logging is DISABLED in .env.logging', colors.yellow);
    log('To enable, set LOGGING_ENABLED=true', colors.yellow);
    return false;
  }

  log('✓ Logging is ENABLED', colors.green);
  return true;
}

/**
 * Check system status
 */
function checkSystemStatus() {
  log('System Status:', colors.bright + colors.blue);
  console.log('');

  const env = loadEnvironment();
  const enabled = env.LOGGING_ENABLED !== 'false';
  const port = env.LOGGING_API_PORT || '8082';

  log(`  Logging Enabled:     ${enabled ? '✓ Yes' : '✗ No'}`, enabled ? colors.green : colors.red);
  log(`  API Port:            ${port}`, colors.cyan);
  log(`  Max File Size:       ${env.LOGGING_MAX_FILE_SIZE_MB || '100'} MB`, colors.cyan);
  log(`  Rotation Interval:   ${env.LOGGING_ROTATION_INTERVAL_HOURS || '24'} hours`, colors.cyan);
  log(`  Archive Retention:   ${env.LOGGING_ARCHIVE_RETENTION_DAYS || '30'} days`, colors.cyan);
  log(`  AI Enforcement:      ${env.LOGGING_REQUIRE_AI_AGENTS !== 'false' ? '✓ Required' : '✗ Optional'}`, colors.cyan);
  log(`  Auto Integration:    ${env.LOGGING_AUTO_INTEGRATE_NEW_FILES !== 'false' ? '✓ Enabled' : '✗ Disabled'}`, colors.cyan);

  console.log('');
}

/**
 * Display next steps
 */
function displayNextSteps() {
  log('Next Steps:', colors.bright + colors.cyan);
  console.log('');

  log('1. Review Configuration:', colors.cyan);
  log('   .ai-agents/logging/config/.env.logging', colors.yellow);
  console.log('');

  log('2. Read Documentation:', colors.cyan);
  log('   .ai-agents/logging/README.md', colors.yellow);
  log('   .ai-agents/logging/ARCHITECTURE.md', colors.yellow);
  log('   .ai-agents/logging/ENFORCEMENT.md', colors.yellow);
  console.log('');

  log('3. Verify API is Running:', colors.cyan);
  const env = loadEnvironment();
  const port = env.LOGGING_API_PORT || '8082';
  log(`   curl http://localhost:${port}/api/health`, colors.yellow);
  console.log('');

  log('4. Test Logging:', colors.cyan);
  log('   See examples in .ai-agents/logging/README.md', colors.yellow);
  console.log('');

  log('5. For AI Agents:', colors.cyan);
  log('   - Logging is REQUIRED for all significant actions', colors.yellow);
  log('   - Use MCP tools: log_event, check_file_logging, etc.', colors.yellow);
  log('   - See ENFORCEMENT.md for complete requirements', colors.yellow);
  console.log('');
}

/**
 * Create integration hooks
 */
function createIntegrationHooks() {
  log('Creating integration hooks...', colors.blue);

  const hooksPath = path.join(process.cwd(), '.ai-agents', 'logging', 'integrations', 'hooks');

  // TypeScript hook
  const tsHook = `import { Logger } from './.ai-agents/logging/core/logger';

const logger = Logger.getInstance(__filename);

// Usage:
// logger.info('Message');
// logger.error('Error', new Error('Details'));
// const timer = logger.startTimer(); /* work */ timer.done();
`;

  fs.writeFileSync(path.join(hooksPath, 'typescript.hook.ts'), tsHook);
  log('  ✓ Created: typescript.hook.ts', colors.green);

  // JavaScript hook
  const jsHook = `const { Logger } = require('./.ai-agents/logging/core/logger');

const logger = Logger.getInstance(__filename);

// Usage:
// logger.info('Message');
// logger.error('Error', new Error('Details'));
// const timer = logger.startTimer(); /* work */ timer.done();
`;

  fs.writeFileSync(path.join(hooksPath, 'javascript.hook.js'), jsHook);
  log('  ✓ Created: javascript.hook.js', colors.green);

  console.log('');
}

/**
 * Create package.json scripts
 */
function suggestScripts() {
  log('Suggested package.json scripts:', colors.cyan);
  console.log('');
  log('  "scripts": {', colors.yellow);
  log('    "logging:init": "node .ai-agents/logging/init-logging.js",', colors.yellow);
  log('    "logging:status": "curl http://localhost:8082/api/status",', colors.yellow);
  log('    "logging:health": "curl http://localhost:8082/api/health",', colors.yellow);
  log('    "logging:rotate": "curl -X POST http://localhost:8082/api/rotate"', colors.yellow);
  log('  }', colors.yellow);
  console.log('');
}

/**
 * Main initialization
 */
async function main() {
  try {
    printBanner();

    // Step 1: Create directories
    createDirectories();

    // Step 2: Verify config files
    const configsExist = verifyConfigFiles();

    if (configsExist) {
      // Step 3: Initialize log files
      initializeLogFiles();

      // Step 4: Create hooks
      createIntegrationHooks();

      // Step 5: Check if enabled
      const enabled = checkEnabled();

      // Step 6: Show status
      checkSystemStatus();

      // Success!
      printSuccess();

      // Step 7: Show next steps
      displayNextSteps();

      // Step 8: Suggest scripts
      suggestScripts();

      log('Installation complete! The logging system is ready to use.', colors.bright + colors.green);
      console.log('');

      if (!enabled) {
        log('⚠️  Note: Logging is currently DISABLED', colors.yellow);
        log('Set LOGGING_ENABLED=true in .env.logging to enable', colors.yellow);
        console.log('');
      }
    } else {
      log('❌ Initialization incomplete - missing configuration files', colors.red);
      log('Please ensure all required files exist before running this script.', colors.red);
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    log('❌ Initialization failed:', colors.red);
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Run initialization
main();
