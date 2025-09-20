# AI Server Information - Operations Runbook

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [긴급 대응 절차](#긴급-대응-절차)
3. [정기 점검 사항](#정기-점검-사항)
4. [트러블슈팅 가이드](#트러블슈팅-가이드)
5. [연락처 및 에스컬레이션](#연락처-및-에스컬레이션)

---

## 시스템 개요

### 핵심 컴포넌트
- **Frontend**: Next.js 14 (Vercel 배포)
- **Database**: PostgreSQL (Neon)
- **Cache**: Redis (Upstash)
- **Monitoring**: GitHub Actions + Slack

### 데이터 소스 우선순위
1. **Primary**: 실제 API (OpenAI, Anthropic, Google, Replicate)
2. **Secondary**: Web Scraping (Artificial Analysis)
3. **Fallback**: GitHub 백업 데이터
4. **Last Resort**: `config/model-defaults.json`

---

## 긴급 대응 절차

### 🚨 API 장애 대응

#### 증상
- Slack 알림: "API Failure Alert"
- 모델 데이터가 업데이트되지 않음
- DataSourceBadge가 "config" 또는 "cached"로 표시

#### 대응 절차
1. **즉시 확인**
   ```bash
   # API 키 상태 확인
   node scripts/test-api-keys.js
   ```

2. **API 키 만료/무효화된 경우**
   ```bash
   # Vercel 환경변수 업데이트
   vercel env add OPENAI_API_KEY production
   vercel env add ANTHROPIC_API_KEY production
   vercel env add GOOGLE_AI_API_KEY production
   vercel env add REPLICATE_API_TOKEN production

   # 재배포
   vercel --prod
   ```

3. **API 서비스 자체 장애인 경우**
   - 해당 공급사 status 페이지 확인
   - Slack에 상황 공유
   - 자동 재시도가 작동하도록 대기 (exponential backoff 적용됨)

### 🕷️ 스크레이퍼 장애 대응

#### 증상
- GitHub Actions 실패
- AA 모델 데이터 업데이트 안 됨

#### 대응 절차
1. **구조 변경 확인**
   ```bash
   # AA 사이트 직접 확인
   curl https://artificialanalysis.ai/models

   # 현재 스크레이퍼 테스트
   npm run test:scraper:aa
   ```

2. **임시 수동 업데이트**
   ```bash
   # config/model-defaults.json 직접 편집
   # DataSourceBadge에 "manual" 표시됨
   ```

3. **스크레이퍼 코드 수정**
   - `src/services/scrapers/` 디렉토리의 해당 스크레이퍼 수정
   - PR 생성 및 긴급 배포

### 💾 데이터베이스 장애 대응

#### 증상
- "Can't reach database server" 에러
- 전체 서비스 중단

#### 대응 절차
1. **Neon 대시보드 확인**
   - https://console.neon.tech
   - 연결 상태 및 쿼터 확인

2. **연결 문자열 확인**
   ```bash
   # .env 파일 확인
   echo $DATABASE_URL
   echo $DIRECT_URL
   ```

3. **긴급 복구**
   ```bash
   # Prisma 재연결
   npx prisma generate
   npx prisma db push
   ```

---

## 정기 점검 사항

### 일일 점검 (자동화됨)
- ✅ GitHub Actions daily-sync-report
- ✅ Slack 일일 리포트 확인

### 주간 점검
- [ ] npm audit 실행
- [ ] API 사용량 및 비용 확인
- [ ] 에러 로그 분석
- [ ] 느린 쿼리 확인

### 월간 점검
- [ ] 의존성 업데이트
- [ ] Prisma 스키마 최적화
- [ ] 백업 데이터 갱신
- [ ] 보안 패치 적용

---

## 트러블슈팅 가이드

### 문제: "DataSourceBadge shows 'unknown'"
```bash
# 1. 서비스 로그 확인
vercel logs --prod

# 2. unified-models.service.ts 디버깅
# detailedSource 필드가 제대로 설정되는지 확인
```

### 문제: "Slack 알림이 오지 않음"
```bash
# 1. 환경변수 확인
vercel env ls production | grep SLACK

# 2. 웹훅 URL 테스트
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  $SLACK_WEBHOOK_URL
```

### 문제: "모델 수가 갑자기 감소"
```bash
# 1. 각 데이터 소스별 확인
node scripts/check-data-sources.js

# 2. 캐시 초기화
npm run cache:clear

# 3. 강제 동기화
npm run sync:force
```

### 문제: "Build 실패"
```bash
# 1. 로컬 테스트
npm run build

# 2. Prisma 관련 에러인 경우
rm -rf node_modules/.prisma
npx prisma generate

# 3. 타입 에러인 경우
npm run typecheck
```

---

## 연락처 및 에스컬레이션

### Level 1 - 자동 알림
- Slack: #ai-monitoring 채널
- GitHub Issues: api-failure 라벨

### Level 2 - 개발팀
- Primary: @ksy2728 (GitHub)
- Backup: [팀원 연락처]

### Level 3 - 인프라팀
- Vercel Support: support@vercel.com
- Neon Support: support@neon.tech

### 외부 서비스 Status Pages
- OpenAI: https://status.openai.com
- Anthropic: https://status.anthropic.com
- Google AI: https://status.cloud.google.com
- Vercel: https://www.vercel-status.com
- Neon: https://status.neon.tech

---

## 스크립트 모음

### 건강 상태 종합 체크
```bash
#!/bin/bash
echo "🔍 System Health Check"
echo "====================="

# API Keys
echo "📌 API Keys Status:"
node scripts/test-api-keys.js

# Database
echo "📌 Database Status:"
npx prisma db execute --stdin <<< "SELECT COUNT(*) as models FROM model;"

# Cache
echo "📌 Cache Status:"
curl -s localhost:3000/api/health | jq .cache

# Recent Errors
echo "📌 Recent Errors (last 10):"
vercel logs --prod -n 10 | grep ERROR
```

### 긴급 복구 스크립트
```bash
#!/bin/bash
echo "🚑 Emergency Recovery"

# 1. 캐시 클리어
redis-cli FLUSHALL

# 2. 데이터베이스 재연결
npx prisma generate
npx prisma db push

# 3. 강제 동기화
npm run sync:all

# 4. 재배포
vercel --prod --force
```

---

## 개선 로드맵

### 단기 (1-2주)
- [ ] PagerDuty 연동
- [ ] 관리자 UI 개발
- [ ] 자동 롤백 메커니즘

### 중기 (1-2개월)
- [ ] Multi-region 지원
- [ ] GraphQL API 추가
- [ ] A/B 테스트 인프라

### 장기 (3-6개월)
- [ ] 자체 모델 평가 시스템
- [ ] ML 기반 장애 예측
- [ ] 완전 자동화된 운영

---

*Last Updated: 2024-12-20*
*Version: 1.0.0*