@echo off
echo ========================================
echo Medical Health Management System
echo Full Stack Production Deployment
echo ========================================

echo.
echo Step 1: Building Frontend...
cd /d "%~dp0"
if exist dist rmdir /s /q dist
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo ✓ Frontend built successfully

echo.
echo Step 2: Checking Backend Dependencies...
cd backend
npm install --production
if %errorlevel% neq 0 (
    echo ERROR: Backend dependencies installation failed!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

echo.
echo Step 3: Setting up Production Environment...
cd ..
if not exist ".env.production" (
    echo Creating production environment file...
    copy .env .env.production
    echo PORT=4000 >> .env.production
    echo NODE_ENV=production >> .env.production
)
echo ✓ Production environment configured

echo.
echo Step 4: Creating Production Startup Script...
(
echo @echo off
echo echo Starting Medical Health Management System...
echo echo.
echo.
echo echo ========================================
echo echo Starting Backend Server...
echo echo ========================================
echo cd backend
echo start "Backend Server" npm start
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo ========================================
echo echo Starting Frontend Server...
echo echo ========================================
echo cd ..
echo start "Frontend Server" npm run serve
echo echo.
echo echo ========================================
echo echo Deployment Complete!
echo echo ========================================
echo echo Frontend: http://localhost:4173
echo echo Backend:  http://localhost:4000
echo echo API Health: http://localhost:4000/api/health
echo echo.
echo echo Press any key to stop servers...
echo pause ^>nul
echo.
echo echo Stopping servers...
echo taskkill /f /im node.exe ^>nul 2^>^&1
echo echo ✓ All servers stopped
) > start-production.bat

echo ✓ Production startup script created

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo To start the production system:
echo   1. Run: start-production.bat
echo   2. Or manually:
echo      - Backend:  cd backend && npm start
echo      - Frontend: npm run serve
echo.
echo Production URLs:
echo   - Frontend: http://localhost:4173
echo   - Backend:  http://localhost:4000
echo   - Health Check: http://localhost:4000/api/health
echo.
echo Environment files:
echo   - Frontend: .env.production
echo   - Backend: backend/.env
echo.
pause