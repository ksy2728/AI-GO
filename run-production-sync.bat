@echo off
echo ============================================
echo   Production AA Data Sync Script
echo ============================================
echo.

REM 환경 변수 파일 로드
if exist .env.local (
    echo Loading environment from .env.local...
    for /f "tokens=*" %%a in (.env.local) do (
        set %%a
    )
) else (
    echo .env.local file not found!
    echo Please create .env.local with DATABASE_URL
    pause
    exit /b 1
)

echo.
echo Step 1: Testing database connection...
npx prisma db pull --print

if errorlevel 1 (
    echo Database connection failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Running production data cleanup...
echo This will remove test data like GPT-5, gpt-oss-20B, etc.
echo.
choice /C YN /M "Do you want to proceed with cleanup"
if errorlevel 2 goto :skip_cleanup

npm run clean:production

:skip_cleanup
echo.
echo Step 3: Syncing real AA data...
echo This will fetch latest data from Artificial Analysis
echo.
choice /C YN /M "Do you want to sync AA data"
if errorlevel 2 goto :end

npm run sync:aa

echo.
echo ============================================
echo   Sync Process Complete!
echo ============================================
echo.
echo Checking results...
echo.

REM Test the API endpoints
echo Testing /api/v1/models endpoint...
curl -s "https://ai-server-information.vercel.app/api/v1/models?limit=3" | findstr /C:"GPT-5" /C:"gpt-oss"
if not errorlevel 1 (
    echo.
    echo WARNING: Test data still present in API responses!
    echo You may need to clear cache or wait for replication.
)

:end
echo.
echo Process complete. Press any key to exit...
pause > nul