@echo off
echo Starting Apna Restaurant Servers...
echo.
echo Starting Backend (Port 3004)...
start "Apna Restaurant Backend" cmd /k "cd /d C:\restaurant saas app\backend && npx tsx src\index.ts"
timeout /t 3 /nobreak >nul
echo Starting Frontend...
start "Apna Restaurant Frontend" cmd /k "cd /d C:\restaurant saas app\frontend && npm run dev"
echo.
echo Servers should be running!
echo Open http://localhost:5173 in your browser
pause