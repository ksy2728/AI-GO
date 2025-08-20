# 🚀 Optimized Sync System Deployment Guide

## Overview
This guide explains how to deploy the optimized sync system that fixes GitHub Actions errors and improves real-time data synchronization.

## 📋 Pre-Deployment Checklist

- [ ] Backup current implementation
- [ ] Test in development environment
- [ ] Review rollback procedures
- [ ] Verify GitHub Actions permissions
- [ ] Check server resources

## 🔧 Deployment Steps

### Step 1: Backup Current System
```bash
# Create backup using the rollback script
node scripts/rollback.js --backup
```

### Step 2: Deploy GitHub Actions Workflow

1. **Replace the problematic workflow:**
```bash
# Remove old workflow
rm .github/workflows/sync-data.yml

# Rename optimized workflow
mv .github/workflows/sync-data-optimized.yml .github/workflows/sync-data.yml
```

2. **Commit and push:**
```bash
git add .github/workflows/
git commit -m "fix: optimize GitHub Actions workflow with 30-minute schedule"
git push
```

### Step 3: Deploy Server-Side Optimization

1. **Test optimized server locally:**
```bash
# Set environment variable
export USE_OPTIMIZED_SYNC=true

# Run optimized server
node server-optimized.js
```

2. **Replace production server:**
```bash
# Backup current server.js
cp server.js server.original.js

# Use optimized version
cp server-optimized.js server.js
```

3. **Update package.json scripts (optional):**
```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:original": "node server.original.js",
    "dev:optimized": "USE_OPTIMIZED_SYNC=true node server.js"
  }
}
```

### Step 4: Deploy to Vercel

1. **Set environment variables:**
```bash
vercel env add USE_OPTIMIZED_SYNC production
# Enter value: true
```

2. **Deploy:**
```bash
vercel --prod
```

## 📊 Monitoring

### Access Sync Metrics

1. **Via API:**
```bash
curl http://localhost:3000/api/sync/metrics
```

2. **Via UI Component:**
Add the SyncMonitor component to your admin dashboard:
```tsx
import SyncMonitor from '@/components/SyncMonitor';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <SyncMonitor />
    </div>
  );
}
```

### Monitor GitHub Actions

1. Check workflow runs: https://github.com/[your-repo]/actions
2. Verify 30-minute schedule is working
3. Check for any error notifications

## 🔄 Rollback Procedures

### Quick Rollback (If Issues Occur)

1. **Immediate rollback:**
```bash
# Automatic rollback to latest backup
node scripts/rollback.js --auto

# Restart server
npm run dev
```

2. **Selective rollback:**
```bash
# Interactive rollback
node scripts/rollback.js

# Choose specific backup to restore
```

3. **GitHub Actions rollback:**
```bash
# Restore original workflow
git checkout HEAD~1 -- .github/workflows/sync-data.yml
git commit -m "rollback: restore original sync workflow"
git push
```

### Disable Optimized Sync (Without Full Rollback)

1. **Via environment variable:**
```bash
# Set to false to use original sync
export USE_OPTIMIZED_SYNC=false
npm run dev
```

2. **In production (Vercel):**
```bash
vercel env rm USE_OPTIMIZED_SYNC production
vercel --prod
```

## 🎯 Performance Expectations

### Before Optimization
- GitHub Actions: Running every 5 minutes (288 runs/day)
- Status: **Failing** due to rate limits and errors
- Real-time updates: Not working
- Server load: Minimal (no direct sync)

### After Optimization
- GitHub Actions: Running every 30 minutes (48 runs/day)
- Status: **Stable** with error handling
- Real-time updates: 
  - Priority models: 5 minutes
  - Active models: 30 minutes
  - Full sync: 6 hours
- Server load: ~0.5% CPU increase
- Cache hit rate: >80% after warm-up

## 🌍 Global Deployment Considerations

Since this is for global deployment:

1. **No timezone-specific optimizations** - System runs 24/7 at consistent intervals
2. **Distributed caching** - Consider Redis for production caching
3. **CDN integration** - GitHub Actions generates static JSON for CDN distribution
4. **Multi-region support** - Can be extended with region-specific endpoints

## 🚨 Troubleshooting

### GitHub Actions Still Failing

1. Check if data directory exists:
```yaml
- name: Create data directory
  run: mkdir -p data
```

2. Verify database initialization:
```yaml
- name: Setup database
  run: |
    mkdir -p prisma
    touch prisma/dev.db
    npx prisma db push --skip-generate
```

### Server Not Syncing

1. Check metrics endpoint:
```bash
curl http://localhost:3000/api/sync/metrics
```

2. Check Socket.IO connection:
```javascript
// In browser console
const socket = io();
socket.on('connect', () => console.log('Connected'));
socket.emit('sync:metrics');
```

3. Review server logs:
```bash
# Check for sync service initialization
npm run dev | grep -i sync
```

### High Error Rate

1. Check rate limiting:
```javascript
// Metrics will show rateLimited: true
{
  "rateLimited": true,
  "errors": 15
}
```

2. Use GitHub backup:
```bash
# Force GitHub backup load
node -e "require('./src/services/optimized-sync.service').optimizedSyncService.loadGitHubBackup()"
```

## 📝 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_OPTIMIZED_SYNC` | `true` | Enable optimized sync service |
| `AUTO_SYNC` | `true` | Auto-sync on server startup |
| `DISABLE_AUTO_SYNC` | `false` | Disable auto-sync in development |
| `SYNC_CACHE_TTL` | `60000` | Cache TTL in milliseconds |
| `SYNC_RATE_LIMIT` | `60` | Max API calls per minute |

### Sync Intervals (Hardcoded - Modify in optimized-sync.service.js)

```javascript
this.intervals = {
  priority: 5 * 60 * 1000,    // 5 minutes
  active: 30 * 60 * 1000,      // 30 minutes
  full: 6 * 60 * 60 * 1000,    // 6 hours
  github: 60 * 60 * 1000       // 1 hour
};
```

## ✅ Post-Deployment Verification

1. **GitHub Actions:**
   - [ ] Workflow runs every 30 minutes
   - [ ] No error emails
   - [ ] data/*.json files updated

2. **Server:**
   - [ ] Metrics endpoint accessible
   - [ ] Socket.IO broadcasting updates
   - [ ] Cache hit rate > 50%

3. **Frontend:**
   - [ ] Real-time updates working
   - [ ] No console errors
   - [ ] Data freshness < 30 minutes

## 📞 Support

If issues persist after deployment:

1. Check the rollback completed successfully
2. Review server logs for error patterns
3. Verify all environment variables are set correctly
4. Ensure database migrations are up to date

## 🎉 Success Indicators

You'll know the deployment is successful when:

- ✅ No more GitHub Actions error emails
- ✅ `/api/sync/metrics` shows healthy stats
- ✅ Real-time updates visible in frontend
- ✅ Cache hit rate above 70%
- ✅ Error count remains low (<5 per hour)
- ✅ No rate limiting alerts

---

**Remember:** Always test in development first and keep backups before deploying to production!