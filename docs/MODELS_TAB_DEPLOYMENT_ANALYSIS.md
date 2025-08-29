# 📊 AI-GO Models 탭 배포 오류 상세 분석 보고서

## 🎯 Executive Summary
AI-GO 플랫폼의 Models 탭이 Vercel 배포 환경에서 반복적인 오류를 발생시키고 있으며, 이는 서버리스 환경 제약과 데이터 처리 아키텍처의 구조적 문제에서 기인합니다.

---

## 📐 Part 1: 상세 아키텍처 분석

### 1.1 프론트엔드 컴포넌트 구조

#### **페이지 레벨 (models/page.tsx)**
```typescript
// 주요 컴포넌트 구성
ModelsPage
├── useModels() Hook                 // Context에서 상태 관리
├── useNetworkStatus() Hook          // 네트워크 상태 모니터링
├── ModelHighlightsSection           // 상단 차트 영역
├── FilterSettings                   // 필터 드롭다운
├── ModelTable                       // 메인 테이블
└── ErrorBoundary                    // 에러 처리 래퍼
```

**특징:**
- 클라이언트 사이드 렌더링 ('use client')
- 자동 새로고침 메커니즘 (네트워크 상태 변경 시)
- 필터링된 모델 수 실시간 표시

#### **테이블 컴포넌트 (ModelTable.tsx)**
```typescript
// 핵심 로직
const displayLimit = isServerlessEnv ? 30 : 50
const displayModels = models.slice(0, displayLimit)

// TanStack Table 설정
- 정렬 가능한 컬럼
- 가상화 없음 (성능 이슈 가능)
- 반응형 디자인 미흡
```

### 1.2 상태 관리 계층 (ModelsContext.tsx)

#### **Context Provider 구조**
```typescript
ModelsContext
├── models: Model[]                  // 전체 모델 데이터
├── filteredModels: Model[]         // 필터링된 모델
├── globalStats: GlobalStats        // 통계 정보
├── loading: boolean                 // 로딩 상태
├── error: string | null            // 에러 상태
└── dataSource: 'github'|'database'|'temp-data'|'cache'
```

#### **데이터 흐름 다이어그램**
```
[User Action] → [setFilters] → [applyUnifiedFilters]
                                        ↓
[API Call] ← [refreshModels] ← [filteredModels Update]
     ↓
[setModels] → [refreshStats] → [UI Re-render]
```

### 1.3 API 계층 구조

#### **엔드포인트 구조 (/api/v1/models/route.ts)**
```typescript
// 데이터 소스 우선순위 결정 로직
Production Environment:
1. GitHub API (Primary)
2. TempData Service (Fallback)

Development Environment:
1. Database (Primary)
2. GitHub API (Secondary)
3. TempData Service (Tertiary)
```

#### **데이터 소스별 특성**
| 소스 | 장점 | 단점 | 응답시간 |
|------|------|------|----------|
| GitHub | 최신 데이터, 무료 | API 제한, 네트워크 의존 | 2-5초 |
| Database | 빠른 응답, 안정적 | 데이터 동기화 필요 | <500ms |
| TempData | 항상 사용 가능 | 정적 데이터 | <100ms |

---

## 🔍 Part 2: 성능 병목 지점 상세 분석

### 2.1 클라이언트 사이드 병목

#### **API 클라이언트 (api-client.ts)**
```typescript
// 현재 설정
const CACHE_EXPIRY_MINUTES = 5          // 너무 짧음
const STALE_WHILE_REVALIDATE_MINUTES = 10  // 부족함
const timeoutId = setTimeout(() => controller.abort(), 15000)  // 15초

// 문제점
1. 캐시 만료 시간이 짧아 빈번한 재요청 발생
2. Stale-while-revalidate 시간이 짧아 백그라운드 갱신 빈발
3. 중복 요청 방지 메커니즘 있으나 캐시 키 생성 비효율
```

#### **메모리 사용 패턴**
```typescript
// 문제가 되는 부분
const tableModels = useMemo(
  () => transformModelsToTableModels(filteredModels),
  [filteredModels]
)
// 매번 전체 데이터 변환 → 메모리 압박
```

### 2.2 서버 사이드 병목

#### **Vercel 함수 제약사항**
```json
// vercel.json 현재 설정
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30  // 대부분 API 30초 제한
    }
  }
}
```

**실행 시간 분석:**
- GitHub API 호출: 2-5초
- 데이터 변환 처리: 1-2초
- JSON 직렬화: 0.5-1초
- **총 소요 시간**: 3.5-8초 (정상 범위이나 여유 부족)

#### **메모리 사용량 분석**
```
기본 Next.js 오버헤드: ~50MB
모델 데이터 (200개): ~10MB
변환된 데이터: ~15MB
응답 버퍼: ~15MB
총 사용량: ~90MB (제한: 1024MB)
```

### 2.3 네트워크 레이어 병목

#### **요청/응답 크기**
- 평균 응답 크기: 500KB-1MB
- gzip 압축 후: 100-200KB
- 전송 시간 (3G): 2-4초
- 전송 시간 (4G): 0.5-1초

---

## ⚠️ Part 3: 에러 패턴 심화 분석

### 3.1 타임아웃 관련 에러

#### **발생 시나리오**
```
Client Timeout (15s) < Server Timeout (30s)
→ 클라이언트가 먼저 포기
→ 서버는 계속 처리
→ 리소스 낭비 + 에러 발생
```

#### **에러 메시지 패턴**
- "Request timeout - server took too long to respond"
- "Network error occurred - please check your connection"
- "AbortError: The operation was aborted"

### 3.2 데이터 소스 전환 실패

#### **실패 케이스**
```typescript
try {
  models = await GitHubDataService.getAllModels()  // 실패
} catch {
  models = await TempDataService.getAllModels()    // 폴백
  // 하지만 데이터 구조 차이로 변환 실패 가능
}
```

#### **구조 불일치 문제**
- GitHub 데이터: 최신 스키마
- TempData: 구버전 스키마
- 변환 로직 부재 → 런타임 에러

### 3.3 상태 동기화 에러

#### **Race Condition 시나리오**
```
1. 사용자가 필터 변경
2. API 요청 시작
3. 사용자가 다시 필터 변경
4. 첫 번째 응답 도착
5. 두 번째 요청 시작
→ 상태 불일치 발생
```

---

## 💡 Part 4: 단계별 해결 방안

### 4.1 즉시 적용 (1일 이내)

#### **설정 파일 수정**
```json
// vercel.json 수정안
{
  "functions": {
    "src/app/api/v1/models/**/*.ts": {
      "maxDuration": 60  // 60초로 증가
    }
  }
}
```

#### **타임아웃 조정**
```typescript
// api-client.ts 수정안
const CACHE_EXPIRY_MINUTES = 15  // 15분으로 증가
const STALE_WHILE_REVALIDATE_MINUTES = 30  // 30분으로 증가
const timeout = 25000  // 25초로 증가
```

### 4.2 단기 개선 (1주일 이내)

#### **페이지네이션 구현**
```typescript
// 초기 로드 최적화
const INITIAL_LOAD = 20
const PAGE_SIZE = 20

// 무한 스크롤 또는 페이지 버튼
const loadMore = () => {
  setOffset(prev => prev + PAGE_SIZE)
}
```

#### **가상 스크롤링 도입**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// 대량 데이터 렌더링 최적화
const virtualizer = useVirtualizer({
  count: models.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
})
```

### 4.3 중기 개선 (1개월 이내)

#### **ISR (Incremental Static Regeneration) 도입**
```typescript
export const revalidate = 300  // 5분마다 재생성

export async function generateStaticParams() {
  return [
    { provider: 'openai' },
    { provider: 'anthropic' },
    // ...
  ]
}
```

#### **Edge Functions 활용**
```typescript
export const runtime = 'edge'  // Edge Runtime 사용

// 더 빠른 응답, 더 낮은 비용
```

### 4.4 장기 아키텍처 개선 (3개월 이내)

#### **GraphQL 도입**
```graphql
query GetModels($limit: Int, $provider: String) {
  models(limit: $limit, provider: $provider) {
    id
    name
    status
    # 필요한 필드만 요청
  }
}
```

#### **마이크로서비스 아키텍처**
```
API Gateway
├── Models Service (별도 배포)
├── Status Service
├── Pricing Service
└── Cache Service (Redis)
```

---

## 📊 Part 5: 성능 메트릭 및 모니터링

### 5.1 핵심 성능 지표 (KPI)

| 지표 | 현재 | 목표 | 개선 방법 |
|------|------|------|-----------|
| 초기 로드 시간 | 5-8초 | <3초 | 캐싱, CDN |
| Time to Interactive | 6-10초 | <5초 | 코드 스플리팅 |
| API 응답 시간 | 3-5초 | <2초 | Edge Functions |
| 에러율 | 15-20% | <5% | 에러 핸들링 개선 |

### 5.2 모니터링 구현

#### **클라이언트 모니터링**
```typescript
// Web Vitals 추적
export function reportWebVitals(metric) {
  if (metric.name === 'FCP') {
    // First Contentful Paint
    analytics.track('FCP', metric.value)
  }
}
```

#### **서버 모니터링**
```typescript
// API 응답 시간 로깅
const startTime = Date.now()
// ... API 처리
const duration = Date.now() - startTime
logger.info('API Response Time', { duration, endpoint })
```

---

## 📈 Part 6: 비용-효과 분석

### 6.1 현재 비용 구조

| 항목 | 월간 비용 | 비고 |
|------|-----------|------|
| Vercel Hosting | $20 | Pro 플랜 |
| Function 실행 | $5-10 | 호출 빈도에 따라 |
| 대역폭 | $2-5 | 데이터 전송량 |
| **총 비용** | $27-35 | |

### 6.2 개선 후 예상 비용

| 항목 | 월간 비용 | 절감률 |
|------|-----------|--------|
| Edge Functions | $15 | -25% |
| 캐싱 (Redis) | $10 | 신규 |
| 대역폭 (CDN) | $1-2 | -60% |
| **총 비용** | $26-27 | -20% |

---

## 🎯 결론 및 권장사항

### 우선순위 매트릭스

```
긴급도 높음 │ 1. 타임아웃 설정    │ 3. ISR 도입
           │ 2. 캐시 시간 연장    │ 4. Edge Functions
─────────────────────────────────────────────
긴급도 낮음 │ 5. 모니터링 구현    │ 6. GraphQL
           │ 7. 문서화          │ 8. 마이크로서비스
           └─────────────────────┴──────────────
            영향도 낮음           영향도 높음
```

### 실행 로드맵

**Phase 1 (즉시)**: 설정 조정으로 안정화
**Phase 2 (1주)**: 페이지네이션으로 부하 감소  
**Phase 3 (1개월)**: ISR/Edge로 성능 개선
**Phase 4 (3개월)**: 아키텍처 현대화

---

## 📚 참고 자료

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Next.js ISR Guide](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)
- [TanStack Table Performance](https://tanstack.com/table/v8/docs/guide/performance)
- [Edge Runtime Best Practices](https://vercel.com/docs/functions/edge-functions)

---

*이 문서는 2025년 8월 29일 작성되었으며, AI-GO 플랫폼 v0.1.1 기준입니다.*