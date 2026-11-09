@echo off
echo ========================================================
echo Starting FinAudit AI - FastAPI Backend Server
echo ========================================================
set PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%PATH%
cd backend
python run.py
pause
