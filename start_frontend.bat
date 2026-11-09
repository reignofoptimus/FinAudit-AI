@echo off
echo ========================================================
echo Starting FinAudit AI - React + Vite Frontend
echo ========================================================
set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
pause
