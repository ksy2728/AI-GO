# Data Management Guide

## Overview

The AI Server Information project uses a hybrid data management approach:

1. **Dynamic Data** (Models, Status) - Synced automatically via GitHub Actions
2. **Static Data** (Pricing, Benchmarks, News) - Managed manually via JSON files

## Data Sources

### Dynamic Data (Auto-synced)

#### Models Data (`data/models.json`)
- **Source**: OpenAI models API + custom providers
- **Sync Frequency**: Every 5 minutes via GitHub Actions
- **Process**: 
  1. `scripts/sync-models.js` fetches from APIs
  2. Data stored in SQLite database
  3. `scripts/export-to-json.js` exports to JSON
  4. GitHub Actions commits changes automatically

#### Providers Data (`data/providers.json`)
- **Source**: Database (linked to models)
- **Sync**: With models data
- **Updates**: Automatic

### Static Data (Manual)

#### Pricing Data (`data/pricing-data.json`)
- **Source**: Manual updates based on provider pricing pages
- **Update Process**: Edit JSON file directly
- **Contains**: 12 AI models with pricing information
- **API Endpoint**: `/api/v1/pricing`

#### Benchmarks Data (`data/benchmarks-data.json`)
- **Source**: Official benchmark results from research papers
- **Update Process**: Edit JSON file directly
- **Contains**: 32 benchmark results across MMLU, HumanEval, GSM8K, HellaSwag
- **API Endpoint**: `/api/v1/benchmarks`

#### News Data (`data/news-data.json`)
- **Source**: Curated AI industry news
- **Update Process**: Edit JSON file directly
- **Contains**: 12 news articles about AI developments
- **API Endpoint**: `/api/v1/news`

## Update Procedures

### Updating Dynamic Data
Dynamic data updates automatically every 5 minutes. No manual intervention needed.

To force an update:
```bash
# Run locally
node scripts/sync-models.js
node scripts/export-to-json.js

# Or trigger GitHub Action manually
# Go to Actions tab > Sync Model Data > Run workflow
```

### Updating Static Data

#### Method 1: Direct Edit
1. Edit the JSON files in `data/` directory
2. Ensure JSON validity
3. Commit and push changes

#### Method 2: Using Update Script
```bash
node scripts/update-static-data.js
```
This script updates timestamps and sorts data appropriately.

### Adding New Data

#### Adding Pricing Data
1. Open `data/pricing-data.json`
2. Add new pricing entry:
```json
{
  "id": "model-id",
  "modelName": "Model Name",
  "provider": "Provider",
  "tier": "pro|hobby|enterprise|free",
  "inputPrice": 10,  // per million tokens
  "outputPrice": 30, // per million tokens
  "currency": "USD",
  "contextWindow": 128000,
  "rateLimit": "500 RPM",
  "features": ["Feature 1", "Feature 2"],
  "limitations": ["Limitation 1"],
  "availability": "public",
  "lastUpdated": "2024-11-01",
  "url": "https://pricing-page.com"
}
```

#### Adding Benchmark Results
1. Open `data/benchmarks-data.json`
2. Add new benchmark entry:
```json
{
  "id": "model-benchmark-id",
  "modelName": "Model Name",
  "provider": "Provider",
  "benchmarkName": "MMLU|HumanEval|GSM8K|HellaSwag",
  "score": 85.5,
  "maxScore": 100,
  "percentile": 95,
  "date": "2024-11-01",
  "category": "reasoning|coding|math",
  "description": "Benchmark description"
}
```

#### Adding News Articles
1. Open `data/news-data.json`
2. Add new article:
```json
{
  "id": "unique-article-id",
  "title": "Article Title",
  "summary": "Brief summary",
  "content": "Full article content",
  "source": "News Source",
  "author": "Author Name",
  "publishedAt": "2024-11-01T12:00:00Z",
  "category": "release|funding|partnership|regulation|research|market",
  "tags": ["Tag1", "Tag2"],
  "url": "https://article-url.com",
  "readTime": 5,
  "views": 10000
}
```

## API Endpoints

All data is served through REST API endpoints:

- **Models**: `GET /api/v1/models`
- **Status**: `GET /api/v1/status`
- **Pricing**: `GET /api/v1/pricing`
- **Benchmarks**: `GET /api/v1/benchmarks`
- **News**: `GET /api/v1/news`

### Query Parameters

All endpoints support:
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

Specific filters:
- **Models**: `provider`, `category`, `search`
- **Pricing**: `provider`, `model`, `tier`
- **Benchmarks**: `model`, `provider`, `benchmark`, `category`
- **News**: `category`, `source`, `search`

## Production Deployment

On Vercel, the application:
1. Uses GitHub data files as the primary data source
2. Falls back to temporary data if files are unavailable
3. Serves static data files directly without database dependency

## Best Practices

1. **Validate JSON**: Always validate JSON before committing
2. **Update Timestamps**: Use the update script to maintain timestamps
3. **Consistent IDs**: Use descriptive, unique IDs for all entries
4. **Source Attribution**: Always include source URLs for data
5. **Regular Updates**: Review and update static data monthly

## Monitoring

- **GitHub Actions**: Check workflow runs for sync status
- **API Health**: Monitor `/api/v1/status` endpoint
- **Data Freshness**: Check `lastUpdated` fields in JSON files
- **Error Logs**: Review Vercel function logs for API errors