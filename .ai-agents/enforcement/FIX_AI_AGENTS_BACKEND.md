# Fix: Replace Vanilla OpenMemory with AI Agents Fork

## Problem Discovered

Claude Code CLI investigation revealed that the global installation installed **vanilla OpenMemory** instead of the **FatStinkyPanda/OpenMemory fork** which has AI agents support.

**Result:** All `/ai-agents/*` endpoints returned 404, making the entire AI agents enforcement system non-functional.

---

## The Fix

### Current Situation

```
Installed: https://github.com/caviraoss/openmemory.git (vanilla, no AI agents)
Your Fork: https://github.com/FatStinkyPanda/OpenMemory (has AI agents support)
Location:  C:\Users\dbiss\.openmemory-global\backend
```

### What Needs to Happen

Replace the vanilla OpenMemory backend with your fork that includes AI agents routes.

---

## Step-by-Step Fix (Windows PowerShell)

### Step 1: Stop the Running Backend

```powershell
# Find and stop any running OpenMemory backend
Get-Process node | Where-Object {$_.Path -like "*openmemory*"} | Stop-Process -Force

# Or manually find and kill:
netstat -ano | findstr :8080
# Note the PID and:
taskkill /PID <pid> /F
```

### Step 2: Backup Current Installation (Optional)

```powershell
# Create backup
Rename-Item C:\Users\dbiss\.openmemory-global\backend C:\Users\dbiss\.openmemory-global\backend-vanilla-backup
```

### Step 3: Replace with Your Fork

**Option A: Copy from Local Fork (Fastest)**

```powershell
# Copy your existing fork
Copy-Item -Recurse -Force C:\Users\dbiss\Desktop\Projects\Forks\OpenMemory C:\Users\dbiss\.openmemory-global\backend

# Install dependencies
cd C:\Users\dbiss\.openmemory-global\backend\backend
npm install
```

**Option B: Clone Fresh from GitHub**

```powershell
# Remove vanilla installation
Remove-Item -Recurse -Force C:\Users\dbiss\.openmemory-global\backend

# Clone your fork
git clone https://github.com/FatStinkyPanda/OpenMemory.git C:\Users\dbiss\.openmemory-global\backend

# Install dependencies
cd C:\Users\dbiss\.openmemory-global\backend\backend
npm install
```

### Step 4: Start the AI-Agents-Enabled Backend

```powershell
# Start using the management script
& "C:\Program Files\Git\bin\bash.exe" -l C:\Users\dbiss\.openmemory-global\bin\openmemory-start
```

Or in Git Bash:
```bash
openmemory-start
```

---

## Verify the Fix

### Test 1: Health Check

```powershell
curl.exe http://localhost:8080/health
```

Should return:
```json
{"ok":true,"version":"2.0-hsg-tiered",...}
```

### Test 2: AI Agents Decision Endpoint

```powershell
curl.exe -X POST http://localhost:8080/ai-agents/decision -H "Content-Type: application/json" -d '{\"project_name\": \"tester\", \"decision\": \"Test AI agents\", \"rationale\": \"Verifying endpoints work\"}'
```

Should return:
```json
{"id":"...","project_name":"tester","decision":"Test AI agents",...}
```

**NOT** `404: Not Found`!

### Test 3: AI Agents History Endpoint

```powershell
curl.exe http://localhost:8080/ai-agents/history/tester
```

Should return:
```json
[]
```

Or an array of actions if any were recorded.

**NOT** `404: Not Found`!

### Test 4: AI Agents Action Endpoint

```powershell
curl.exe -X POST http://localhost:8080/ai-agents/action -H "Content-Type: application/json" -d '{\"project_name\": \"tester\", \"agent_name\": \"test-agent\", \"action\": \"verify_backend\", \"task_id\": 1}'
```

Should return:
```json
{"id":"...","project_name":"tester","action":"verify_backend",...}
```

---

## Expected Results After Fix

### ✅ What Will Work

1. **AI Agents API Endpoints**
   - ✅ `/ai-agents/decision` - Record architectural decisions
   - ✅ `/ai-agents/action` - Record development actions
   - ✅ `/ai-agents/state` - Get/set project state
   - ✅ `/ai-agents/history/{project}` - Get project history
   - ✅ `/ai-agents/pattern` - Record code patterns
   - ✅ `/ai-agents/emotion` - Record agent sentiment
   - ✅ `/ai-agents/validate/consistency/{project}` - Validate consistency
   - ✅ `/ai-agents/validate/autonomous/{project}` - Validate autonomous mode

2. **Git Pre-Commit Hooks**
   - ✅ Can query AI agent history (no more 404 errors)
   - ✅ Can validate consistency (no more "service not available")
   - ✅ Full 6-step validation runs successfully
   - ✅ No warnings about missing endpoints

3. **OpenMemory Core**
   - ✅ Still works (all standard memory endpoints)
   - ✅ Plus AI agents layer on top

### ⚠️ What Still Won't Work (Yet)

**Claude Code Context Injection**

Even with the AI agents backend working, Claude Code still won't automatically receive context at conversation start. This requires:

1. **VS Code Extension** OR **MCP Integration** that:
   - Queries `/ai-agents/history/{project}` at conversation start
   - Injects context into Claude's conversation
   - Records Claude's actions to `/ai-agents/action` during work

2. **Possible Solutions:**
   - Look for an OpenMemory VS Code extension
   - Check for Claude Desktop MCP server configuration
   - Build a custom VS Code extension
   - Use the `.ai-agents/enforcement/auto-init.ts` script

---

## Future Installations

The installation script has been **permanently fixed**. Future installations will automatically use your fork:

```bash
# This is now correct in install-global.sh
git clone https://github.com/FatStinkyPanda/OpenMemory.git "${BACKEND_DIR}"
```

New installations will:
1. ✅ Clone FatStinkyPanda/OpenMemory (not vanilla)
2. ✅ Include all AI agents routes
3. ✅ Work out of the box

### Auto-Detection

The script also auto-detects vanilla installations and switches to your fork:

```bash
# Checks remote URL
if [[ "$REMOTE_URL" == *"FatStinkyPanda"* ]] || [[ "$REMOTE_URL" == *"ai-agents"* ]]; then
    git pull origin main  # Update fork
else
    # Switch to fork
    rm -rf "${BACKEND_DIR}"
    git clone https://github.com/FatStinkyPanda/OpenMemory.git "${BACKEND_DIR}"
fi
```

---

## Reinstall Method (Alternative)

Instead of manual replacement, you can pull the updated install script and reinstall:

```powershell
# Navigate to your fork
cd C:\Users\dbiss\Desktop\Projects\Forks\OpenMemory

# Pull the latest changes (includes the fix)
git pull

# Reinstall
& .\.ai-agents\enforcement\install-global.ps1
# When asked "Reinstall? (y/N):", type: y
```

This will:
1. Detect the vanilla installation
2. Remove it
3. Clone your fork instead
4. Install dependencies
5. Complete setup

---

## Troubleshooting

### Backend Won't Start

```powershell
# Check for errors
cd C:\Users\dbiss\.openmemory-global\backend\backend
npm run dev
```

Look for:
- Missing dependencies → Run `npm install`
- Port 8080 in use → Kill other process
- Missing .env → Script should create it

### Endpoints Still Return 404

```powershell
# Verify it's your fork
cd C:\Users\dbiss\.openmemory-global\backend
git remote -v
```

Should show:
```
origin  https://github.com/FatStinkyPanda/OpenMemory.git (fetch)
origin  https://github.com/FatStinkyPanda/OpenMemory.git (push)
```

If not, wrong repository was cloned.

### Check AI Agents Routes Exist

```powershell
# Check if routes file exists
Test-Path C:\Users\dbiss\.openmemory-global\backend\backend\src\server\routes\ai-agents.ts
```

Should return: `True`

```powershell
# Verify routes are registered
Get-Content C:\Users\dbiss\.openmemory-global\backend\backend\src\server\index.ts | Select-String "ai-agents"
```

Should show imports and route registration.

---

## Summary

**Problem:** Vanilla OpenMemory installed (no AI agents routes)
**Cause:** Install script cloned wrong repository
**Fix:** Replace backend with FatStinkyPanda/OpenMemory fork
**Result:** All `/ai-agents/*` endpoints will work
**Next:** Configure Claude Code to use these endpoints

---

## Quick Reference

```powershell
# Stop backend
Get-Process node | Where-Object {$_.Path -like "*openmemory*"} | Stop-Process -Force

# Replace backend
Copy-Item -Recurse -Force C:\Users\dbiss\Desktop\Projects\Forks\OpenMemory C:\Users\dbiss\.openmemory-global\backend

# Install dependencies
cd C:\Users\dbiss\.openmemory-global\backend\backend
npm install

# Start backend (PowerShell syntax)
& "C:\Program Files\Git\bin\bash.exe" -l C:\Users\dbiss\.openmemory-global\bin\openmemory-start

# Or in a separate PowerShell window, keep it running in background:
# Start-Process "C:\Program Files\Git\bin\bash.exe" -ArgumentList "-l", "C:\Users\dbiss\.openmemory-global\bin\openmemory-start"

# Test (in a new terminal while backend is running)
curl.exe http://localhost:8080/ai-agents/history/tester
```

---

**Last Updated:** 2025-11-06
**Fix Committed:** commit 57d8c52
**Installation Script:** `.ai-agents/enforcement/install-global.sh`
