#!/usr/bin/env node
/**
 * AI Agent Enforcement - Git Hooks Installation Script
 *
 * Cross-platform Node.js version of install-hooks.sh
 * Works on Windows, macOS, and Linux without requiring bash
 *
 * Usage:
 *   node install-hooks.js [project-root]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function installHooks(projectRoot) {
  log('═'.repeat(70), colors.blue);
  log('AI Agent Enforcement - Git Hooks Installation', colors.blue);
  log('═'.repeat(70), colors.blue);
  console.log('');

  // Determine project root
  if (!projectRoot) {
    try {
      projectRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch (e) {
      projectRoot = path.resolve(__dirname, '../../..');
    }
  }

  projectRoot = path.resolve(projectRoot);
  const projectName = path.basename(projectRoot);
  const gitHooksDir = path.join(projectRoot, '.git', 'hooks');
  const aiAgentsDir = path.join(projectRoot, '.ai-agents');
  const enforcementDir = path.join(aiAgentsDir, 'enforcement');
  const hookTemplatesDir = path.join(enforcementDir, 'git-hooks');

  log(`Project: ${projectName}`, colors.cyan);
  log(`Root: ${projectRoot}`, colors.cyan);
  console.log('');

  // Verify this is a git repository
  if (!fs.existsSync(path.join(projectRoot, '.git'))) {
    log('❌ ERROR: Not a git repository', colors.red);
    log(`   ${projectRoot}/.git not found`, colors.red);
    process.exit(1);
  }
  log('✓ Git repository verified', colors.green);

  // Verify .ai-agents directory exists
  if (!fs.existsSync(aiAgentsDir)) {
    log('⚠  .ai-agents directory not found, creating...', colors.yellow);
    fs.mkdirSync(aiAgentsDir, { recursive: true });
  }
  log('✓ .ai-agents directory verified', colors.green);

  // Create enforcement directories if needed
  if (!fs.existsSync(path.join(enforcementDir, 'git-hooks'))) {
    fs.mkdirSync(path.join(enforcementDir, 'git-hooks'), { recursive: true });
  }
  log('✓ Enforcement directories created', colors.green);

  // Create git hooks directory if needed
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
  }
  log('✓ Git hooks directory ready', colors.green);

  // Function to install a hook
  function installHook(hookName) {
    const sourceHook = path.join(hookTemplatesDir, hookName);
    const targetHook = path.join(gitHooksDir, hookName);

    if (!fs.existsSync(sourceHook)) {
      log(`⚠  Hook template not found: ${hookName} (skipping)`, colors.yellow);
      return false;
    }

    // Backup existing hook if it exists and is different
    if (fs.existsSync(targetHook)) {
      const sourceContent = fs.readFileSync(sourceHook, 'utf-8');
      const targetContent = fs.readFileSync(targetHook, 'utf-8');

      if (sourceContent !== targetContent) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const backupFile = `${targetHook}.backup.${timestamp}`;
        log(`⚠  Backing up existing ${hookName} to ${path.basename(backupFile)}`, colors.yellow);
        fs.copyFileSync(targetHook, backupFile);
      }
    }

    // Copy hook
    fs.copyFileSync(sourceHook, targetHook);

    // Make executable (Unix/Mac - ignored on Windows)
    try {
      fs.chmodSync(targetHook, 0o755);
    } catch (e) {
      // Ignore chmod errors on Windows
    }

    log(`✓ Installed: ${hookName}`, colors.green);
    return true;
  }

  // Install pre-commit hook
  console.log('');
  log('Installing hooks...', colors.blue);
  installHook('pre-commit');

  // Create hook execution log
  const hookLog = path.join(enforcementDir, 'git-hooks', 'hook-executions.log');
  if (!fs.existsSync(hookLog)) {
    fs.writeFileSync(hookLog, '');
  }
  log('✓ Hook execution log created', colors.green);

  // Create config file if it doesn't exist
  const configFile = path.join(aiAgentsDir, 'config.json');
  if (!fs.existsSync(configFile)) {
    log('⚠  config.json not found, creating minimal configuration...', colors.yellow);
    const config = {
      _comment: 'AI Agents + OpenMemory Configuration',
      openmemory: {
        enabled: true,
        base_url: 'http://localhost:8080',
        fallback_to_local: true,
        user_id: 'ai-agent-system'
      },
      agent_config: {
        record_actions: true,
        record_decisions: true,
        store_patterns: true
      },
      enforcement: {
        git_hooks_enabled: true,
        strict_mode: false
      }
    };
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    log('✓ Created config.json with default settings', colors.green);
  } else {
    log('✓ config.json already exists', colors.green);
  }

  // Create enforcement status
  const enforcementStatus = {
    timestamp: new Date().toISOString(),
    git_hooks_installed: true,
    hooks: ['pre-commit'],
    enforcement_active: true,
    project: projectName
  };
  fs.writeFileSync(
    path.join(aiAgentsDir, 'enforcement-status.json'),
    JSON.stringify(enforcementStatus, null, 2)
  );
  log('✓ Enforcement status updated', colors.green);

  // Test the hook (optional - may fail on Windows without bash)
  console.log('');
  log('Testing pre-commit hook...', colors.blue);
  try {
    const testResult = execSync(`"${path.join(gitHooksDir, 'pre-commit')}"`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    log('✓ Pre-commit hook is functional', colors.green);
  } catch (e) {
    // Hook might exit with non-zero in some cases, that's OK for testing
    log(`⚠  Hook executed (may require bash on Windows)`, colors.yellow);
  }

  console.log('');
  log('═'.repeat(70), colors.green);
  log('✅ GIT HOOKS INSTALLATION COMPLETE', colors.green);
  log('═'.repeat(70), colors.green);
  console.log('');
  log('Installed hooks:', colors.green);
  log('  • pre-commit - Validates AI agent compliance before each commit', colors.cyan);
  console.log('');
  log('Important:', colors.yellow);
  log('  • Hooks will run automatically on every commit', colors.cyan);
  log('  • Failed validation will BLOCK the commit', colors.cyan);
  log('  • Emergency bypass: set AI_AGENT_HOOK_BYPASS=true', colors.cyan);
  log('  • All bypasses are logged and monitored', colors.cyan);
  console.log('');
  log('Hook log: .ai-agents/enforcement/git-hooks/hook-executions.log', colors.blue);
  log('Documentation: .ai-agents/enforcement/README.md', colors.blue);
  console.log('');
  log('AI agents can no longer commit without proper validation!', colors.green);
  console.log('');

  // Log installation
  const logEntry = `${new Date().toISOString()} - INSTALLED - Project: ${projectName}, User: ${process.env.USER || process.env.USERNAME || 'unknown'}\n`;
  fs.appendFileSync(hookLog, logEntry);

  return true;
}

// Main
if (require.main === module) {
  const projectRoot = process.argv[2];
  try {
    installHooks(projectRoot);
    process.exit(0);
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, colors.red);
    process.exit(1);
  }
}

module.exports = { installHooks };
