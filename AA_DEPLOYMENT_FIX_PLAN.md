# AA 모델 데이터 배포 문제 해결 계획

## 문제 요약
- **현상**: Vercel 프로덕션 환경에서 271개 AA 모델이 아닌 1개 모델만 표시
- **원인**: Vercel 서버리스 환경에서 파일 시스템 접근 제한

## 즉시 적용 가능한 해결책

### 방법 1: 정적 Import 사용 (권장) ⭐
```typescript
// src/services/unified-models.service.ts
import aaModelsData from '@/public/data/aa-models.json';

private static async safeFetchAaModels(): Promise<AAModel[]> {
  try {
    // 빌드 타임에 포함된 데이터 직접 사용
    console.log(`✅ Loaded ${aaModelsData.models?.length || 0} AA models from static import`);
    return aaModelsData.models || [];
  } catch (error) {
    console.error('❌ Failed to load AA models:', error);
    return [];
  }
}
```

### 방법 2: Next.js API Route 활용
```typescript
// src/app/api/v1/aa-data/route.ts
import aaModelsData from '@/public/data/aa-models.json';

export async function GET() {
  return NextResponse.json(aaModelsData);
}

// src/services/unified-models.service.ts
const response = await fetch('/api/v1/aa-data');
const data = await response.json();
```

### 방법 3: 환경 변수로 Public CDN URL 설정
```env
# .env.production
NEXT_PUBLIC_AA_DATA_URL=https://cdn.jsdelivr.net/gh/ksy2728/AI-GO@main/public/data/aa-models.json
```

```typescript
const url = process.env.NEXT_PUBLIC_AA_DATA_URL || '/data/aa-models.json';
const response = await fetch(url);
```

## 장기 해결책

### 1. GitHub Actions 자동화 개선
- GitHub Actions로 AA 데이터 업데이트 시 자동으로 Vercel 재배포
- 빌드 타임에 최신 데이터 포함 보장

### 2. Edge Config 또는 KV Storage 사용
```typescript
// Vercel Edge Config 활용
import { get } from '@vercel/edge-config';

const aaModels = await get('aa-models');
```

### 3. 외부 데이터 저장소 활용
- Vercel Blob Storage
- Upstash Redis
- Cloudflare R2

## 즉시 실행 계획

1. **정적 Import 방식으로 코드 수정**
2. **로컬 테스트로 정상 작동 확인**
3. **Git 커밋 및 Vercel 자동 배포**
4. **프로덕션 환경 검증**

## 예상 결과
- 271개 AA 모델 정상 표시
- 빌드 타임 최적화로 빠른 로딩
- CDN 캐싱 문제 완전 해결