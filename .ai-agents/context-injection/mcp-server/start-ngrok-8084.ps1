#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start ngrok tunnel for OAuth MCP Server on port 8084

.DESCRIPTION
    Stops any existing ngrok processes, waits for endpoint release,
    then starts fresh ngrok tunnel to port 8084

.EXAMPLE
    .\start-ngrok-8084.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "           Starting ngrok Tunnel for OAuth MCP Server" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

# Kill any existing ngrok processes
Write-Host "Stopping existing ngrok processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq 'ngrok' } | ForEach-Object {
    Write-Host "  Stopping ngrok (PID: $($_.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Wait for endpoint to release
Write-Host "Waiting for ngrok endpoint to release (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start ngrok
Write-Host "Starting ngrok tunnel on port 8084..." -ForegroundColor Green
$ngrokJob = Start-Process -FilePath "ngrok" -ArgumentList "http 8084" -PassThru -WindowStyle Minimized

# Wait for ngrok to initialize
Start-Sleep -Seconds 5

# Get the tunnel URL from ngrok API
try {
    $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
    $httpsUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq 'https' }).public_url

    if ($httpsUrl) {
        Write-Host ""
        Write-Host ("=" * 70) -ForegroundColor Green
        Write-Host "  ngrok Tunnel Active!" -ForegroundColor Green
        Write-Host ("=" * 70) -ForegroundColor Green
        Write-Host ""
        Write-Host "  Public URL: " -NoNewline -ForegroundColor Cyan
        Write-Host $httpsUrl -ForegroundColor Green
        Write-Host "  Local URL:  " -NoNewline -ForegroundColor Cyan
        Write-Host "http://localhost:8084" -ForegroundColor Green
        Write-Host ""
        Write-Host "OAuth Credentials:" -ForegroundColor Yellow
        Write-Host "  Client ID:     fba72649dc07cf7824aa578f6f75ffc7" -ForegroundColor White
        Write-Host "  Client Secret: 7ea51b30220a71ea117316631d4bcd49277d50ed1b2e6db2372c856d0a7d12bb" -ForegroundColor White
        Write-Host ""
        Write-Host "OAuth Endpoints:" -ForegroundColor Yellow
        Write-Host "  Authorization:  $httpsUrl/authorize" -ForegroundColor White
        Write-Host "  Token:          $httpsUrl/oauth/token" -ForegroundColor White
        Write-Host "  Discovery:      $httpsUrl/.well-known/oauth-authorization-server" -ForegroundColor White
        Write-Host ""
        Write-Host ("=" * 70) -ForegroundColor Green
    } else {
        Write-Warning "Could not retrieve ngrok URL"
    }
} catch {
    Write-Warning "Could not connect to ngrok API. Tunnel may still be starting..."
    Write-Host "Check ngrok status at: http://localhost:4040" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to stop ngrok and close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Stop-Process -Id $ngrokJob.Id -Force
