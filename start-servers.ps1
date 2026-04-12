# Run servers
$env:PORT = "3003"
$proc = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd C:\restaurant saas app; npm run dev"
$proc.Id