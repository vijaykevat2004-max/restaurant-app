function Start-Servers {
    $backend = Start-Process -FilePath "cmd" -ArgumentList "/c cd /d C:\restaurant saas app\backend && npx tsx src/index.ts" -PassThru -WindowStyle Hidden
    $frontend = Start-Process -FilePath "cmd" -ArgumentList "/c cd /d C:\restaurant saas app\frontend && npx vite" -PassThru -WindowStyle Hidden
    Write-Host "Backend PID: $($backend.Id)"
    Write-Host "Frontend PID: $($frontend.Id)"
}
Start-Servers
Start-Sleep -Seconds 5
try {
    $result = Invoke-WebRequest -Uri "http://localhost:3002/api/v1/health" -TimeoutSec 5
    Write-Host "Backend: OK"
} catch {
    Write-Host "Backend: Failed"
}
try {
    $result = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 5
    Write-Host "Frontend: OK"
} catch {
    Write-Host "Frontend: Failed"
}