@echo off
echo ============================================
echo   QR AttendEase - Quick Start
echo ============================================
echo.

echo [1/2] Checking project structure...
if exist "server\index.js" (
    echo   ✓ Backend files found
) else (
    echo   ✗ Backend files missing!
    exit /b 1
)

if exist "src\components\StudentDashboard.jsx" (
    echo   ✓ Frontend files found
) else (
    echo   ✗ Frontend files missing!
    exit /b 1
)

echo.
echo [2/2] Installation instructions:
echo.
echo   Terminal 1 - Backend:
echo   ---------------------
echo   cd server
echo   npm install
echo   npm start
echo.
echo   Terminal 2 - Frontend:
echo   ----------------------
echo   npm install
echo   npm run dev
echo.
echo   Then open: http://localhost:5173
echo.
echo ============================================
echo   Press any key to exit...
echo ============================================
pause >nul
