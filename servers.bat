@echo off
:loop
cd /d "%~dp0backend"
node dist\index.js
echo Server stopped, restarting...
timeout /t 2 >nul
goto loop