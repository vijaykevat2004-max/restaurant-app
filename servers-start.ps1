# Keep servers running in background
$ErrorActionPreference = "SilentlyContinue"

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\restaurant saas app\backend"
    npx tsx src\index.ts
} 

# Start frontend in background  
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\restaurant saas app\frontend"
    npx vite
}

Write-Host "Servers starting..."

# Wait and check
Start-Sleep -Seconds 10

# Try to access
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3004/api/v1/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "Backend API: SUCCESS"
} catch {
    Write-Host "Backend API: FAILED"
}

Write-Host "Done - check http://localhost:5173"