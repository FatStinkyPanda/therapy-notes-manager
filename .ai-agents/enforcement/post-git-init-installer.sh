#!/bin/bash
#
# Post-Git-Init Hook Installer
#
# This script automatically installs AI agent enforcement hooks
# AFTER git init is run (solves timing issue)
#
# Usage:
#   Can be called manually: ./post-git-init-installer.sh
#   Or set up as git template
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}Post-Git-Init: AI Agent Enforcement Hook Installer${NC}"
echo -e "${BLUE}=====================================================================${NC}"
echo ""

# Find project root
if git rev-parse --git-dir > /dev/null 2>&1; then
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
else
    echo -e "${RED}❌ ERROR: Not in a git repository${NC}"
    exit 1
fi

PROJECT_NAME="$(basename "$PROJECT_ROOT")"
AI_AGENTS_DIR="$PROJECT_ROOT/.ai-agents"
ENFORCEMENT_DIR="$AI_AGENTS_DIR/enforcement"
GIT_HOOKS_SOURCE="$ENFORCEMENT_DIR/git-hooks"

echo "Project: $PROJECT_NAME"
echo "Root: $PROJECT_ROOT"
echo ""

# Check if .ai-agents exists
if [ ! -d "$AI_AGENTS_DIR" ]; then
    echo -e "${YELLOW}⚠${NC}  .ai-agents directory not found"
    echo "   This project may not be initialized with OpenMemory"
    echo "   Run: openmemory-init"
    exit 1
fi
echo -e "${GREEN}✓${NC} .ai-agents directory found"

# Check if enforcement hooks exist
if [ ! -f "$GIT_HOOKS_SOURCE/pre-commit" ]; then
    echo -e "${YELLOW}⚠${NC}  Enforcement hooks not found in .ai-agents/enforcement/git-hooks/"
    echo "   Run openmemory-init to set up enforcement system"
    exit 1
fi
echo -e "${GREEN}✓${NC} Enforcement hooks found"

# Run the installation script (prefer Node.js version for cross-platform)
INSTALL_SCRIPT_JS="$GIT_HOOKS_SOURCE/install-hooks.js"
INSTALL_SCRIPT_SH="$GIT_HOOKS_SOURCE/install-hooks.sh"

if [ -f "$INSTALL_SCRIPT_JS" ]; then
    echo ""
    echo "Running hook installer (Node.js)..."
    node "$INSTALL_SCRIPT_JS" "$PROJECT_ROOT"
elif [ -f "$INSTALL_SCRIPT_SH" ]; then
    chmod +x "$INSTALL_SCRIPT_SH"
    echo ""
    echo "Running hook installer (bash)..."
    "$INSTALL_SCRIPT_SH" "$PROJECT_ROOT"
else
    echo -e "${RED}❌ ERROR: install-hooks script not found${NC}"
    exit 1
fi

echo ""

# Update enforcement-status.json
ENFORCEMENT_STATUS="$ENFORCEMENT_DIR/enforcement-status.json"
if [ -f "$ENFORCEMENT_STATUS" ]; then
    # Read project name from .openmemory file
    PROJECT_NAME="$PROJECT_NAME"
    if [ -f "$PROJECT_ROOT/.openmemory" ]; then
        PROJECT_NAME=$(grep "PROJECT_NAME=" "$PROJECT_ROOT/.openmemory" | cut -d'=' -f2)
    fi

    # Update status file
    cat > "$ENFORCEMENT_STATUS" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S+00:00")",
  "git_hooks_installed": true,
  "hooks": ["pre-commit"],
  "enforcement_active": true,
  "project": "$PROJECT_NAME"
}
EOF
    echo -e "${GREEN}✓${NC} Updated enforcement-status.json"
fi

# Remove .hooks-pending marker if it exists
if [ -f "$AI_AGENTS_DIR/.hooks-pending" ]; then
    rm "$AI_AGENTS_DIR/.hooks-pending"
    echo -e "${GREEN}✓${NC} Removed pending marker"
fi

echo ""
echo -e "${GREEN}=====================================================================${NC}"
echo -e "${GREEN}✅ POST-GIT-INIT HOOK INSTALLATION COMPLETE${NC}"
echo -e "${GREEN}=====================================================================${NC}"
echo ""
echo "Enforcement Status: ACTIVE"
echo "  • Git hooks will validate all commits"
echo "  • AI agents must record actions in OpenMemory"
echo "  • Project state tracked automatically"
echo ""

exit 0
