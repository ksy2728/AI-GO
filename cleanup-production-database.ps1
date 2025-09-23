# PowerShell Script for Production Database Cleanup
# This script cleans test data from the production database

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Production Database Cleanup Tool" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check for .env.local file
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with DATABASE_URL" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Load DATABASE_URL from .env.local
Write-Host "Loading DATABASE_URL from .env.local..." -ForegroundColor Yellow
$envContent = Get-Content ".env.local"
$databaseUrl = ""

foreach ($line in $envContent) {
    if ($line -match '^DATABASE_URL="(.+)"$') {
        $databaseUrl = $matches[1]
        break
    }
}

if ($databaseUrl -eq "") {
    Write-Host "ERROR: DATABASE_URL not found in .env.local" -ForegroundColor Red
    Write-Host "Please add: DATABASE_URL='your_neon_database_url'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found DATABASE_URL in .env.local" -ForegroundColor Green
Write-Host ""

# Create SQL cleanup script
Write-Host "Creating cleanup SQL script..." -ForegroundColor Yellow

$sqlScript = @"
-- Production Database Cleanup Script
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

-- Step 1: Show test data that will be deleted
SELECT 'Models to delete:' as info;
SELECT id, name, slug FROM "models"
WHERE name LIKE '%GPT-5%'
   OR name LIKE '%gpt-oss%'
   OR name LIKE '%Grok 3 mini%'
   OR name LIKE '%test%'
   OR name LIKE '%demo%'
   OR name LIKE '%example%'
LIMIT 20;

-- Step 2: Delete related ModelStatus records
DELETE FROM "model_status"
WHERE "model_id" IN (
  SELECT id FROM "models"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 3: Delete related BenchmarkScore records
DELETE FROM "benchmark_scores"
WHERE "model_id" IN (
  SELECT id FROM "models"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 4: Delete related Pricing records
DELETE FROM "pricing"
WHERE "model_id" IN (
  SELECT id FROM "models"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 5: Delete related ModelEndpoint records
DELETE FROM "model_endpoints"
WHERE "model_id" IN (
  SELECT id FROM "models"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 6: Delete related Incident records
DELETE FROM "incidents"
WHERE "model_id" IN (
  SELECT id FROM "models"
  WHERE name LIKE '%GPT-5%'
     OR name LIKE '%gpt-oss%'
     OR name LIKE '%Grok 3 mini%'
     OR name LIKE '%test%'
     OR name LIKE '%demo%'
);

-- Step 7: Delete test models
DELETE FROM "models"
WHERE name LIKE '%GPT-5%'
   OR name LIKE '%gpt-oss%'
   OR name LIKE '%Grok 3 mini%'
   OR name LIKE '%test%'
   OR name LIKE '%demo%'
   OR name LIKE '%example%';

-- Step 8: Show remaining models count
SELECT COUNT(*) as remaining_models FROM "models";

-- Step 9: Show sample of remaining models
SELECT name, slug FROM "models"
ORDER BY created_at DESC
LIMIT 10;
"@

$sqlScript | Out-File -FilePath "cleanup.sql" -Encoding UTF8
Write-Host "SQL script created: cleanup.sql" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   WARNING: This will DELETE test data" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "The following patterns will be removed:" -ForegroundColor Cyan
Write-Host "  - GPT-5*" -ForegroundColor White
Write-Host "  - gpt-oss*" -ForegroundColor White
Write-Host "  - Grok 3 mini*" -ForegroundColor White
Write-Host "  - *test*" -ForegroundColor White
Write-Host "  - *demo*" -ForegroundColor White
Write-Host "  - *example*" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Do you want to proceed with cleanup? (Y/N)"
if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "Cleanup cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executing cleanup script..." -ForegroundColor Yellow
Write-Host ""

# Try executing with psql
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "Found psql, executing cleanup..." -ForegroundColor Green
    & psql $databaseUrl -f cleanup.sql

    if ($LASTEXITCODE -ne 0) {
        Write-Host "psql execution failed, trying Prisma..." -ForegroundColor Yellow
    } else {
        Write-Host "Cleanup executed successfully with psql!" -ForegroundColor Green
    }
} else {
    Write-Host "psql not found, trying with Prisma..." -ForegroundColor Yellow
}

# Try with Prisma if psql failed or not found
if ($LASTEXITCODE -ne 0 -or -not $psqlPath) {
    Write-Host "Executing with Prisma..." -ForegroundColor Yellow
    & npx prisma db execute --file ./cleanup.sql --schema prisma/schema.prisma

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Red
        Write-Host "   Manual Execution Required" -ForegroundColor Red
        Write-Host "============================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Automated execution failed. Please:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Copy the contents of cleanup.sql" -ForegroundColor Cyan
        Write-Host "2. Go to https://console.neon.tech" -ForegroundColor Cyan
        Write-Host "3. Open SQL Editor" -ForegroundColor Cyan
        Write-Host "4. Paste and run the SQL commands" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Or run manually:" -ForegroundColor Yellow
        Write-Host "psql `"$databaseUrl`" -f cleanup.sql" -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Cleanup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Verify results
Write-Host "Verifying results..." -ForegroundColor Yellow
Write-Host ""

$apiUrl = "https://ai-server-information.vercel.app/api/v1/models?limit=3"
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    $testDataFound = $false

    foreach ($model in $response.models) {
        if ($model.name -match "GPT-5|gpt-oss|Grok 3 mini") {
            $testDataFound = $true
            break
        }
    }

    if ($testDataFound) {
        Write-Host "WARNING: Test data may still be present in API." -ForegroundColor Yellow
        Write-Host "This could be due to caching. Wait a few minutes and check again." -ForegroundColor Yellow
    } else {
        Write-Host "SUCCESS: No test data found in API response!" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not verify API response. Check manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://ai-server-information.vercel.app/models" -ForegroundColor White
Write-Host "2. Verify that test data is gone" -ForegroundColor White
Write-Host "3. Check that real model data is displayed" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"