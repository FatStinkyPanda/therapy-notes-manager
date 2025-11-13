#
# OpenMemory + AI Agents - Windows PowerShell Installer
#
# This script runs the bash installation using Git Bash (included with Git for Windows)
#

$ErrorActionPreference = "Stop"

Write-Host "=====================================================================" -ForegroundColor Blue
Write-Host "OpenMemory + AI Agents - Windows Installation" -ForegroundColor Blue
Write-Host "=====================================================================" -ForegroundColor Blue
Write-Host ""

# Check if Git Bash is installed
$gitBashPaths = @(
    "C:\Program Files\Git\bin\bash.exe",
    "C:\Program Files (x86)\Git\bin\bash.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe"
)

$bashPath = $null
foreach ($path in $gitBashPaths) {
    if (Test-Path $path) {
        $bashPath = $path
        break
    }
}

if (-not $bashPath) {
    Write-Host "ERROR: Git Bash not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Git for Windows is required. Please install it from:" -ForegroundColor Yellow
    Write-Host "https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Git for Windows, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found Git Bash at: $bashPath" -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = $PSScriptRoot
$bashScript = Join-Path $scriptDir "install-global.sh"

if (-not (Test-Path $bashScript)) {
    Write-Host "ERROR: install-global.sh not found at: $bashScript" -ForegroundColor Red
    exit 1
}

# Convert Windows path to Unix path for bash
# C:\Users\... -> /c/Users/...
$bashScriptUnix = $bashScript -replace '\\', '/'
if ($bashScriptUnix -match '^([A-Z]):') {
    $drive = $matches[1].ToLower()
    $bashScriptUnix = $bashScriptUnix -replace '^[A-Z]:', "/$drive"
}

Write-Host "Running bash installation script..." -ForegroundColor Cyan
Write-Host ""

# Run the bash script
& $bashPath -l $bashScriptUnix

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "Installation completed successfully!" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Management scripts installed at: $env:USERPROFILE\.openmemory-global\bin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Cyan
    Write-Host "  openmemory-start         Start OpenMemory backend" -ForegroundColor White
    Write-Host "  openmemory-init          Initialize new project" -ForegroundColor White
    Write-Host "  openmemory-status        Show system status" -ForegroundColor White
    Write-Host "  openmemory-list          List all projects" -ForegroundColor White
    Write-Host "  openmemory-watch         Project auto-detection watcher" -ForegroundColor White
    Write-Host ""
    Write-Host "HOW TO USE IN POWERSHELL:" -ForegroundColor Yellow
    Write-Host "  These are bash scripts. Use this syntax from PowerShell:" -ForegroundColor White
    Write-Host ""
    Write-Host "  # Start backend:" -ForegroundColor Gray
    Write-Host "  & ""$bashPath"" -l $env:USERPROFILE\.openmemory-global\bin\openmemory-start" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Initialize project in current directory:" -ForegroundColor Gray
    Write-Host "  & ""$bashPath"" -l $env:USERPROFILE\.openmemory-global\bin\openmemory-init" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Or use Git Bash directly for simpler commands:" -ForegroundColor Gray
    Write-Host "  # In Git Bash: openmemory-start" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Quick start:" -ForegroundColor Cyan
    Write-Host "  1. Start backend (keep terminal open):" -ForegroundColor White
    Write-Host "     & ""$bashPath"" -l $env:USERPROFILE\.openmemory-global\bin\openmemory-start" -ForegroundColor Gray
    Write-Host "  2. In new project folder:" -ForegroundColor White
    Write-Host "     & ""$bashPath"" -l $env:USERPROFILE\.openmemory-global\bin\openmemory-init" -ForegroundColor Gray
    Write-Host "  3. Start coding - enforcement is active!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Installation failed with exit code: $exitCode" -ForegroundColor Red
    exit $exitCode
}
