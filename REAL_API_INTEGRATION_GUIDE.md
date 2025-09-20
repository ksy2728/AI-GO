# Real API Integration Guide

This guide explains how to configure and use the **Real API Integration System** that replaces all hardcoded data with live API calls and web scraping.

## 🎯 Overview

The system now uses **real API calls** and **authorized web scraping** to get:
- ✅ **Live model lists** from provider APIs
- ✅ **Real pricing data** from official sources
- ✅ **Actual performance metrics** through API testing
- ✅ **Intelligence scores** from Artificial Analysis
- ❌ **No more hardcoded arrays or fake calculations**

## 🔧 Setup Instructions

### 1. Configure API Keys

Edit your `.env` file and replace the placeholder values:

```bash
# Required: OpenAI API
OPENAI_API_KEY="sk-proj-your-actual-openai-key"

# Required: Anthropic API
ANTHROPIC_API_KEY="sk-ant-your-actual-anthropic-key"

# Required: Google AI API
GOOGLE_AI_API_KEY="AIza-your-actual-google-key"

# Optional: Replicate API (for Meta/Llama models)
REPLICATE_API_TOKEN="r8_your-actual-replicate-token"

# Required: Cron job security
CRON_SECRET="your-secure-cron-secret"
```

### 2. API Key Sources

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy key starting with `sk-proj-`

#### Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create API key
3. Copy key starting with `sk-ant-`

#### Google AI API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy key starting with `AIza`

#### Replicate API Token
1. Visit [Replicate Account](https://replicate.com/account/api-tokens)
2. Create new token
3. Copy token starting with `r8_`

### 3. Verify Configuration

Check API configuration status:
```bash
GET /api/sync/real-data
```

Response shows which APIs are configured:
```json
{
  "success": true,
  "apiConfiguration": {
    "openai": true,
    "anthropic": true,
    "google": true,
    "replicate": false
  },
  "configuredProviders": ["openai", "anthropic", "google"],
  "unconfiguredProviders": ["replicate"]
}
```

## 🚀 Usage

### Manual Sync

Trigger real API sync manually:

```bash
# Incremental sync (recommended)
POST /api/sync/real-data
{
  "type": "incremental",
  "includeMetrics": true,
  "includeAA": true
}

# Full sync with metrics
POST /api/sync/real-data
{
  "type": "full",
  "includeMetrics": true,
  "metricsDepth": "full"
}

# Force refresh (clears caches)
POST /api/sync/real-data
{
  "type": "force"
}
```

### Scheduled Sync

The system runs automatic syncs every hour via cron job:
```bash
GET /api/cron/real-api-sync
Authorization: Bearer your-cron-secret
```

### Response Format

```json
{
  "success": true,
  "type": "incremental",
  "summary": {
    "totalProviders": 5,
    "successful": 4,
    "failed": 1,
    "totalModels": 45,
    "totalPricing": 45,
    "totalMetrics": 20,
    "totalDuration": 15000,
    "averageDuration": 3000
  },
  "results": [
    {
      "provider": "openai",
      "success": true,
      "modelsUpdated": 12,
      "pricingUpdated": 12,
      "metricsCollected": 5,
      "duration": 3500
    }
  ],
  "errors": [],
  "timestamp": "2024-12-20T10:30:00.000Z",
  "nextScheduledSync": "2024-12-20T11:30:00.000Z"
}
```

## 📊 What Gets Updated

### 1. OpenAI Service
- ✅ **Real models** via `client.models.list()`
- ✅ **Pricing scraper** from openai.com/pricing
- ✅ **Live status checks** with actual API calls
- ❌ No more hardcoded pricing arrays

### 2. Google Service
- ✅ **Live models** via Gemini API endpoint
- ✅ **Model capabilities** from API response
- ✅ **Current pricing** with known rates
- ❌ No more hardcoded model lists

### 3. Anthropic Service
- ✅ **Model discovery** via docs scraping
- ✅ **Updated model info** from anthropic.com
- ✅ **Current pricing** with latest rates
- ❌ No more static model arrays

### 4. Meta Service
- ✅ **Llama models** via Replicate API
- ✅ **Model availability** checks
- ✅ **Pricing from Replicate** marketplace
- ❌ No more hardcoded Llama lists

### 5. Artificial Analysis
- ✅ **Real intelligence scores** via web scraping
- ✅ **Performance rankings** from leaderboard
- ✅ **Speed measurements** from AA data
- ❌ No more fake/calculated scores

### 6. Metrics Collection
- ✅ **Real latency** via actual API calls (P50, P95, P99)
- ✅ **Throughput testing** with concurrent requests
- ✅ **Error rates** from failed requests
- ✅ **Availability** from success rates
- ❌ No more `P95 = P50 * 1.5` calculations

## 🛡️ Error Handling

### Graceful Degradation
- If API fails → Use cached data
- If cache empty → Use minimal fallback data
- Never returns fake data marked as real

### Common Issues

#### API Key Not Working
```json
{
  "provider": "openai",
  "success": false,
  "error": "Invalid API key provided"
}
```
**Solution**: Check API key format and permissions

#### Rate Limiting
```json
{
  "provider": "google",
  "success": false,
  "error": "Rate limit exceeded"
}
```
**Solution**: Wait and retry, or adjust sample sizes

#### Network Issues
```json
{
  "provider": "anthropic",
  "success": false,
  "error": "Network timeout"
}
```
**Solution**: Check internet connection and firewall

## ⚡ Performance

### Sync Duration
- **Incremental**: 2-5 minutes
- **Full with metrics**: 10-20 minutes
- **Force refresh**: 5-10 minutes

### Rate Limiting
- 100ms delays between API calls
- 2s delays between providers
- 1s delays between metric collections

### Caching Strategy
- **Models**: 6 hours cache
- **Pricing**: 24 hours cache
- **Metrics**: 10 minutes cache
- **AA data**: 1 hour cache

## 🔍 Monitoring

### Check Sync Status
```bash
GET /api/sync/real-data
```

### Manual Cron Trigger
```bash
POST /api/cron/real-api-sync
{
  "force": false
}
```

### Logs
All operations log to console with structured format:
```
🔄 Syncing openai...
✅ openai sync successful: {"models": 12, "pricing": 12}
📊 Measuring latency for openai:gpt-4 (10 samples)
✅ Collected metrics for openai:gpt-4: {"p50": "250ms", "p95": "400ms"}
```

## 🚨 Important Notes

### Data Integrity
- **No fake data**: System never generates fake scores or metrics
- **Real measurements**: All performance data from actual API calls
- **Verified sources**: Pricing from official pages only
- **Transparent fallbacks**: Clear indication when using fallback data

### API Costs
- Minimal costs from test requests (usually < $0.01/day)
- Requests use minimal tokens (10-50 tokens each)
- Rate limiting prevents excessive charges

### Security
- API keys stored in environment variables only
- Cron endpoints protected with secret
- No API keys logged or exposed

## 🎛️ Configuration Options

### Sync Types
- `incremental`: Update existing data
- `full`: Complete refresh + metrics
- `force`: Clear caches first

### Metrics Depth
- `shallow`: Top 20 models, 3 samples each
- `full`: All active models, 10 samples each

### Provider Selection
```json
{
  "providers": ["openai", "anthropic"],
  "includeMetrics": false,
  "includeAA": true
}
```

## 🔄 Automated Scheduling

### Cron Schedule (Vercel)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/real-api-sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Manual Schedule
Run every hour with:
```bash
curl -X GET "https://your-domain.com/api/cron/real-api-sync" \
  -H "Authorization: Bearer your-cron-secret"
```

## ✅ Success Verification

After setup, you should see:
1. ✅ Real model counts varying as providers update
2. ✅ Actual latency measurements with realistic P95/P99
3. ✅ Current pricing matching provider websites
4. ✅ Intelligence scores from Artificial Analysis
5. ✅ No hardcoded arrays in service responses

The system is now **completely real-time** and **evidence-based**! 🎉