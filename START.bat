@echo off
echo.
echo ============================================
echo   NARSINHA SOLAR PUMP TRACKING SYSTEM
echo ============================================
echo.
echo [STEP 1] Starting Backend API Server...
cd /d "%~dp0server"
start "Solar Backend Server" cmd /k "npm start"
timeout /t 3 /nobreak > nul
echo.
echo [STEP 2] Backend server started at http://localhost:4000
echo.
echo [STEP 3] Now starting Frontend...
cd /d "%~dp0"
start "Solar Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
echo.
echo ============================================
echo   BOTH SERVERS STARTED SUCCESSFULLY!
echo ============================================
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
pause
