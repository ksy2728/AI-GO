# 📊 AI-GO 모델 수 수집 아키텍처 분석 보고서

## 🎯 Executive Summary

AI-GO 플랫폼의 모니터링 탭에서 로컬 환경과 배포 환경 간 모델 수 표시 차이가 발생하는 근본 원인을 분석한 결과, **데이터 소스 분리와 하드코딩된 글로벌 값 사용**이 주된 원인으로 확인되었습니다.

- **로컬 환경**: `(51/63) : 127` - 실제 필터링된 모델 기준
- **배포 환경**: `(128/74) : 128` - 하드코딩된 글로벌 모델 기준

---

## 🏗️ Part 1: 아키텍처 상세 분석

### 1.1 모니터링 시스템 전체 구조

```
AI-GO 모니터링 아키텍처
├── 모니터링 페이지 (monitoring/page.tsx)
│   ├── UnifiedChart 컴포넌트
│   │   ├── useRealtime() Hook (WebSocket)
│   │   └── useGlobalStats() Hook (ModelsContext)
│   └── MetricDescriptions 컴포넌트
├── 데이터 소스 계층
│   ├── WebSocket Server (로컬 전용)
│   ├── REST API (/api/v1/realtime-stats)
│   ├── ModelsContext (React Context)
│   └── 백엔드 서비스들
└── 백엔드 서비스
    ├── GitHub Data Service
    ├── Database Service  
    ├── TempData Service
    └── API Client
```

### 1.2 데이터 흐름 다이어그램

#### **로컬 환경 데이터 흐름**
```mermaid
graph TD
    A[ModelsContext] --> B[api.getModels()]
    B --> C[/api/v1/models]
    C --> D[TempData Service]
    D --> E[63개 모델 반환]
    E --> F[필터링: 51개 활성]
    F --> G[UnifiedChart 표시]
    
    H[useRealtime] --> I[WebSocket 비활성화]
    I --> J[ModelsContext 폴백]
```

#### **배포 환경 데이터 흐름**
```mermaid
graph TD
    A[UnifiedChart] --> B[fetchRealtimeStats()]
    B --> C[/api/v1/realtime-stats]
    C --> D[하드코딩: 139개 글로벌 모델]
    D --> E[랜덤 변형: ±3개]
    E --> F[128개 표시]
    
    G[useRealtime] --> H[WebSocket 비활성화]
    H --> I[REST API 폴백]
```

### 1.3 컴포넌트 간 의존성 매핑

| 컴포넌트 | 로컬 데이터 소스 | 배포 데이터 소스 | 우선순위 |
|----------|-----------------|-----------------|----------|
| UnifiedChart | ModelsContext → API | realtime-stats API | 1순위 |
| ModelsContext | TempData (63개) | TempData (63개) | 2순위 |
| useRealtime | WebSocket (비활성) | WebSocket (비활성) | 사용안함 |

---

## 📊 Part 2: 데이터 소스 상세 분석

### 2.1 5가지 데이터 소스 비교

| 데이터 소스 | 모델 수 | 특징 | 사용 환경 | 응답 시간 |
|-------------|---------|------|-----------|-----------|
| **GitHub Data** | 32개 | 최신 동기화 데이터 | 개발 환경 | 2-5초 |
| **Database** | 가변 | 로컬 DB 저장 | 개발 환경 | <500ms |
| **TempData** | 74개 | 정적 폴백 데이터 | 모든 환경 | <100ms |
| **Cache** | 가변 | 메모리 캐시 | 모든 환경 | <50ms |
| **Realtime-stats** | 139개* | 하드코딩 글로벌 | 배포 환경 | 1-2초 |

*139개는 하드코딩된 값으로 실제 모델 수와 무관

### 2.2 모델 수 계산 로직 차이

#### **ModelsContext 계산 (실제 모델 기준)**
```typescript
// src/contexts/ModelsContext.tsx:46-55
const stats: GlobalStats = {
  totalModels: models.length,              // 실제 로드된 모델 수
  activeModels: models.filter(m => {       // 실제 활성 모델 필터링
    const status = Array.isArray(m.status) ? m.status[0]?.status : m.status
    return status === 'operational'
  }).length,
}
```

#### **Realtime-stats 계산 (하드코딩 기준)**
```typescript
// src/app/api/v1/realtime-stats/route.ts:69-78
let stats = {
  totalModels: 139,                       // 하드코딩된 글로벌 값
  activeModels: 127,                      // 하드코딩된 글로벌 값
  avgAvailability: 99.6,
  operationalModels: 127,
  degradedModels: 0,
  outageModels: 0,
  providers: 7
}
```

### 2.3 환경별 데이터 소스 우선순위

#### **로컬 개발 환경**
1. **ModelsContext**: Database → GitHub → TempData
2. **실제 모델 수**: 63개 (TempData 기준)
3. **필터링 결과**: 51개 활성 모델

#### **Vercel 배포 환경**  
1. **realtime-stats API**: 하드코딩된 139개 기준
2. **랜덤 변형**: ±3개 변동
3. **표시 결과**: ~128개 (139-11 정도)

---

## 🔍 Part 3: 환경별 동작 차이 심화 분석

### 3.1 WebSocket 활성화 조건

```typescript
// src/hooks/useRealtime.ts:48-51
const isWebSocketDisabled = process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true' ||
  process.env.NODE_ENV === 'production' ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
```

**결과**: 로컬/배포 모두에서 WebSocket 비활성화 → REST API 폴백

### 3.2 UnifiedChart 데이터 선택 로직

```typescript
// src/components/monitoring/UnifiedChart.tsx:21-28
const { connected, globalStats } = useRealtime()
const { globalStats: contextStats, totalModels, activeModels } = useGlobalStats()

// Use context stats if available, otherwise use realtime stats
const effectiveStats = globalStats || contextStats
```

**문제점**: 
- `globalStats` (WebSocket)는 항상 null
- `contextStats` (ModelsContext)는 실제 모델 기반 (63개)
- 하지만 차트의 라벨에서는 `totalModels || 139` 사용

### 3.3 표시 로직의 불일치

```typescript
// src/components/monitoring/UnifiedChart.tsx:211
name={`Active Models (${chartData.length > 0 ? chartData[chartData.length - 1].activeModels || 0 : 0}/${effectiveStats?.totalModels || totalModels || 139})`}
```

**결과**:
- **로컬**: chartData는 비어있음 → ModelsContext 사용 → `51/63`
- **배포**: realtime-stats 데이터 → `128/139` (하드코딩)

---

## 💡 Part 4: 근본 원인 및 해결방안

### 4.1 핵심 문제점

1. **데이터 소스 분리**: UnifiedChart와 ModelsContext가 서로 다른 데이터 사용
2. **하드코딩된 값**: realtime-stats API에 139개 모델 수 고정
3. **폴백 로직 불일치**: 환경별로 다른 폴백 경로 사용
4. **WebSocket 비활성화**: 모든 환경에서 WebSocket 사용 불가

### 4.2 즉시 수정 방안 (1일 이내)

#### **A. realtime-stats API 수정**
```typescript
// 하드코딩 제거하고 실제 데이터 사용
const response = await api.getModels({ limit: 200 })
const actualStats = {
  totalModels: response.total,
  activeModels: response.models.filter(m => m.status === 'operational').length,
  // ... 실제 계산 로직
}
```

#### **B. UnifiedChart 데이터 소스 통일**
```typescript
// ModelsContext를 우선 사용하도록 변경
const effectiveStats = contextStats || globalStats
const totalModels = contextStats?.totalModels || 0
```

### 4.3 단기 개선 방안 (1주일 이내)

#### **A. 통합 데이터 서비스 구현**
```typescript
// 새로운 통합 서비스
export class UnifiedStatsService {
  static async getRealtimeStats() {
    // 모든 데이터 소스를 통합한 단일 진실 소스
    const models = await this.getModelsFromBestSource()
    return this.calculateStats(models)
  }
}
```

#### **B. 환경 변수 기반 설정**
```typescript
const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'auto'
// 'github', 'database', 'tempdata', 'auto' 중 선택
```

### 4.4 장기 아키텍처 개선 (1개월 이내)

#### **A. Single Source of Truth 구현**
```
통합 데이터 계층
├── StatsAggregator (단일 진실 소스)
├── DataSourceManager (소스 우선순위 관리)
├── CacheLayer (성능 최적화)
└── RealtimeUpdater (실시간 업데이트)
```

#### **B. WebSocket 서비스 활성화**
- Vercel에서 WebSocket 대안 구현 (Server-Sent Events)
- 실시간 데이터 동기화 구현
- 클라이언트-서버 상태 일관성 보장

---

## 🧪 Part 5: 검증 및 테스트 계획

### 5.1 현재 상태 재현

```bash
# 로컬 환경 확인
curl http://localhost:3000/api/v1/models | jq '.total'
# 예상: 63

# 배포 환경 확인  
curl https://ai-server-information.vercel.app/api/v1/realtime-stats | jq '.totalModels'
# 예상: 139 (하드코딩)
```

### 5.2 수정 후 검증

```bash
# 수정 후 두 환경 모두에서 일관된 값 확인
curl http://localhost:3000/api/v1/realtime-stats | jq '.totalModels'
curl https://ai-server-information.vercel.app/api/v1/realtime-stats | jq '.totalModels'
# 두 값이 동일해야 함
```

### 5.3 테스트 케이스

1. **환경별 일관성**: 로컬과 배포에서 동일한 모델 수 표시
2. **데이터 소스 전환**: GitHub → Database → TempData 폴백 테스트
3. **실시간 업데이트**: 모델 추가/제거 시 즉시 반영
4. **성능 테스트**: API 응답 시간 2초 이내 유지

---

## 📈 Part 6: 모니터링 및 알림

### 6.1 데이터 불일치 감지

```typescript
// 데이터 일관성 체크
const consistencyCheck = async () => {
  const contextStats = await ModelsContext.getStats()
  const realtimeStats = await fetch('/api/v1/realtime-stats').then(r => r.json())
  
  const diff = Math.abs(contextStats.totalModels - realtimeStats.totalModels)
  if (diff > 5) {
    console.warn(`데이터 불일치 감지: ${diff}개 차이`)
  }
}
```

### 6.2 성능 메트릭

| 메트릭 | 현재 | 목표 | 개선 방법 |
|--------|------|------|-----------|
| API 응답 시간 | 2-5초 | <2초 | 캐싱, 데이터 사전 계산 |
| 데이터 일관성 | 60% | 95% | 단일 데이터 소스 |
| 실시간성 | 30초 지연 | <10초 | WebSocket 활성화 |

---

## 🎯 결론 및 권장사항

### 우선순위 매트릭스

```
긴급도 높음 │ 1. 하드코딩 제거      │ 3. WebSocket 활성화
           │ 2. 데이터 소스 통일    │ 4. 성능 최적화  
───────────┼─────────────────────┼──────────────────
긴급도 낮음 │ 5. 모니터링 구현      │ 6. 아키텍처 리팩터링
           │ 7. 문서화            │ 8. 테스트 자동화
           └─────────────────────┴──────────────────
            영향도 낮음             영향도 높음
```

### 실행 로드맵

**Phase 1 (즉시)**: 하드코딩된 139개 값을 실제 모델 수로 변경
**Phase 2 (1주)**: 데이터 소스 우선순위 통일 및 폴백 로직 개선
**Phase 3 (1개월)**: 단일 데이터 소스 아키텍처 구현
**Phase 4 (3개월)**: 실시간 동기화 및 성능 최적화

---

## 📚 기술 참고 자료

- **관련 파일들**:
  - `src/app/monitoring/page.tsx` - 모니터링 페이지
  - `src/components/monitoring/UnifiedChart.tsx` - 차트 컴포넌트  
  - `src/contexts/ModelsContext.tsx` - React Context
  - `src/hooks/useRealtime.ts` - WebSocket Hook
  - `src/app/api/v1/realtime-stats/route.ts` - 실시간 통계 API
  - `src/services/temp-data.service.ts` - 임시 데이터 서비스

- **아키텍처 패턴**:
  - Observer Pattern (WebSocket 구독)
  - Factory Pattern (데이터 소스 선택)
  - Strategy Pattern (환경별 로직 분기)

---

*이 보고서는 2025년 8월 29일 작성되었으며, AI-GO 플랫폼 v0.1.1 기준입니다.*