# AI-GO Implementation Workflow
> 🎯 **목표**: Mock 데이터를 실제 데이터로 전환하고 프로덕션 준비 완료

## 📊 프로젝트 현황
- **완료된 부분**: UI/UX (90%), WebSocket (100%), 기본 인프라 (100%)
- **목업 상태**: 모든 API 데이터 (100% Mock)
- **예상 기간**: 6주 (풀타임 개발 기준)
- **우선순위**: 실제 데이터 연동 → API 통합 → 기능 구현 → 최적화 → 배포

---

## 🚀 Phase 1: 데이터베이스 설정 (Week 1)

### Day 1-2: PostgreSQL & Prisma 설정
```bash
# 1. PostgreSQL Docker 설정
docker run --name ai-go-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=aigo \
  -p 5432:5432 \
  -d postgres:16-alpine

# 2. Prisma 스키마 생성
npx prisma init
```

#### 📝 스키마 정의 (`prisma/schema.prisma`)
```prisma
model Provider {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  website   String?
  models    Model[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Model {
  id              String          @id @default(cuid())
  providerId      String
  provider        Provider        @relation(fields: [providerId], references: [id])
  name            String
  slug            String          @unique
  description     String?
  contextWindow   Int?
  maxTokens       Int?
  releasedAt      DateTime?
  isActive        Boolean         @default(true)
  pricing         Json?
  capabilities    String[]
  benchmarks      Benchmark[]
  statusHistory   ModelStatus[]
  incidents       Incident[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model ModelStatus {
  id           String   @id @default(cuid())
  modelId      String
  model        Model    @relation(fields: [modelId], references: [id])
  status       String   // operational, degraded, down
  availability Float
  responseTime Int?     // ms
  timestamp    DateTime @default(now())
  
  @@index([modelId, timestamp])
}

model Benchmark {
  id        String   @id @default(cuid())
  modelId   String
  model     Model    @relation(fields: [modelId], references: [id])
  suite     String   // MMLU, HumanEval, etc.
  score     Float
  metadata  Json?
  testedAt  DateTime
  createdAt DateTime @default(now())
}

model Incident {
  id          String   @id @default(cuid())
  modelId     String
  model       Model    @relation(fields: [modelId], references: [id])
  title       String
  description String?
  severity    String   // critical, major, minor
  status      String   // investigating, identified, monitoring, resolved
  startedAt   DateTime
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model News {
  id          String   @id @default(cuid())
  title       String
  content     String
  source      String
  url         String?
  category    String
  tags        String[]
  publishedAt DateTime
  createdAt   DateTime @default(now())
}
```

#### 🔧 마이그레이션 실행
```bash
# 마이그레이션 생성 및 실행
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate

# 시드 데이터 생성
npx prisma db seed
```

### Day 3: Redis 캐싱 설정
```typescript
// src/lib/redis.ts
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
})

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  },
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value))
  },
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length) {
      await redis.del(...keys)
    }
  }
}
```

### Day 4-5: 데이터 접근 레이어 구현
```typescript
// src/services/models.service.ts
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export class ModelService {
  static async getAll(filters?: ModelFilters) {
    const cacheKey = `models:${JSON.stringify(filters)}`
    
    // Check cache first
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    // Query database
    const models = await prisma.model.findMany({
      where: {
        isActive: filters?.isActive,
        provider: filters?.provider ? {
          slug: filters.provider
        } : undefined,
      },
      include: {
        provider: true,
        statusHistory: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    })
    
    // Cache results
    await cache.set(cacheKey, models, 300) // 5 minutes
    
    return models
  }
  
  static async updateStatus(modelId: string, status: ModelStatusData) {
    const result = await prisma.modelStatus.create({
      data: {
        modelId,
        ...status
      }
    })
    
    // Invalidate related caches
    await cache.invalidate(`models:*`)
    await cache.invalidate(`status:${modelId}`)
    
    return result
  }
}
```

---

## 🔌 Phase 2: 외부 API 통합 (Week 2)

### Day 6-7: OpenAI API 통합
```typescript
// src/lib/external-apis/openai.ts
import OpenAI from 'openai'

export class OpenAIMonitor {
  private client: OpenAI
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  
  async checkStatus(): Promise<ModelStatusData> {
    try {
      const start = Date.now()
      
      // Test with minimal API call
      await this.client.models.list()
      
      return {
        status: 'operational',
        availability: 100,
        responseTime: Date.now() - start
      }
    } catch (error) {
      return {
        status: 'down',
        availability: 0,
        responseTime: null
      }
    }
  }
  
  async getModels() {
    const models = await this.client.models.list()
    return models.data.map(model => ({
      id: model.id,
      name: model.id,
      provider: 'openai',
      created: new Date(model.created * 1000)
    }))
  }
}
```

### Day 8: Anthropic API 통합
```typescript
// src/lib/external-apis/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'

export class AnthropicMonitor {
  private client: Anthropic
  
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }
  
  async checkStatus(): Promise<ModelStatusData> {
    try {
      const start = Date.now()
      
      // Health check with minimal request
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
      
      return {
        status: 'operational',
        availability: 100,
        responseTime: Date.now() - start
      }
    } catch (error) {
      return {
        status: 'down',
        availability: 0,
        responseTime: null
      }
    }
  }
}
```

### Day 9-10: Health Check 크론 작업
```typescript
// src/services/health-check.service.ts
import cron from 'node-cron'
import { ModelService } from './models.service'
import { OpenAIMonitor } from '@/lib/external-apis/openai'
import { AnthropicMonitor } from '@/lib/external-apis/anthropic'

export class HealthCheckService {
  private monitors = {
    openai: new OpenAIMonitor(),
    anthropic: new AnthropicMonitor(),
    // Add more monitors
  }
  
  start() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('Running health checks...')
      
      for (const [provider, monitor] of Object.entries(this.monitors)) {
        try {
          const status = await monitor.checkStatus()
          
          // Update database
          await ModelService.updateStatus(provider, status)
          
          // Emit WebSocket update
          io.emit('status:update', {
            provider,
            ...status,
            timestamp: new Date()
          })
        } catch (error) {
          console.error(`Health check failed for ${provider}:`, error)
        }
      }
    })
  }
}
```

---

## 🛠️ Phase 3: 핵심 기능 구현 (Week 3-4)

### Week 3: API 엔드포인트 실제 구현

#### Models API 실제 데이터 연결
```typescript
// src/app/api/v1/models/route.ts
import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      provider: searchParams.get('provider') || undefined,
      isActive: searchParams.get('isActive') === 'true',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }
    
    const models = await ModelService.getAll(filters)
    
    return NextResponse.json({
      models,
      total: models.length,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
```

#### Search API 구현
```typescript
// src/app/api/v1/search/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query || query.length < 2) {
    return NextResponse.json({ 
      error: 'Query must be at least 2 characters' 
    }, { status: 400 })
  }
  
  const results = await prisma.$transaction([
    // Search models
    prisma.model.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { provider: true },
      take: 10
    }),
    
    // Search news
    prisma.news.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10
    })
  ])
  
  return NextResponse.json({
    results: {
      models: results[0],
      news: results[1]
    },
    query,
    timestamp: new Date()
  })
}
```

### Week 4: 추가 기능 구현

#### 벤치마크 데이터 수집
```typescript
// src/services/benchmark.service.ts
export class BenchmarkService {
  static async collectBenchmarks() {
    // Scrape from public benchmark sites
    const sources = [
      'https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard',
      'https://github.com/openai/evals',
      // Add more sources
    ]
    
    for (const source of sources) {
      try {
        // Use Playwright for scraping
        const data = await this.scrapeBenchmarkData(source)
        await this.saveBenchmarks(data)
      } catch (error) {
        console.error(`Failed to scrape ${source}:`, error)
      }
    }
  }
}
```

#### News 크롤러
```typescript
// src/services/news.service.ts
import Parser from 'rss-parser'

export class NewsService {
  private parser = new Parser()
  
  async fetchNews() {
    const feeds = [
      'https://openai.com/blog/rss.xml',
      'https://www.anthropic.com/rss.xml',
      // Add more RSS feeds
    ]
    
    for (const feedUrl of feeds) {
      try {
        const feed = await this.parser.parseURL(feedUrl)
        
        for (const item of feed.items) {
          await prisma.news.upsert({
            where: { url: item.link },
            update: {},
            create: {
              title: item.title,
              content: item.contentSnippet,
              url: item.link,
              source: feed.title,
              publishedAt: new Date(item.pubDate),
              category: 'ai-news'
            }
          })
        }
      } catch (error) {
        console.error(`Failed to fetch ${feedUrl}:`, error)
      }
    }
  }
}
```

---

## 🧪 Phase 4: 테스트 및 최적화 (Week 5)

### 통합 테스트
```typescript
// tests/integration/api.test.ts
describe('API Integration Tests', () => {
  test('GET /api/v1/models returns real data', async () => {
    const response = await fetch('/api/v1/models')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.models).toBeInstanceOf(Array)
    expect(data.models[0]).toHaveProperty('id')
    expect(data.models[0]).toHaveProperty('provider')
  })
  
  test('Search API works correctly', async () => {
    const response = await fetch('/api/v1/search?q=gpt')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.results).toHaveProperty('models')
    expect(data.results).toHaveProperty('news')
  })
})
```

### 성능 최적화
```typescript
// next.config.mjs
export default {
  images: {
    domains: ['cdn.openai.com', 'anthropic.com'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/*']
  },
  compress: true,
  poweredByHeader: false,
}
```

---

## 🚢 Phase 5: 배포 준비 (Week 6)

### Production 환경 설정
```bash
# 1. 환경 변수 설정
cp .env.local .env.production
# Edit with production values

# 2. 빌드 최적화
npm run build

# 3. Docker 이미지 생성
docker build -t ai-go:latest .

# 4. 컨테이너 실행
docker-compose up -d
```

### 모니터링 설정
```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

---

## 📊 병렬 작업 가능 항목

### 동시 진행 가능 (Different Team Members)
```
Developer 1: Database & Backend
- Prisma 스키마 설정
- API 엔드포인트 구현
- Health check 시스템

Developer 2: External APIs
- OpenAI/Anthropic 통합
- 벤치마크 데이터 수집
- News 크롤러

Developer 3: Frontend & Testing
- UI 컴포넌트 업데이트
- 실시간 데이터 연결
- E2E 테스트 작성
```

---

## ✅ 완료 기준

### Phase 별 검증 항목
- **Phase 1**: 데이터베이스 연결 성공, 시드 데이터 생성
- **Phase 2**: 최소 2개 이상 외부 API 연동 완료
- **Phase 3**: 모든 목업 데이터 실제 데이터로 전환
- **Phase 4**: 테스트 커버리지 80% 이상
- **Phase 5**: Production 환경 배포 성공

### 최종 목표
- [ ] 실시간 AI 모델 상태 모니터링 작동
- [ ] 검색 기능 완전 구현
- [ ] 성능: API 응답 <200ms
- [ ] 가용성: 99.9% 이상
- [ ] 사용자 만족도: Lighthouse 90점 이상

---

## 🚨 리스크 및 대응 방안

### 기술적 리스크
- **외부 API 제한**: Rate limiting 대응을 위한 캐싱 및 큐 시스템
- **데이터 동기화**: 실시간 업데이트와 캐시 무효화 전략
- **성능 병목**: Database indexing 및 query optimization

### 일정 리스크
- **Buffer Time**: 각 Phase에 20% 여유 시간 확보
- **MVP First**: 핵심 기능 우선 구현 후 점진적 개선
- **Parallel Work**: 가능한 작업 병렬 처리

---

## 📅 다음 단계 액션 아이템

### 즉시 시작 (Today)
1. PostgreSQL Docker 컨테이너 실행
2. Prisma 스키마 작성 및 마이그레이션
3. 첫 번째 실제 API 엔드포인트 구현

### 이번 주 목표
- [ ] 데이터베이스 설정 완료
- [ ] 최소 1개 외부 API 연동
- [ ] Mock 데이터 → 실제 데이터 전환 시작

### 마일스톤
- **Week 2**: 첫 번째 실제 데이터 표시
- **Week 4**: 모든 API 실제 데이터 연동
- **Week 6**: Production 배포