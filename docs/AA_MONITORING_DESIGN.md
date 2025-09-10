# AA-Based Monitoring System Design

## Overview
Redesign the monitoring tab to exclusively use Artificial Analysis (AA) scraped models for consistency across the application.

## Current Issues
1. Monitoring shows all 139 models regardless of AA availability
2. Stats don't reflect actual AA model performance
3. Inconsistency between models page (AA data) and monitoring (all models)

## Design Goals
- **Consistency**: Same AA data source across all pages
- **Accuracy**: Show only models we can actually track via AA
- **Real-time**: Live updates for AA model status changes
- **Performance**: Efficient queries for AA-specific data

## Technical Architecture

### 1. Data Layer
```typescript
// Filter only AA models
interface AAModelFilter {
  metadata: {
    path: ['aa'],
    not: null
  }
}

// AA-specific stats
interface AARealtimeStats {
  totalAAModels: number          // Only AA-tracked models
  activeAAModels: number          // AA models currently active
  avgAAAvailability: number       // Average from AA data
  operationalAAModels: number     // Based on AA status
  degradedAAModels: number        // AA performance degradation
  outageAAModels: number          // AA reported outages
  aaProviders: Set<string>        // Unique AA providers
  aaCategories: {                 // AA category breakdown
    [category: string]: number
  }
}
```

### 2. API Layer Updates

#### /api/v1/realtime-stats
```typescript
// Modified to filter AA models only
const aaModels = await prisma.model.findMany({
  where: {
    metadata: {
      path: ['aa'],
      not: Prisma.DbNull
    }
  },
  select: {
    id: true,
    name: true,
    provider: true,
    metadata: true,
    status: true
  }
})

// Calculate AA-specific stats
const stats = {
  totalAAModels: aaModels.length,
  activeAAModels: aaModels.filter(m => m.metadata?.aa?.isActive).length,
  avgAAAvailability: calculateAAAvailability(aaModels),
  operationalAAModels: aaModels.filter(m => m.metadata?.aa?.status === 'operational').length,
  // ... other AA-specific calculations
}
```

### 3. Monitoring Components

#### UnifiedChart Updates
- Display "AA Models" instead of generic "Active Models"
- Show AA-specific metrics (speed, intelligence, price from AA)
- Add AA provider breakdown chart
- Show AA category distribution

#### New Metrics
1. **AA Coverage**: % of models tracked by AA
2. **AA Update Frequency**: Last sync timestamp
3. **AA Data Quality**: Confidence scores
4. **Provider Distribution**: Models per provider from AA

### 4. Real-time Updates

```typescript
// WebSocket events for AA updates
interface AAUpdateEvent {
  type: 'aa_model_added' | 'aa_model_updated' | 'aa_model_removed'
  modelId: string
  aaData: ArtificialAnalysisData
  timestamp: Date
}
```

## Implementation Plan

### Phase 1: Data Layer (Current)
1. ✅ Create AA filter for model queries
2. ✅ Implement AA-specific stat calculations
3. ✅ Add AA metadata validation

### Phase 2: API Updates
1. Modify `/api/v1/realtime-stats` to use AA filter
2. Add AA-specific metrics calculation
3. Include AA provider and category breakdowns

### Phase 3: UI Components
1. Update UnifiedChart to show AA models
2. Add AA-specific metric cards
3. Create AA provider distribution chart
4. Show AA sync status indicator

### Phase 4: Real-time Integration
1. Add AA update WebSocket events
2. Implement live AA data refresh
3. Add AA sync status monitoring

## Benefits
1. **Consistency**: Same data source (AA) across all pages
2. **Accuracy**: Only show trackable models
3. **Insights**: AA-specific metrics like price, speed, intelligence
4. **Trust**: Users see real scraped data, not estimates

## Migration Strategy
1. Add feature flag for AA-only monitoring
2. Run both modes in parallel for testing
3. Gradually migrate users to AA-only view
4. Remove legacy monitoring code

## Success Metrics
- 100% of monitoring data from AA source
- <500ms chart update latency
- Zero discrepancies between pages
- Improved user understanding of model landscape