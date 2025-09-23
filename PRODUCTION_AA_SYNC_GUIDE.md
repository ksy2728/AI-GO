# Production AA Data Sync Deployment Guide

## Overview
This guide provides step-by-step instructions for cleaning production data and setting up real Artificial Analysis (AA) data synchronization.

## Prerequisites
- Production database access (Neon PostgreSQL)
- Vercel deployment access
- Node.js 18+ on local machine

## Phase 1: Clean Production Data

### Step 1: Backup Current Data (Optional but Recommended)
```bash
# Export current production data
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Cleanup Script
```bash
# Install dependencies
npm install

# Set production database URL
export DATABASE_URL="your_production_database_url"

# Run cleanup script
npm run clean:production

# Or directly:
tsx scripts/clean-production-data.ts
```

Expected output:
```
🧹 Starting production database cleanup...
📋 Found X test models to remove
✅ Deleted X status records
✅ Deleted X benchmark scores
✅ Marked all remaining models for AA re-sync
```

## Phase 2: Sync Real AA Data

### Step 1: Test AA Data Fetching Locally
```bash
# Test fetching AA data
tsx scripts/sync-aa-real-data.ts
```

Expected output:
```
🔄 Fetching data from Artificial Analysis...
✅ Fetched X models from AA API
📊 Scraped X models from HTML
Top 5 models:
  - GPT-4o: Score=74.8, Speed=105.8
  - Claude 3.5 Sonnet: Score=75.2, Speed=85.3
  ...
```

### Step 2: Deploy to Vercel

1. **Add environment variables in Vercel:**
```env
AA_AUTO_SYNC=true
AA_SYNC_SCHEDULE=0 */6 * * *  # Every 6 hours
AA_SYNC_ON_STARTUP=true        # Sync on deployment
```

2. **Commit and push changes:**
```bash
git add .
git commit -m "feat: Implement real AA data sync and cleanup test data"
git push origin main
```

3. **Trigger initial sync after deployment:**
```bash
# Manual sync via API
curl -X POST https://your-app.vercel.app/api/v1/sync/aa-realtime \
  -H "Content-Type: application/json" \
  -d '{"cleanFirst": true}'
```

## Phase 3: Validate Production Data

### Step 1: Check API Responses
```bash
# Check models endpoint
curl https://your-app.vercel.app/api/v1/models | jq '.models[0:3]'

# Check highlights endpoint
curl https://your-app.vercel.app/api/v1/models/highlights | jq '.metadata'
```

Expected results:
- `metadata.dataSource` should be `"database"` or `"aa-sync"`
- No test models like "GPT-5" or "gpt-oss-20B"
- Real intelligence scores (typically 50-80 range)

### Step 2: Check UI
1. Visit https://your-app.vercel.app/models
2. Verify charts show real model names
3. Check intelligence scores are realistic
4. Confirm no test data appears

### Step 3: Monitor Sync Status
```bash
# Check sync status
curl https://your-app.vercel.app/api/v1/sync/aa-realtime

# View sync history (if using Redis)
curl https://your-app.vercel.app/api/v1/sync/aa-realtime/history
```

## Phase 4: Setup Automated Sync

### Option 1: Vercel Cron (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/v1/sync/aa-realtime",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Option 2: External Scheduler
Use GitHub Actions, Cloudflare Workers, or any external service to call:
```
POST https://your-app.vercel.app/api/v1/sync/aa-realtime
```

## Monitoring & Maintenance

### Health Checks
```bash
# Create monitoring script
cat > check-aa-sync.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s https://your-app.vercel.app/api/v1/sync/aa-realtime)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" != "idle" ] && [ "$STATUS" != "syncing" ]; then
  echo "⚠️ AA Sync Issue: $RESPONSE"
  # Send alert
fi
EOF

chmod +x check-aa-sync.sh
```

### Manual Operations

**Force sync:**
```bash
curl -X POST https://your-app.vercel.app/api/v1/sync/aa-realtime \
  -H "Content-Type: application/json" \
  -d '{"forceSync": true}'
```

**Clean and resync:**
```bash
curl -X POST https://your-app.vercel.app/api/v1/sync/aa-realtime \
  -H "Content-Type: application/json" \
  -d '{"cleanFirst": true, "forceSync": true}'
```

## Troubleshooting

### Issue: Sync fails with "No models fetched"
**Solution:** Check if AA website structure changed, update scraping logic in `sync-aa-real-data.ts`

### Issue: Test data still appears after cleanup
**Solution:**
1. Check if seed script is running in production build
2. Verify `prisma db seed` is not in build command
3. Clear Redis cache: `cache.del('models:*')`

### Issue: Intelligence scores are 0 or null
**Solution:**
1. Verify AA API/scraping is working
2. Check field mappings in `parseAAApiData()`
3. Enable debug logging to see raw data

## Security Considerations

1. **API Keys:** Never expose AA API keys in client-side code
2. **Rate Limiting:** Implement rate limiting on sync endpoint
3. **Validation:** Always validate scraped data before database insertion
4. **Permissions:** Restrict sync endpoint to admin users or API keys

## Rollback Plan

If issues occur:

1. **Restore from backup:**
```bash
pg_restore -d $DATABASE_URL backup_YYYYMMDD_HHMMSS.sql
```

2. **Disable auto-sync:**
```env
AA_AUTO_SYNC=false
```

3. **Use fallback data:**
Update `/api/v1/models/highlights` to force fallback:
```typescript
// Force fallback mode
return NextResponse.json({
  ...fallbackData,
  metadata: { dataSource: 'fallback' }
})
```

## Success Metrics

After deployment, verify:
- ✅ No test models in production (GPT-5, etc.)
- ✅ Real intelligence scores (50-80 range)
- ✅ Accurate model names and providers
- ✅ Charts display correct data
- ✅ Auto-sync runs every 6 hours
- ✅ No errors in Vercel logs

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Review sync history: `/api/v1/sync/aa-realtime`
3. Enable debug mode: `DEBUG=aa:*`