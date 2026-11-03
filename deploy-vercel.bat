@echo off
title ShiftNote AU - 1-Click Vercel Cloud Deployment
echo ============================================================================
echo   Deploy ShiftNote AU Live to Vercel (Production)
echo ============================================================================
echo.
echo This script deploys ShiftNote AU to Vercel's global Sydney edge network.
echo If this is your first time, Vercel will ask you to login in your browser.
echo.
call npx vercel --prod
echo.
echo ============================================================================
echo Deployment process finished.
echo ============================================================================
pause
