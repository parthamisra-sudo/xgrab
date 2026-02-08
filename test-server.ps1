# XGrab Server Test - Windows PowerShell
# Run these commands ONE AT A TIME

Write-Host "================================" -ForegroundColor Cyan
Write-Host "XGrab Server Test for Windows" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# TEST 1: Health Check
Write-Host "TEST 1: Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET
    Write-Host "✅ SUCCESS! Server is running!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ FAILED! Server is NOT running!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "ACTION: Start server with: node xgrab-server-fixed.js" -ForegroundColor Yellow
    exit
}

Write-Host ""

# TEST 2: My-Tweets Endpoint
Write-Host "TEST 2: Checking /api/my-tweets endpoint..." -ForegroundColor Yellow
try {
    $body = '{}'
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/my-tweets" -Method POST -Body $body -ContentType "application/json"
    $content = $response.Content | ConvertFrom-Json
    
    if ($content.error -eq "OAuth credentials required") {
        Write-Host "✅ SUCCESS! Endpoint EXISTS!" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor White
        Write-Host ""
        Write-Host "This is the CORRECT response - endpoint is working!" -ForegroundColor Green
        Write-Host "You just need to configure OAuth tokens in Configuration tab." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ UNEXPECTED RESPONSE" -ForegroundColor Yellow
        Write-Host "Response: $($response.Content)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ FAILED! Endpoint NOT FOUND!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "This means your server is running OLD CODE!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "1. Stop server: Ctrl+C in server terminal" -ForegroundColor White
    Write-Host "2. Run: taskkill /F /IM node.exe" -ForegroundColor White
    Write-Host "3. Run: node xgrab-server-fixed.js" -ForegroundColor White
    Write-Host "4. Run this test again" -ForegroundColor White
}

Write-Host ""

# TEST 3: Delete-Tweet Endpoint
Write-Host "TEST 3: Checking /api/delete-tweet endpoint..." -ForegroundColor Yellow
try {
    $body = '{}'
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/delete-tweet" -Method POST -Body $body -ContentType "application/json"
    $content = $response.Content | ConvertFrom-Json
    
    if ($content.error -eq "Missing required parameters") {
        Write-Host "✅ SUCCESS! Endpoint EXISTS!" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor White
    } else {
        Write-Host "⚠️ UNEXPECTED RESPONSE" -ForegroundColor Yellow
        Write-Host "Response: $($response.Content)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ FAILED! Endpoint NOT FOUND!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan