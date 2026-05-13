@echo off
echo Starting Medical Health Management System...
echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
cd backend
start "Backend Server" npm run prod
timeout /t 3 /nobreak >nul
echo.
echo ========================================
echo Starting Frontend Server...
echo ========================================
cd ..
start "Frontend Server" npm run serve
echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Frontend: http://localhost:4173
echo Backend:  http://localhost:4000
echo API Health: http://localhost:4000/api/health
echo.
echo Press any key to stop servers...
pause >nul
echo.
echo Stopping servers...
taskkill /f /im node.exe >nul 2>&1
echo ✓ All servers stopped