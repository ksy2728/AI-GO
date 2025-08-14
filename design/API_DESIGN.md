# AI-GO Global API Design

## 🌐 API Architecture Overview

### Design Principles
1. **RESTful with GraphQL Gateway** - REST for simplicity, GraphQL for complex queries
2. **Region-Aware** - Automatic routing to nearest endpoint
3. **Version Stability** - Long-term support with clear deprecation
4. **Rate Limit Friendly** - Efficient pagination and caching headers

## 🔗 Global Endpoint Structure

### Base URLs by Region
```yaml
Primary:
  US: https://api.ai-go.com
  
Regional:
  EU: https://api-eu.ai-go.com
  ASIA: https://api-asia.ai-go.com
  
Fallback:
  Global: https://api-global.ai-go.com
```

### API Versioning Strategy
```
https://api.ai-go.com/v1/{resource}
https://api.ai-go.com/v2/{resource}  # Future

Headers:
  X-API-Version: 2024-01-01  # Date-based versioning
  Accept: application/json; version=1
```

## 📚 REST API Endpoints

### 1. Model Status Endpoints

#### Get Current Status
```http
GET /v1/status
```

Query Parameters:
```typescript
interface StatusQuery {
  region?: 'us-east' | 'us-west' | 'eu-west' | 'asia-east' | 'asia-se';
  provider?: string;   // 'openai' | 'anthropic' | 'google' | ...
  foundation?: string; // 'gpt-4' | 'claude-3' | ...
  sort?: 'usage' | 'availability' | 'latency' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;      // Default: 20, Max: 100
  offset?: number;
  locale?: string;     // For localized model names
}
```

Response:
```json
{
  "data": {
    "models": [
      {
        "id": "gpt-4-turbo-2024",
        "name": "GPT-4 Turbo",
        "provider": {
          "id": "openai",
          "name": "OpenAI",
          "status_page": "https://status.openai.com"
        },
        "foundation_model": "GPT-4",
        "current_status": {
          "status": "operational",
          "availability": 99.92,
          "latency_p50_ms": 450,
          "latency_p95_ms": 980,
          "error_rate": 0.08,
          "rpm": 3400,
          "region": "us-east",
          "last_updated": "2024-01-15T10:30:00Z"
        },
        "capabilities": ["text", "vision", "function_calling"],
        "context_window": 128000
      }
    ],
    "meta": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "region": "us-east",
      "cached": true,
      "cache_ttl": 30
    }
  }
}
```

#### Get Model Details
```http
GET /v1/models/{model_id}
```

Response includes full specifications, pricing, documentation links.

#### Get Historical Status
```http
GET /v1/models/{model_id}/history
```

Query Parameters:
```typescript
interface HistoryQuery {
  region?: string;
  from?: string;      // ISO 8601
  to?: string;        // ISO 8601
  interval?: '1m' | '5m' | '1h' | '1d';
  metrics?: Array<'availability' | 'latency' | 'errors' | 'usage'>;
}
```

### 2. Benchmark Endpoints

#### Get Benchmark Scores
```http
GET /v1/benchmarks
```

Query Parameters:
```typescript
interface BenchmarkQuery {
  models?: string[];    // Comma-separated model IDs
  suites?: string[];    // 'MMLU' | 'GSM8K' | 'HumanEval' | ...
  normalized?: boolean; // Return 0-100 normalized scores
  latest_only?: boolean;
  locale?: string;
}
```

Response:
```json
{
  "data": {
    "benchmarks": [
      {
        "suite": "MMLU",
        "description": "Massive Multitask Language Understanding",
        "scores": [
          {
            "model_id": "gpt-4-turbo-2024",
            "score_raw": 0.892,
            "score_normalized": 95.3,
            "percentile": 98,
            "evaluated_at": "2024-01-10",
            "version": "v1.0",
            "notes": "5-shot evaluation"
          }
        ]
      }
    ],
    "meta": {
      "evaluation_date": "2024-01-10",
      "methodology_url": "https://docs.ai-go.com/benchmarks"
    }
  }
}
```

#### Compare Models
```http
GET /v1/compare
```

Query Parameters:
```typescript
interface CompareQuery {
  models: string[];     // 2-4 model IDs
  include?: Array<'specs' | 'pricing' | 'benchmarks' | 'status'>;
  region?: string;
  locale?: string;
}
```

### 3. News & Updates

#### Get News Feed
```http
GET /v1/news
```

Query Parameters:
```typescript
interface NewsQuery {
  category?: 'model' | 'provider' | 'research' | 'industry';
  tags?: string[];
  models?: string[];
  from?: string;
  to?: string;
  locale?: string;
  limit?: number;
  offset?: number;
}
```

### 4. Search Endpoints

#### Global Search
```http
GET /v1/search
```

Query Parameters:
```typescript
interface SearchQuery {
  q: string;           // Search query
  type?: Array<'model' | 'provider' | 'news' | 'benchmark'>;
  locale?: string;
  limit?: number;
}
```

## 🔀 GraphQL API

### Schema Overview
```graphql
type Query {
  # Models
  models(filter: ModelFilter, sort: ModelSort, pagination: Pagination): ModelConnection!
  model(id: ID!): Model
  
  # Status
  currentStatus(region: Region): [ModelStatus!]!
  statusHistory(modelId: ID!, range: TimeRange!): [StatusPoint!]!
  
  # Benchmarks
  benchmarks(suites: [String!], models: [ID!]): [BenchmarkResult!]!
  
  # Comparison
  compare(modelIds: [ID!]!): ComparisonResult!
  
  # Search
  search(query: String!, types: [SearchType!]): SearchResult!
}

type Subscription {
  # Real-time status updates
  statusUpdates(region: Region, models: [ID!]): ModelStatus!
  
  # Incident notifications
  incidents(severity: IncidentSeverity): Incident!
}
```

### Complex Query Example
```graphql
query GetDashboardData($region: Region!, $locale: String!) {
  topModels: models(
    filter: { isActive: true }
    sort: { field: USAGE, order: DESC }
    pagination: { limit: 5 }
  ) {
    edges {
      node {
        id
        name(locale: $locale)
        provider {
          name
          logo
        }
        currentStatus(region: $region) {
          availability
          latency {
            p50
            p95
          }
        }
        benchmarks(latest: true) {
          suite
          score
        }
      }
    }
  }
  
  recentNews: news(
    limit: 3
    locale: $locale
  ) {
    id
    title
    summary
    publishedAt
  }
}
```

## 🔐 Authentication & Authorization

### API Key Management
```http
POST /v1/auth/keys
Authorization: Bearer {user_token}

{
  "name": "Production API Key",
  "scopes": ["read:models", "read:benchmarks"],
  "rate_limit": 1000,
  "expires_at": "2025-01-01T00:00:00Z"
}
```

### Authentication Methods
1. **API Key** (X-API-Key header)
2. **JWT Token** (Authorization: Bearer)
3. **OAuth 2.0** (for third-party integrations)

### Rate Limiting Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642521600
X-RateLimit-Policy: "1000 per hour"
```

## 🌍 Internationalization

### Locale Handling
```http
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
X-Locale: zh-CN  # Override header
```

### Localized Responses
```json
{
  "data": {
    "model": {
      "id": "gpt-4-turbo",
      "name": {
        "en-US": "GPT-4 Turbo",
        "zh-CN": "GPT-4 涡轮版",
        "ja-JP": "GPT-4 ターボ"
      },
      "description": {
        "en-US": "Advanced language model with 128K context",
        "zh-CN": "具有128K上下文的高级语言模型",
        "ja-JP": "128Kコンテキストを持つ高度な言語モデル"
      }
    }
  }
}
```

## 🚀 WebSocket API

### Real-time Status Updates
```javascript
// Connection
const ws = new WebSocket('wss://ws.ai-go.com/v1/status');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-api-key'
}));

// Subscribe to updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['status:us-east', 'status:eu-west'],
  models: ['gpt-4-turbo', 'claude-3-opus']
}));

// Receive updates
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // {
  //   type: 'status_update',
  //   model_id: 'gpt-4-turbo',
  //   region: 'us-east',
  //   data: {
  //     availability: 99.95,
  //     latency_p95_ms: 890,
  //     timestamp: '2024-01-15T10:30:45Z'
  //   }
  // }
};
```

## 📊 Metrics & Analytics API

### Usage Analytics
```http
GET /v1/analytics/usage
```

Query Parameters:
```typescript
interface UsageQuery {
  model_id?: string;
  provider?: string;
  region?: string;
  from: string;
  to: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metrics?: Array<'requests' | 'tokens' | 'errors' | 'latency'>;
}
```

### Export Endpoints
```http
POST /v1/export/benchmarks
Content-Type: application/json

{
  "format": "csv" | "json" | "xlsx",
  "filters": {
    "models": ["gpt-4", "claude-3"],
    "suites": ["MMLU", "GSM8K"]
  },
  "locale": "en-US"
}
```

## 🛡️ Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "reset_at": "2024-01-15T11:00:00Z",
      "upgrade_url": "https://ai-go.com/pricing"
    },
    "request_id": "req_2024011510304512345",
    "documentation_url": "https://docs.ai-go.com/errors/rate-limit"
  }
}
```

### Standard Error Codes
```typescript
enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR'
}
```

## 🔄 Pagination

### Cursor-based Pagination
```http
GET /v1/models?limit=20&cursor=eyJpZCI6MTIzfQ==

Response:
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6MTQzfQ==",
    "has_next": true,
    "total": 150
  }
}
```

### Offset-based Pagination
```http
GET /v1/models?limit=20&offset=40

Response:
{
  "data": [...],
  "meta": {
    "limit": 20,
    "offset": 40,
    "total": 150
  }
}
```

## 📱 SDK Support

### Official SDKs
```yaml
JavaScript/TypeScript:
  npm: '@ai-go/sdk'
  
Python:
  pip: 'ai-go-sdk'
  
Go:
  import: 'github.com/ai-go/go-sdk'
  
Java:
  maven: 'com.ai-go:sdk'
```

### SDK Example (TypeScript)
```typescript
import { AIGoClient } from '@ai-go/sdk';

const client = new AIGoClient({
  apiKey: process.env.AIGO_API_KEY,
  region: 'us-east', // Auto-detect by default
  locale: 'en-US'
});

// Get current status
const status = await client.status.getCurrent({
  provider: 'openai',
  sort: 'availability',
  limit: 10
});

// Subscribe to real-time updates
client.realtime.subscribe(['gpt-4-turbo'], (update) => {
  console.log(`${update.modelId}: ${update.availability}%`);
});

// Compare models
const comparison = await client.models.compare([
  'gpt-4-turbo',
  'claude-3-opus',
  'gemini-ultra'
], {
  include: ['pricing', 'benchmarks', 'status']
});
```

## 🧪 API Testing

### Health Check Endpoint
```http
GET /v1/health

Response:
{
  "status": "healthy",
  "region": "us-east",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Test API Key
```
Test Key: test_sk_1234567890abcdef
Rate Limit: 100 requests/hour
Scopes: read:models, read:benchmarks
```

## 📈 Performance Optimization

### Caching Strategy
```http
Cache-Control: public, max-age=30, stale-while-revalidate=60
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Vary: Accept-Encoding, Accept-Language
```

### Compression
```http
Accept-Encoding: gzip, deflate, br
Content-Encoding: gzip
```

### Field Selection
```http
GET /v1/models?fields=id,name,current_status.availability
```

## 🔮 Future API Features

### Planned for v2
1. **Batch Operations** - Multiple operations in single request
2. **Webhooks** - Push notifications for status changes
3. **Custom Metrics** - User-defined monitoring metrics
4. **AI Predictions** - Predictive status and performance
5. **Cost Calculator** - Real-time cost estimation API