# PowerShell Script for Production Database Cleanup (Automatic)
# This script cleans test data from the production database without user prompts

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Production Database Cleanup Tool (Auto)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check for .env.local file
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
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
    exit 1
}

Write-Host "Found DATABASE_URL" -ForegroundColor Green

# Execute with Prisma (most reliable method)
Write-Host "Executing cleanup with Prisma..." -ForegroundColor Yellow

# Set environment variable for Prisma
$env:DATABASE_URL = $databaseUrl

# Use Prisma to execute the cleanup
$cleanupSQL = @"
-- Delete related records first (foreign key constraints)
DELETE FROM "model_status" WHERE "model_id" IN (SELECT id FROM "models" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%' OR name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%example%');
DELETE FROM "benchmark_scores" WHERE "model_id" IN (SELECT id FROM "models" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%' OR name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%example%');
DELETE FROM "pricing" WHERE "model_id" IN (SELECT id FROM "models" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%' OR name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%example%');
DELETE FROM "model_endpoints" WHERE "model_id" IN (SELECT id FROM "models" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%' OR name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%example%');
DELETE FROM "incidents" WHERE "model_id" IN (SELECT id FROM "models" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%' OR name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%example%');

-- Delete the test models
DELETE FROM "models" WHERE name LIKE '%GPT-5%' OR name LIKE '%gpt-oss%' OR name LIKE '%Grok 3 mini%' OR name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%example%';

-- Show result
SELECT COUNT(*) as remaining_models FROM "models";
"@

# Save to file
$cleanupSQL | Out-File -FilePath "cleanup-auto.sql" -Encoding UTF8

# Execute with Prisma
Write-Host "Running cleanup..." -ForegroundColor Yellow
& npx prisma db execute --file ./cleanup-auto.sql --schema prisma/schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   Cleanup Successful!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Cleanup failed. Showing manual instructions..." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual cleanup steps:" -ForegroundColor Yellow
    Write-Host "1. Go to https://console.neon.tech" -ForegroundColor Cyan
    Write-Host "2. Select your database" -ForegroundColor Cyan
    Write-Host "3. Open SQL Editor" -ForegroundColor Cyan
    Write-Host "4. Run the following commands:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $cleanupSQL -ForegroundColor White
}

Write-Host ""
Write-Host "Verifying results..." -ForegroundColor Yellow

# Quick API check
try {
    $response = Invoke-RestMethod -Uri "https://ai-server-information.vercel.app/api/v1/models?limit=3" -Method Get
    $testFound = $false

    foreach ($model in $response.models) {
        if ($model.name -match "GPT-5|gpt-oss|Grok 3 mini") {
            $testFound = $true
            Write-Host "  WARNING: Test model still found: $($model.name)" -ForegroundColor Yellow
        }
    }

    if (-not $testFound) {
        Write-Host "  SUCCESS: No test data found in API!" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not verify via API" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! Check https://ai-server-information.vercel.app/models" -ForegroundColor Cyan