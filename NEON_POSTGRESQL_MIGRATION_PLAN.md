# 🚀 Neon PostgreSQL 마이그레이션 작업 계획

## 📋 프로젝트 개요
**목표**: AI-GO 프로젝트를 GitHub 정적 데이터에서 Neon PostgreSQL 데이터베이스로 완전히 마이그레이션
**예상 소요 시간**: 2-3시간
**위험도**: 낮음 (폴백 메커니즘 존재)
**현재 상태**: GitHub 데이터 소스로 안정적 운영 중

---

## 🎯 Phase 1: Neon PostgreSQL 계정 및 데이터베이스 설정 (30분)

### Task 1.1: Neon 계정 생성 및 프로젝트 설정
**우선순위**: 🔴 Critical
**예상 시간**: 10분

#### 작업 내용:
1. [Neon.tech](https://neon.tech) 접속
2. GitHub 계정으로 가입 (무료 플랜)
3. 새 프로젝트 생성:
   - Project Name: `ai-go-production`
   - Region: `US East (Ohio)` (Vercel과 가까운 리전)
   - PostgreSQL Version: `16`

#### 체크리스트:
- [ ] Neon 계정 생성 완료
- [ ] 프로젝트 생성 완료
- [ ] 연결 문자열 복사

### Task 1.2: 데이터베이스 연결 문자열 준비
**우선순위**: 🔴 Critical
**예상 시간**: 5분

#### 작업 내용:
Neon 대시보드에서 다음 연결 문자열 복사:
```bash
# Pooled connection (DATABASE_URL)
postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Direct connection (DIRECT_URL)
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

#### 체크리스트:
- [ ] Pooled connection URL 복사
- [ ] Direct connection URL 복사
- [ ] 연결 문자열 안전한 곳에 백업

### Task 1.3: 로컬 환경에서 연결 테스트
**우선순위**: 🟡 High
**예상 시간**: 15분

#### 작업 내용:
```bash
# .env.local 파일 업데이트
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# 연결 테스트
npx prisma db pull

# 연결 성공 확인
npx prisma studio
```

#### 체크리스트:
- [ ] 로컬 환경변수 설정
- [ ] Prisma 연결 테스트
- [ ] Prisma Studio 접속 확인

---

## 🔧 Phase 2: 데이터베이스 스키마 및 데이터 마이그레이션 (45분)

### Task 2.1: Prisma 마이그레이션 실행
**우선순위**: 🔴 Critical
**예상 시간**: 15분

#### 작업 내용:
```bash
# 마이그레이션 파일 생성 (이미 존재)
# prisma/migrations/20250831000000_initial_schema/migration.sql

# 프로덕션 DB에 마이그레이션 적용
DATABASE_URL="neon-url" npx prisma migrate deploy

# 마이그레이션 상태 확인
DATABASE_URL="neon-url" npx prisma migrate status
```

#### 체크리스트:
- [ ] 마이그레이션 파일 확인
- [ ] 마이그레이션 실행
- [ ] 테이블 생성 확인

### Task 2.2: 초기 데이터 시딩
**우선순위**: 🟡 High
**예상 시간**: 20분

#### 작업 내용:
```bash
# 시드 스크립트 실행
DATABASE_URL="neon-url" npx prisma db seed

# 또는 수동으로 초기 데이터 삽입
DATABASE_URL="neon-url" node prisma/seed.ts
```

#### 검증 쿼리:
```sql
-- Prisma Studio에서 실행
SELECT COUNT(*) FROM providers;
SELECT COUNT(*) FROM models;
SELECT COUNT(*) FROM model_status;
```

#### 체크리스트:
- [ ] Provider 데이터 삽입 (최소 5개)
- [ ] Model 데이터 삽입 (최소 30개)
- [ ] ModelStatus 초기화

### Task 2.3: 데이터 무결성 검증
**우선순위**: 🟡 High
**예상 시간**: 10분

#### 작업 내용:
```bash
# 테스트 API 호출 스크립트 작성
cat > test-neon-connection.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testConnection() {
  try {
    const providers = await prisma.provider.count();
    const models = await prisma.model.count();
    const status = await prisma.modelStatus.count();
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Providers: ${providers}`);
    console.log(`📊 Models: ${models}`);
    console.log(`📊 Status records: ${status}`);
    
    // 샘플 쿼리
    const sampleModel = await prisma.model.findFirst({
      include: { provider: true }
    });
    console.log('📝 Sample model:', sampleModel?.name);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
EOF

# 실행
DATABASE_URL="neon-url" node test-neon-connection.js
```

#### 체크리스트:
- [ ] 연결 테스트 성공
- [ ] 데이터 카운트 확인
- [ ] 관계 쿼리 작동 확인

---

## ⚙️ Phase 3: Vercel 환경변수 설정 (30분)

### Task 3.1: Vercel 대시보드에서 환경변수 추가
**우선순위**: 🔴 Critical
**예상 시간**: 10분

#### 작업 내용:
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. `ai-server-information` 프로젝트 선택
3. Settings → Environment Variables 이동
4. 다음 변수 추가:

```bash
# Database URLs (Production만 체크)
DATABASE_URL = [Neon Pooled Connection URL]
DIRECT_URL = [Neon Direct Connection URL]

# Data Source Configuration
DATA_SOURCE = database  # (기존 github에서 변경)

# Optional: Backup GitHub source
GITHUB_REPO = ksy2728/AI-GO
GITHUB_BRANCH = master
```

#### 체크리스트:
- [ ] DATABASE_URL 설정 (Production)
- [ ] DIRECT_URL 설정 (Production)
- [ ] DATA_SOURCE를 'database'로 변경
- [ ] 변경사항 저장

### Task 3.2: 빌드 명령어 최적화
**우선순위**: 🟡 High
**예상 시간**: 10분

#### 작업 내용:
`vercel.json` 수정:
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "build": {
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "@postgres_prisma_url",
      "DIRECT_URL": "@postgres_url_non_pooling"
    }
  }
}
```

**주의**: `prisma db seed`를 빌드에서 제거 (별도 실행)

#### 체크리스트:
- [ ] vercel.json 업데이트
- [ ] Git 커밋 및 푸시
- [ ] 빌드 로그 모니터링

### Task 3.3: 재배포 트리거
**우선순위**: 🔴 Critical
**예상 시간**: 10분

#### 작업 내용:
```bash
# Option 1: Git push로 자동 배포
git add .
git commit -m "feat: configure Neon PostgreSQL connection"
git push origin master

# Option 2: Vercel CLI로 수동 배포
vercel --prod --force

# Option 3: Vercel 대시보드에서 Redeploy
# Deployments → Latest → Redeploy
```

#### 체크리스트:
- [ ] 배포 시작
- [ ] 빌드 로그 확인
- [ ] 마이그레이션 성공 확인

---

## ✅ Phase 4: 검증 및 모니터링 (30분)

### Task 4.1: API 엔드포인트 검증
**우선순위**: 🔴 Critical
**예상 시간**: 10분

#### 테스트 스크립트:
```bash
# 상태 API 확인
curl https://ai-server-information.vercel.app/api/v1/status | jq '.dataSource'
# Expected: "database"

# 모델 API 확인
curl https://ai-server-information.vercel.app/api/v1/models | jq '.models[0].provider'

# 디버그 엔드포인트 (있는 경우)
curl https://ai-server-information.vercel.app/api/debug/db
```

#### 체크리스트:
- [ ] dataSource가 "database"로 표시
- [ ] 모델 데이터 정상 로드
- [ ] 에러 없이 응답

### Task 4.2: 성능 모니터링
**우선순위**: 🟡 High
**예상 시간**: 10분

#### 모니터링 포인트:
- API 응답 시간 (목표: <500ms)
- 데이터베이스 연결 풀 상태
- 에러율 (목표: <1%)

#### 체크리스트:
- [ ] Vercel Analytics 확인
- [ ] Neon Dashboard 모니터링
- [ ] 에러 로그 확인

### Task 4.3: 폴백 메커니즘 테스트
**우선순위**: 🟢 Medium
**예상 시간**: 10분

#### 테스트 시나리오:
1. DATABASE_URL 임시 변경 (잘못된 값)
2. API 호출하여 폴백 확인
3. 원래 값으로 복구

#### 체크리스트:
- [ ] 폴백이 GitHub 데이터로 작동
- [ ] 에러 로깅 확인
- [ ] 복구 후 정상 작동

---

## 🔄 Phase 5: 후속 작업 및 최적화 (Optional)

### Task 5.1: 데이터 동기화 자동화
**우선순위**: 🟢 Medium
**예상 시간**: 30분

#### 작업 내용:
```bash
# Cron job 설정 (vercel.json)
"crons": [
  {
    "path": "/api/cron/sync-models",
    "schedule": "0 */6 * * *"  # 6시간마다
  }
]
```

### Task 5.2: 백업 전략 수립
**우선순위**: 🟢 Medium
**예상 시간**: 20분

#### 작업 내용:
- Neon 자동 백업 설정
- 데이터 내보내기 스크립트 작성
- 복구 절차 문서화

---

## 🚨 롤백 계획

### 즉시 롤백 절차:
```bash
# Vercel 환경변수에서
DATA_SOURCE = github  # database → github 변경

# 재배포
vercel --prod --force
```

### 롤백 트리거 조건:
- [ ] API 에러율 > 10%
- [ ] 응답 시간 > 2초
- [ ] 데이터 불일치 발견

---

## 📊 작업 요약

### 총 예상 소요 시간: 2시간 35분
- Phase 1: 30분 (Neon 설정)
- Phase 2: 45분 (마이그레이션)
- Phase 3: 30분 (Vercel 설정)
- Phase 4: 30분 (검증)
- Phase 5: 50분 (선택사항)

### 위험 요소:
1. **낮음**: 폴백 메커니즘 존재
2. **중간**: 초기 데이터 시딩 실패 가능성
3. **낮음**: Vercel 빌드 타임아웃

### 성공 지표:
- ✅ dataSource = "database"
- ✅ 모든 API 정상 작동
- ✅ 응답 시간 < 500ms
- ✅ 에러율 < 1%

---

## 📝 실행 명령어 모음

```bash
# 1. 로컬 테스트
DATABASE_URL="neon-url" npx prisma migrate deploy
DATABASE_URL="neon-url" npx prisma db seed
DATABASE_URL="neon-url" node test-neon-connection.js

# 2. Git 배포
git add .
git commit -m "feat: migrate to Neon PostgreSQL"
git push origin master

# 3. 검증
curl https://ai-server-information.vercel.app/api/v1/status | jq
```

---

**작성일**: 2025-09-07
**작성자**: Claude Code Assistant
**상태**: 실행 대기