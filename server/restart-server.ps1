# Server Restart Script

Write-Host "Restarting CRMS Server..." -ForegroundColor Cyan

# Find process on port 5000
$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Host "Found server process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
    Write-Host "Stopping server..." -ForegroundColor Red
    
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
    
    Write-Host "Server stopped" -ForegroundColor Green
} else {
    Write-Host "No server running on port 5000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host "Location: c:/laragon/www/crms/server" -ForegroundColor Gray
Write-Host ""

# Start the server
Set-Location "c:/laragon/www/crms/server"
Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow

Start-Sleep -Seconds 3

# Check if it started
$newConnection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($newConnection) {
    Write-Host "Server started successfully on port 5000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing /api/roles endpoint..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/roles" -ErrorAction Stop
        Write-Host "Endpoint is accessible!" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "Endpoint exists (requires authentication)" -ForegroundColor Green
        } else {
            Write-Host "Endpoint test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Server failed to start!" -ForegroundColor Red
    Write-Host "Try running manually: node server.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Server should now be running with updated routes" -ForegroundColor Cyan
