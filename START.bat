@echo off
echo ====================================
echo Apna Restaurant - Starting Servers
echo ====================================
echo.

echo Starting Backend Server...
start "ApnaBackend" cmd /k "cd /d C:\restaurant saas app\backend && npx tsx src\index.ts"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "ApnaFrontend" cmd /k "cd /d C:\restaurant saas app\frontend && npm run dev"

echo.
echo ====================================
echo Servers are starting!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo ====================================
pause
