# Performance Filtering for AA Model Sync

## Overview

The AI-GO platform now includes intelligent performance filtering to ensure only high-quality models are synced from Artificial Analysis. This prevents low-performing models from cluttering the interface and provides users with the most relevant AI models.

## How It Works

1. **Data Collection**: The sync service fetches all models from Artificial Analysis (API + intelligence-index.json)
2. **Average Calculation**: Automatically calculates the average intelligence score across all fetched models
3. **Filtering**: Removes models that fall below the threshold (average or custom)
4. **Database Sync**: Only syncs the filtered, high-quality models to the database

## Configuration

Configure the filtering behavior using environment variables in `.env.local`:

```bash
# Enable/disable performance filtering (default: true)
AA_ENABLE_PERFORMANCE_FILTER=true

# Optional: Set custom intelligence threshold (default: use average)
# AA_MIN_INTELLIGENCE=40
```

## Filtering Strategies

### 1. Dynamic Average (Default)
- Calculates average intelligence score from all fetched models
- Filters out models below this average
- Adapts automatically as new models are added to AA

### 2. Custom Threshold
- Set `AA_MIN_INTELLIGENCE` to a fixed value (e.g., 30, 40, 50, 60)
- Filters out models below this fixed threshold
- Useful for consistent filtering regardless of model distribution

### 3. Disabled
- Set `AA_ENABLE_PERFORMANCE_FILTER=false` to sync all models
- No filtering applied - all models from AA are synced

## Running the Sync

### With Filtering (Default)
```bash
npm run build
node dist/services/sync-aa-real-data.js
```

### With Custom Threshold
```bash
export AA_MIN_INTELLIGENCE=40
npm run build
node dist/services/sync-aa-real-data.js
```

### Without Filtering
```bash
export AA_ENABLE_PERFORMANCE_FILTER=false
npm run build
node dist/services/sync-aa-real-data.js
```

## Testing

Test the filtering logic without affecting the database:
```bash
node test-performance-filter.js
```

This will show:
- Current model statistics
- Models above/below average
- Impact of different thresholds

## Statistics (Example)

Based on current AA data (129 models):
- **Average Intelligence**: ~37.47
- **Using Average Filter**: Keeps 62 models (48.1%), filters 67 models (51.9%)
- **Using Threshold 30**: Keeps 84 models (65.1%)
- **Using Threshold 40**: Keeps 55 models (42.6%)
- **Using Threshold 50**: Keeps 27 models (20.9%)
- **Using Threshold 60**: Keeps 20 models (15.5%)

## Benefits

1. **Quality Focus**: Users see only relevant, high-performance models
2. **Cleaner UI**: Reduces clutter from low-quality or experimental models
3. **Better UX**: Easier model selection and comparison
4. **Performance**: Faster page loads with fewer models to render
5. **Flexibility**: Easily adjust filtering strategy via environment variables

## Implementation Details

The filtering logic is implemented in:
- `src/services/sync-aa-real-data.ts` - Main sync service with filtering
- `test-performance-filter.js` - Testing and analysis tool
- `run-sync-with-filter.js` - Convenience script for running filtered sync

## Notes

- The filtering is applied during sync, not at query time
- To change filtering strategy, update env vars and re-run sync
- Models already in the database are not removed by filtering (only affects new syncs)
- Consider running periodic syncs to keep data fresh and properly filtered