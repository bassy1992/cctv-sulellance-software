@echo off
echo ========================================
echo Building CCTV Surveillance Installer
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Building Windows installer...
call npm run build:win
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Installer location: dist\CCTV Surveillance Setup %npm_package_version%.exe
echo.
pause
