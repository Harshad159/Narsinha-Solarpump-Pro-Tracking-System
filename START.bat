@echo off
echo.
echo ============================================
echo   NARSINHA SOLAR PUMP TRACKING SYSTEM
echo ============================================
echo.
cd /d "%~dp0server"
echo [1/2] Starting API Server...
npm start
pause
