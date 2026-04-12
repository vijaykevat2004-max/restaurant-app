$ErrorActionPreference = "SilentlyContinue"
$jobs = @()

# Start backend
$jobs += Start-Job -ScriptBlock {
    Set-Location "C:\restaurant saas app\backend"
    while ($true) {
        node dist\index.js
        Start-Sleep -Seconds 2
    }
}

# Start frontend
$jobs += Start-Job -ScriptBlock {
    Set-Location "C:\restaurant saas app\frontend"
    while ($true) {
        npx vite --host 0.0.0.0
        Start-Sleep -Seconds 2
    }
}

Write-Host "Servers starting..."
Start-Sleep -Seconds 8
Write-Host "Checking ports..."
Get-NetTCPConnection -LocalPort 3001,5173 | Select-Object LocalPort, State