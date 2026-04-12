while ($true) {
    cd C:\restaurant saas app
    npm run dev
    Write-Host "Restarting servers..."
    Start-Sleep -Seconds 3
}