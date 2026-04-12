$body = @{
    email = "owner@demo.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
Write-Host $response.Content