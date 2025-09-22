# 📋 Dashboard Fallback System Test Guide

## 🎯 Overview

This guide provides comprehensive testing procedures for the dashboard's multi-level fallback system with cache management and type safety.

## 🏗️ System Architecture

```
Priority Order:
1. 📌 Featured Models (DB pinned by admin)
2. 🟢 Live API Data (Real-time from AA)
3. 🟡 Cached Data (localStorage, TTL: 1 hour)
4. ⚪ Fallback Data (Hardcoded defaults)
```

## 🧪 Test Scenarios

### 1. UI Badge Transition Test

**Objective**: Verify that data source badges update correctly based on data availability.

#### Steps:

1. **Start Fresh** (Clear all data)
   ```bash
   # In browser console
   localStorage.removeItem('dashboard_models_cache_v1');
   ```

2. **Test Live Data** 🟢
   - Navigate to http://localhost:3000/
   - Verify badge shows: 🟢 Live
   - Check console: `dataSource: 'live'`

3. **Populate Cache**
   - Let the page load normally (cache will be saved)
   - Check localStorage:
   ```javascript
   const cache = JSON.parse(localStorage.getItem('dashboard_models_cache_v1'));
   console.log(cache.dataSource); // Should be 'live' or 'featured'
   ```

4. **Test Cache Fallback** 🟡
   - Simulate API failure:
   ```bash
   curl "http://localhost:3000/api/v1/intelligence-index?limit=9&simulate_failure=true"
   ```
   - Refresh page with network throttling
   - Verify badge shows: 🟡 Cached

5. **Test Hardcoded Fallback** ⚪
   - Clear cache: `localStorage.clear()`
   - Keep API failure active
   - Refresh page
   - Verify badge shows: ⚪ Fallback
   - Should see warning: "⚠️ Using fallback data"

### 2. Cache TTL Boundary Test

**Objective**: Verify cache expiration at 1-hour boundary.

#### Test Cases:

##### A. Fresh Cache (< 30 minutes)
```javascript
// In browser console
const cache = JSON.parse(localStorage.getItem('dashboard_models_cache_v1'));
cache.timestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago
localStorage.setItem('dashboard_models_cache_v1', JSON.stringify(cache));
// Refresh page - should use cache
```

##### B. Almost Expired (59 minutes)
```javascript
const cache = JSON.parse(localStorage.getItem('dashboard_models_cache_v1'));
cache.timestamp = new Date(Date.now() - 59 * 60 * 1000).toISOString();
localStorage.setItem('dashboard_models_cache_v1', JSON.stringify(cache));
// Refresh page - should still use cache
```

##### C. Expired (61 minutes)
```javascript
const cache = JSON.parse(localStorage.getItem('dashboard_models_cache_v1'));
cache.timestamp = new Date(Date.now() - 61 * 60 * 1000).toISOString();
localStorage.setItem('dashboard_models_cache_v1', JSON.stringify(cache));
// Refresh page - cache should be cleared, fallback to API or hardcoded
```

### 3. Featured Models Priority Test

**Objective**: Verify featured models take priority over all other sources.

#### Setup:
```bash
# Pin a model (requires admin token)
curl -X POST http://localhost:3000/api/admin/models/featured \
  -H "x-admin-token: admin-secret-2024" \
  -H "Content-Type: application/json" \
  -d '{"modelId": "MODEL_ID_HERE", "action": "pin", "order": 1}'
```

#### Verification:
1. Refresh dashboard
2. Badge should show: 📌 Pinned
3. Pinned model should appear first
4. API check:
```bash
curl "http://localhost:3000/api/v1/intelligence-index?limit=9"
# Response should include: "dataSource": "Featured Models (Admin Selected)"
```

### 4. Type Safety Verification

**Objective**: Ensure TypeScript catches invalid status values.

#### Test Type Checking:
```bash
npm run typecheck
```

#### Valid Status Values:
- ✅ `MODEL_STATUS.OPERATIONAL`
- ✅ `MODEL_STATUS.DEGRADED`
- ✅ `MODEL_STATUS.DOWN`
- ❌ `'outage'` (should cause type error)
- ❌ `'any-invalid-status'` (should cause type error)

#### Valid Data Sources:
- ✅ `DATA_SOURCE.FEATURED`
- ✅ `DATA_SOURCE.LIVE`
- ✅ `DATA_SOURCE.CACHE`
- ✅ `DATA_SOURCE.FALLBACK`
- ❌ `'cached'` (should use `DATA_SOURCE.CACHE`)

## 🔨 Testing Tools

### 1. Automated Test Script
```bash
# Basic tests
node test-dashboard-fallback.mjs

# Advanced tests with cache manipulation
node test-fallback-advanced.mjs

# Admin features test
node test-admin-features.mjs
```

### 2. Manual cURL Commands

#### Normal API Call
```bash
curl "http://localhost:3000/api/v1/intelligence-index?limit=9" | jq '.'
```

#### Simulate Failure
```bash
curl "http://localhost:3000/api/v1/intelligence-index?limit=9&simulate_failure=true" | jq '.'
```

#### Check Featured Models
```bash
curl "http://localhost:3000/api/admin/models/featured" | jq '.'
```

### 3. Browser DevTools Commands

#### Inspect Cache
```javascript
// View cache contents
const cache = JSON.parse(localStorage.getItem('dashboard_models_cache_v1'));
console.table(cache.models);
console.log('Data Source:', cache.dataSource);
console.log('Timestamp:', cache.timestamp);
console.log('Age (minutes):', Math.floor((Date.now() - new Date(cache.timestamp)) / 60000));
```

#### Force Cache Expiration
```javascript
// Make cache 2 hours old
const cache = JSON.parse(localStorage.getItem('dashboard_models_cache_v1'));
cache.timestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
localStorage.setItem('dashboard_models_cache_v1', JSON.stringify(cache));
location.reload();
```

#### Clear Everything
```javascript
localStorage.clear();
location.reload();
```

## 📊 Expected Results Matrix

| Scenario | Featured DB | API Status | Cache Status | Expected Badge | Expected Source |
|----------|------------|------------|--------------|----------------|-----------------|
| Normal | Empty | ✅ Working | Empty | 🟢 Live | API |
| Cached | Empty | ✅ Working | Valid | 🟢 Live | API (updates cache) |
| API Fail + Cache | Empty | ❌ Failed | Valid | 🟡 Cached | Cache |
| API Fail + No Cache | Empty | ❌ Failed | Empty/Expired | ⚪ Fallback | Hardcoded |
| Featured Active | Has Models | Any | Any | 📌 Pinned | Database |
| Mixed Featured | Some Models | ✅ Working | Any | 📌 Pinned | DB + API |

## 🐛 Troubleshooting

### Issue: Badge not updating
- **Check**: Browser cache (hard refresh: Ctrl+Shift+R)
- **Check**: React state update (open React DevTools)
- **Check**: API response in Network tab

### Issue: Cache not working
- **Check**: localStorage quota (might be full)
- **Check**: Browser privacy settings (might block localStorage)
- **Check**: Cache key name matches: `dashboard_models_cache_v1`

### Issue: TypeScript errors
- **Run**: `npm run typecheck`
- **Check**: All status values use `MODEL_STATUS.*` constants
- **Check**: All data sources use `DATA_SOURCE.*` constants
- **Check**: No `any` types in model-related code

### Issue: Featured models not showing
- **Check**: Database migration ran: `npx prisma migrate dev`
- **Check**: Admin token is correct
- **Check**: Model ID exists in database

## ✅ Success Criteria

1. **Data Source Priority**: Featured → Live → Cache → Fallback
2. **Cache TTL**: Exactly 1 hour expiration
3. **Type Safety**: Zero TypeScript errors
4. **UI Feedback**: Correct badge for each state
5. **Error Handling**: Graceful degradation
6. **Performance**: < 500ms badge update

## 🎯 Quick Validation Checklist

- [ ] Fresh load shows 🟢 Live badge
- [ ] API failure with cache shows 🟡 Cached badge
- [ ] API failure without cache shows ⚪ Fallback badge
- [ ] Featured models show 📌 Pinned badge
- [ ] Cache expires after exactly 60 minutes
- [ ] TypeScript compilation passes
- [ ] Refresh button works and updates badge
- [ ] Error message appears for fallback state
- [ ] Data freshness indicator shows correct age
- [ ] Performance: Page loads in < 3 seconds

---

**Last Updated**: 2024-12-22
**Version**: 1.0.0