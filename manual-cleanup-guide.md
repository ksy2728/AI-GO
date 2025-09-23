# 수동 프로덕션 데이터 정리 가이드

## 현재 상황
- ✅ 환경 변수 설정 완료 (AA_AUTO_SYNC, AA_SYNC_SCHEDULE)
- ✅ 배포 성공
- ⚠️ 새로운 API 엔드포인트가 404 반환 (빌드 이슈 가능성)
- ⚠️ 테스트 데이터가 여전히 프로덕션에 존재

## 해결 방법

### 방법 1: Neon 대시보드에서 직접 정리 (권장)

1. **Neon 대시보드 접속**
   - https://console.neon.tech 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭

3. **테스트 데이터 확인**
   ```sql
   -- 테스트 데이터 확인
   SELECT id, name, slug FROM "Model"
   WHERE name LIKE '%GPT-5%'
      OR name LIKE '%gpt-oss%'
      OR name LIKE '%Grok 3 mini Reasoning%'
      OR name LIKE '%test%'
      OR name LIKE '%demo%'
   LIMIT 20;
   ```

4. **테스트 데이터 삭제**
   ```sql
   -- 먼저 관련 데이터 삭제
   DELETE FROM "ModelStatus"
   WHERE "model_id" IN (
     SELECT id FROM "Model"
     WHERE name LIKE '%GPT-5%'
        OR name LIKE '%gpt-oss%'
        OR name LIKE '%Grok 3 mini Reasoning%'
   );

   DELETE FROM "BenchmarkScore"
   WHERE "model_id" IN (
     SELECT id FROM "Model"
     WHERE name LIKE '%GPT-5%'
        OR name LIKE '%gpt-oss%'
        OR name LIKE '%Grok 3 mini Reasoning%'
   );

   DELETE FROM "Pricing"
   WHERE "model_id" IN (
     SELECT id FROM "Model"
     WHERE name LIKE '%GPT-5%'
        OR name LIKE '%gpt-oss%'
        OR name LIKE '%Grok 3 mini Reasoning%'
   );

   -- 마지막으로 모델 삭제
   DELETE FROM "Model"
   WHERE name LIKE '%GPT-5%'
      OR name LIKE '%gpt-oss%'
      OR name LIKE '%Grok 3 mini Reasoning%'
      OR name LIKE '%test%'
      OR name LIKE '%demo%';
   ```

5. **결과 확인**
   ```sql
   SELECT COUNT(*) as total_models FROM "Model";
   SELECT name FROM "Model" ORDER BY created_at DESC LIMIT 10;
   ```

### 방법 2: Prisma Studio 사용

1. **로컬에서 Prisma Studio 실행**
   ```bash
   # .env.local에 프로덕션 DATABASE_URL 설정
   export DATABASE_URL="postgresql://..."

   # Prisma Studio 실행
   npx prisma studio
   ```

2. **브라우저에서 열기**
   - http://localhost:5555 접속
   - Model 테이블 열기
   - 테스트 데이터 필터링 및 삭제

### 방법 3: Vercel Cron 설정 (장기 해결책)

`vercel.json` 파일에 추가:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-aa",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

새 파일 생성: `src/app/api/cron/sync-aa/route.ts`
```typescript
export async function GET() {
  // AA 동기화 로직
  return Response.json({ ok: true })
}
```

## 확인 방법

데이터 정리 후 확인:
```bash
# 모델 목록 확인
curl "https://ai-server-information.vercel.app/api/v1/models?limit=5"

# 하이라이트 확인
curl "https://ai-server-information.vercel.app/api/v1/models/highlights"
```

## 예상 결과
- "GPT-5", "gpt-oss-20B" 등의 테스트 데이터가 사라짐
- 실제 모델만 표시 (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro 등)
- Intelligence 점수가 현실적인 범위 (50-80)

## 문제 해결

### API 엔드포인트 404 문제
1. Vercel Functions 로그 확인
2. `src/app/api` 구조 확인
3. Next.js App Router 규칙 준수 확인

### 데이터가 계속 나타나는 경우
1. 캐시 문제일 수 있음 - Vercel 캐시 제거
2. 데이터베이스 복제 지연 - 몇 분 기다리기
3. 시드 스크립트가 계속 실행되는지 확인

## 연락처
문제가 지속되면:
1. Vercel 대시보드에서 Function 로그 확인
2. Neon 대시보드에서 쿼리 로그 확인
3. 필요시 추가 지원 요청