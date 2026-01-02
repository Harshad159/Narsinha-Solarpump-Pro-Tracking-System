@echo off
echo.
echo ============================================
echo   NARSINHA SOLAR PUMP TRACKING SYSTEM
echo ============================================
echo.
echo [INFO] Backend is hosted on Render.com
echo        API: https://solarpump-backend.onrender.com
echo.
echo [STEP 1] Starting Frontend Development Server...
cd /d "%~dp0"
start "Solar Pump Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
echo.
echo ============================================
echo   FRONTEND STARTED SUCCESSFULLY!
echo ============================================
echo   Open: http://localhost:3000/
echo   Backend: Render.com (Cloud)
echo.
echo   Note: First request may be slow if Render
echo         backend was sleeping (free tier)
echo ============================================
echo.
pause
