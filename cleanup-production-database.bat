@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Production Database Cleanup Tool
echo ============================================
echo.
echo This tool will clean test data from production database.
echo Make sure you have PostgreSQL client installed.
echo.

REM Check for .env.local file
if not exist .env.local (
    echo ERROR: .env.local file not found!
    echo Please create .env.local with DATABASE_URL
    goto :error_exit
)

REM Load DATABASE_URL from .env.local
for /f "tokens=1,* delims==" %%A in (.env.local) do (
    if "%%A"=="DATABASE_URL" set DATABASE_URL=%%B
)

REM Remove quotes if present
set DATABASE_URL=!DATABASE_URL:"=!

if "!DATABASE_URL!"=="" (
    echo ERROR: DATABASE_URL not found in .env.local
    echo Please add: DATABASE_URL="your_neon_database_url"
    goto :error_exit
)

echo Found DATABASE_URL in .env.local
echo.

REM Create SQL cleanup script
echo Creating cleanup SQL script...
(
echo -- Production Database Cleanup Script
echo -- Generated: %date% %time%
echo.
echo -- Step 1: Show test data that will be deleted
echo SELECT 'Models to delete:' as info;
echo SELECT id, name, slug FROM "models"
echo WHERE name LIKE '%%GPT-5%%'
echo    OR name LIKE '%%gpt-oss%%'
echo    OR name LIKE '%%Grok 3 mini%%'
echo    OR name LIKE '%%test%%'
echo    OR name LIKE '%%demo%%'
echo    OR name LIKE '%%example%%'
echo LIMIT 20;
echo.
echo -- Step 2: Delete related ModelStatus records
echo DELETE FROM "model_status"
echo WHERE "model_id" IN ^(
echo   SELECT id FROM "models"
echo   WHERE name LIKE '%%GPT-5%%'
echo      OR name LIKE '%%gpt-oss%%'
echo      OR name LIKE '%%Grok 3 mini%%'
echo      OR name LIKE '%%test%%'
echo      OR name LIKE '%%demo%%'
echo ^);
echo.
echo -- Step 3: Delete related BenchmarkScore records
echo DELETE FROM "benchmark_scores"
echo WHERE "model_id" IN ^(
echo   SELECT id FROM "models"
echo   WHERE name LIKE '%%GPT-5%%'
echo      OR name LIKE '%%gpt-oss%%'
echo      OR name LIKE '%%Grok 3 mini%%'
echo      OR name LIKE '%%test%%'
echo      OR name LIKE '%%demo%%'
echo ^);
echo.
echo -- Step 4: Delete related Pricing records
echo DELETE FROM "pricing"
echo WHERE "model_id" IN ^(
echo   SELECT id FROM "models"
echo   WHERE name LIKE '%%GPT-5%%'
echo      OR name LIKE '%%gpt-oss%%'
echo      OR name LIKE '%%Grok 3 mini%%'
echo      OR name LIKE '%%test%%'
echo      OR name LIKE '%%demo%%'
echo ^);
echo.
echo -- Step 5: Delete related ModelEndpoint records
echo DELETE FROM "model_endpoints"
echo WHERE "model_id" IN ^(
echo   SELECT id FROM "models"
echo   WHERE name LIKE '%%GPT-5%%'
echo      OR name LIKE '%%gpt-oss%%'
echo      OR name LIKE '%%Grok 3 mini%%'
echo      OR name LIKE '%%test%%'
echo      OR name LIKE '%%demo%%'
echo ^);
echo.
echo -- Step 6: Delete related Incident records
echo DELETE FROM "incidents"
echo WHERE "model_id" IN ^(
echo   SELECT id FROM "models"
echo   WHERE name LIKE '%%GPT-5%%'
echo      OR name LIKE '%%gpt-oss%%'
echo      OR name LIKE '%%Grok 3 mini%%'
echo      OR name LIKE '%%test%%'
echo      OR name LIKE '%%demo%%'
echo ^);
echo.
echo -- Step 7: Delete test models
echo DELETE FROM "models"
echo WHERE name LIKE '%%GPT-5%%'
echo    OR name LIKE '%%gpt-oss%%'
echo    OR name LIKE '%%Grok 3 mini%%'
echo    OR name LIKE '%%test%%'
echo    OR name LIKE '%%demo%%'
echo    OR name LIKE '%%example%%';
echo.
echo -- Step 8: Show remaining models count
echo SELECT COUNT^(*^) as remaining_models FROM "models";
echo.
echo -- Step 9: Show sample of remaining models
echo SELECT name, slug FROM "models"
echo ORDER BY created_at DESC
echo LIMIT 10;
) > cleanup.sql

echo SQL script created: cleanup.sql
echo.

REM Ask for confirmation
echo ============================================
echo   WARNING: This will DELETE test data
echo ============================================
echo.
echo The following patterns will be removed:
echo   - GPT-5*
echo   - gpt-oss*
echo   - Grok 3 mini*
echo   - *test*
echo   - *demo*
echo   - *example*
echo.
choice /C YN /M "Do you want to proceed with cleanup"
if errorlevel 2 goto :cancelled

echo.
echo Executing cleanup script...
echo.

REM Execute using psql
psql !DATABASE_URL! -f cleanup.sql

if errorlevel 1 (
    echo.
    echo ============================================
    echo   Alternative Method: Using Prisma
    echo ============================================
    echo.
    echo psql command failed. Trying with Prisma...

    REM Try using Prisma
    npx prisma db execute --file ./cleanup.sql --schema prisma/schema.prisma

    if errorlevel 1 (
        echo.
        echo ============================================
        echo   Manual Execution Required
        echo ============================================
        echo.
        echo Automated execution failed. Please:
        echo.
        echo 1. Copy the contents of cleanup.sql
        echo 2. Go to https://console.neon.tech
        echo 3. Open SQL Editor
        echo 4. Paste and run the SQL commands
        echo.
        echo Or run manually:
        echo psql "!DATABASE_URL!" -f cleanup.sql
        goto :error_exit
    )
)

echo.
echo ============================================
echo   Cleanup Complete!
echo ============================================
echo.

REM Verify results
echo Verifying results...
echo.

curl -s "https://ai-server-information.vercel.app/api/v1/models?limit=3" > verify_result.json 2>nul

if exist verify_result.json (
    echo Checking for test data in API...
    findstr /C:"GPT-5" /C:"gpt-oss" /C:"Grok 3 mini" verify_result.json >nul
    if not errorlevel 1 (
        echo.
        echo WARNING: Test data may still be present in API.
        echo This could be due to caching. Wait a few minutes and check again.
    ) else (
        echo SUCCESS: No test data found in API response!
    )

    echo.
    echo Sample API response saved to: verify_result.json
    del verify_result.json
)

goto :success

:cancelled
echo.
echo Cleanup cancelled by user.
goto :end

:error_exit
echo.
echo ============================================
echo   Error occurred during cleanup
echo ============================================
echo.
echo Please check the error messages above.
pause
exit /b 1

:success
echo.
echo Next steps:
echo 1. Visit https://ai-server-information.vercel.app/models
echo 2. Verify that test data is gone
echo 3. Check that real model data is displayed
echo.

:end
echo Press any key to exit...
pause > nul
exit /b 0