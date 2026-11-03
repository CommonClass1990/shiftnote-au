@echo off
setlocal enabledelayedexpansion
title ShiftNote AU - 1-Click Automated Installer

echo ============================================================================
echo   ShiftNote AU - Automated Standalone Installation Wizard
echo ============================================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (version 18 or higher) from:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [1/4] Found Node.js %NODE_VER% - OK.

:: 2. Configure Environment File
if not exist ".env.local" (
    echo [2/4] Initializing local configuration (.env.local)...
    copy ".env.example" ".env.local" >nul
    echo       Created .env.local with default local demo settings.
) else (
    echo [2/4] Found existing .env.local - OK.
)

:: 3. Install Dependencies
echo [3/4] Installing project dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    exit /b 1
)

:: 4. Build Standalone Production Bundle
echo [4/4] Compiling optimized standalone production build...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build compilation failed.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo   SUCCESS! ShiftNote AU is installed and ready to run.
echo ============================================================================
echo.
echo You can start the app anytime by double-clicking 'run.bat'.
echo.
set /p START_NOW="Would you like to launch ShiftNote AU now? (Y/N): "
if /i "%START_NOW%"=="Y" (
    call run.bat
)

