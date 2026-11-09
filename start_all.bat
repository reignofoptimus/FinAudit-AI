@echo off
echo ========================================================
echo Launching FinAudit AI Full-Stack Application
echo ========================================================
start "FinAudit AI - Backend (Port 8000)" cmd /k "call start_backend.bat"
timeout /t 3 /nobreak >nul
start "FinAudit AI - Frontend (Port 5173)" cmd /k "call start_frontend.bat"
echo.
echo Both servers initiated!
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://127.0.0.1:5173
echo.
