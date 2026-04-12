@echo off
cd /d C:\restaurant saas app
:start
npm run dev
echo Restarting...
timeout /t 3 >nul
goto start