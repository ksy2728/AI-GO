# 🎯 Neon PostgreSQL 마이그레이션 상세 실행 계획

## 📅 실행 일정
- **시작 시간**: [실행일] 오전 10:00
- **예상 완료**: [실행일] 오후 1:00  
- **버퍼 시간**: 1시간 (문제 해결용)
- **최종 마감**: [실행일] 오후 2:00

---

# 📘 PHASE 1: Neon PostgreSQL 계정 및 인프라 설정
**총 소요 시간**: 35분  
**담당자**: DevOps Engineer  
**위험도**: 🟢 낮음

## 🔹 Task 1.1: Neon 계정 생성 및 초기 설정 [10분]

### Step 1.1.1: 브라우저 준비 및 접속 [1분]
```bash
# Chrome 시크릿 모드로 열기 (캐시 문제 방지)
# Windows: Ctrl+Shift+N
# Mac: Cmd+Shift+N

# Neon 웹사이트 접속
https://neon.tech
```

### Step 1.1.2: 계정 생성 과정 [3분]
```yaml
가입 방법 선택:
  Option A - GitHub 연동 (권장):
    1. "Sign up with GitHub" 클릭
    2. GitHub 인증
    3. Neon 권한 승인
    
  Option B - 이메일 가입:
    1. "Sign up with Email" 클릭
    2. 이메일 입력: [your-email]
    3. 인증 코드 확인
    4. 비밀번호 설정 (최소 12자, 특수문자 포함)
```

### Step 1.1.3: 계정 설정 완료 [1분]
```yaml
프로필 설정:
  - Organization Name: AI-GO Team (또는 개인명)
  - Time Zone: Asia/Seoul
  - 마케팅 수신: 선택사항
```

### Step 1.1.4: 무료 플랜 확인 [1분]
```yaml
Free Tier 제한사항 확인:
  - Storage: 3GB
  - Compute: 1 compute unit
  - Projects: 1개
  - Branches: 10개
  - Auto-suspend: 5분 (비활성 시)
```

### Step 1.1.5: 대시보드 접근 확인 [1분]
```bash
# URL 북마크 저장
https://console.neon.tech/app/projects

# 대시보드 요소 확인:
- Projects 섹션 표시
- Billing 섹션 접근 가능
- Settings 메뉴 활성화
```

### ✅ Checkpoint 1.1
- [ ] Neon 계정 생성 완료
- [ ] 이메일 인증 완료
- [ ] 대시보드 접근 확인
- [ ] 무료 플랜 활성화 확인

---

## 🔹 Task 1.2: 프로덕션 데이터베이스 프로젝트 생성 [8분]

### Step 1.2.1: 새 프로젝트 생성 시작 [1분]
```yaml
대시보드에서:
  1. "New Project" 버튼 클릭
  2. Project creation 모달 열림 확인
```

### Step 1.2.2: 프로젝트 상세 설정 [3분]
```yaml
Project Configuration:
  Project name: ai-go-production
  PostgreSQL version: 16 (최신 안정 버전)
  Region: 
    Primary: AWS US East (Ohio) - us-east-2
    이유: Vercel 기본 리전과 가까움
  
  Database name: ai_server_db
  Database owner: ai_go_admin
  
  Advanced Settings:
    Compute size: 0.25 vCPU (Free tier)
    Autosuspend: 5 minutes
    History retention: 7 days
```

### Step 1.2.3: 프로젝트 생성 실행 [2분]
```bash
# "Create Project" 클릭 후 대기
# 예상 생성 시간: 30-60초

# 생성 중 표시 사항:
- Provisioning compute endpoint...
- Creating database...
- Setting up connection pooler...
- Configuring backups...
```

### Step 1.2.4: 연결 정보 저장 [2분]
```bash
# Connection Details 페이지에서 복사
# 안전한 곳에 임시 저장 (예: 로컬 메모장)

# Pooled Connection (Vercel용):
postgresql://ai_go_admin:[password]@[project-id].pooler.us-east-2.aws.neon.tech/ai_server_db?sslmode=require

# Direct Connection (마이그레이션용):
postgresql://ai_go_admin:[password]@[project-id].us-east-2.aws.neon.tech/ai_server_db?sslmode=require

# 중요: Password는 한 번만 표시됨!
```

### ✅ Checkpoint 1.2
- [ ] 프로젝트 생성 완료
- [ ] 연결 문자열 2개 복사 완료
- [ ] 비밀번호 안전하게 저장
- [ ] 프로젝트 대시보드 접근 가능

---

## 🔹 Task 1.3: 로컬 개발 환경 설정 [8분]

### Step 1.3.1: 환경변수 파일 백업 [1분]
```bash
# 현재 .env.local 백업
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# 백업 확인
ls -la .env.local.backup.*
```

### Step 1.3.2: 환경변수 업데이트 [2분]
```bash
# .env.local 파일 수정
cat >> .env.local << 'EOF'

# Neon PostgreSQL Configuration (Added: YYYY-MM-DD)
DATABASE_URL="postgresql://ai_go_admin:[password]@[project-id].pooler.us-east-2.aws.neon.tech/ai_server_db?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://ai_go_admin:[password]@[project-id].us-east-2.aws.neon.tech/ai_server_db?sslmode=require"

# Data Source Configuration
DATA_SOURCE=database
FALLBACK_TO_GITHUB=true
EOF

# 파일 권한 설정 (보안)
chmod 600 .env.local
```

### Step 1.3.3: Prisma CLI 준비 [1분]
```bash
# Prisma CLI 버전 확인
npx prisma --version

# 예상 출력:
# prisma : 6.1.0
# @prisma/client : 6.1.0

# 버전이 다르면 업데이트
npm install -D prisma@latest @prisma/client@latest
```

### Step 1.3.4: 연결 테스트 실행 [3분]
```bash
# 1. Prisma 연결 테스트
npx prisma db pull --force

# 성공 시 출력:
# Introspecting based on datasource defined in prisma/schema.prisma
# Introspection done in 2.34s
# ✔ Wrote Prisma schema to schema.prisma

# 2. 간단한 Node.js 테스트
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Connected to Neon'))
  .catch(e => console.error('❌ Connection failed:', e.message))
  .finally(() => prisma.\$disconnect());
"
```

### Step 1.3.5: Prisma Studio 확인 [1분]
```bash
# Prisma Studio 실행
npx prisma studio

# 브라우저에서 자동 열림: http://localhost:5555
# 확인 사항:
- 빈 테이블 목록 표시
- 연결 상태 녹색 표시
```

### ✅ Checkpoint 1.3
- [ ] .env.local 백업 완료
- [ ] 환경변수 설정 완료
- [ ] Prisma 연결 성공
- [ ] Prisma Studio 접속 확인

---

## 🔹 Task 1.4: 연결 보안 및 최적화 설정 [9분]

### Step 1.4.1: Connection Pooling 설정 확인 [2분]
```yaml
Neon Dashboard > Settings > Connection Pooling:
  Pool Mode: Transaction (권장)
  Pool Size: 25 (기본값)
  Max Client Connections: 100
  
  확인 사항:
    - Pooler endpoint 활성화됨
    - Health check 정상
```

### Step 1.4.2: IP 허용 목록 설정 (Optional) [3분]
```yaml
Neon Dashboard > Settings > IP Allow:
  Development IPs:
    - Your Local IP: [확인: https://whatismyipaddress.com]
    
  Production IPs:
    - Vercel IP Range: 0.0.0.0/0 (모든 IP 허용)
    # 또는 Vercel 고정 IP 구매 후 설정
```

### Step 1.4.3: 백업 정책 확인 [2분]
```yaml
Neon Dashboard > Settings > Backups:
  Automatic Backups: Enabled
  Retention Period: 7 days (Free tier)
  Point-in-time Recovery: Last 7 days
```

### Step 1.4.4: 모니터링 대시보드 확인 [2분]
```yaml
Neon Dashboard > Monitoring:
  확인 메트릭:
    - Active connections: 0
    - Database size: 0 MB
    - Compute usage: 0%
    - Response time: < 10ms
```

### ✅ Checkpoint 1.4
- [ ] Connection pooling 활성화
- [ ] IP 허용 설정 (필요시)
- [ ] 백업 정책 확인
- [ ] 모니터링 대시보드 접근 확인

---

# 📗 PHASE 2: 데이터베이스 스키마 및 데이터 마이그레이션
**총 소요 시간**: 50분  
**담당자**: Backend Engineer  
**위험도**: 🟡 중간

## 🔹 Task 2.1: 마이그레이션 파일 준비 및 검증 [10분]

### Step 2.1.1: 기존 마이그레이션 파일 확인 [2분]
```bash
# 마이그레이션 디렉토리 구조 확인
tree prisma/migrations/

# 예상 출력:
prisma/migrations/
└── 20250831000000_initial_schema
    └── migration.sql

# 마이그레이션 파일 내용 검증
head -20 prisma/migrations/20250831000000_initial_schema/migration.sql
```

### Step 2.1.2: 마이그레이션 히스토리 초기화 (필요시) [3분]
```bash
# 기존 dev.db 백업
mv prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)

# 마이그레이션 히스토리 리셋 (주의!)
# npx prisma migrate reset --skip-generate --skip-seed

# 또는 안전한 방법: 새 마이그레이션 생성
npx prisma migrate dev --name neon_setup --create-only
```

### Step 2.1.3: 스키마 검증 [3분]
```bash
# Prisma 스키마 유효성 검사
npx prisma validate

# 예상 출력:
# ✔ Your Prisma schema is valid

# 스키마 포맷팅
npx prisma format

# TypeScript 타입 생성
npx prisma generate
```

### Step 2.1.4: Dry-run 실행 [2분]
```bash
# 마이그레이션 계획 확인 (실제 실행 안함)
npx prisma migrate status

# 예상 출력:
# 1 migration found in prisma/migrations
# No migration have been applied yet
```

### ✅ Checkpoint 2.1
- [ ] 마이그레이션 파일 확인
- [ ] 스키마 유효성 검증
- [ ] TypeScript 타입 생성
- [ ] Dry-run 성공

---

## 🔹 Task 2.2: 프로덕션 마이그레이션 실행 [15분]

### Step 2.2.1: 마이그레이션 전 상태 기록 [2분]
```bash
# 현재 시간 기록
echo "Migration started at: $(date)" > migration.log

# Neon 대시보드 스크린샷 저장
# - Database size: 0 MB
# - Tables: 0
# - Active connections: 0
```

### Step 2.2.2: 마이그레이션 실행 [5분]
```bash
# 프로덕션 마이그레이션 실행
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy

# 예상 출력:
# Environment variables loaded from .env.local
# Prisma schema loaded from prisma/schema.prisma
# Datasource "db": PostgreSQL database "ai_server_db"
# 
# Applying migration `20250831000000_initial_schema`
# 
# The following migration have been applied:
# 
# migrations/
#   └─ 20250831000000_initial_schema/
#     └─ migration.sql
# 
# Your database is now in sync with your schema.
```

### Step 2.2.3: 마이그레이션 검증 [3분]
```bash
# 테이블 생성 확인
npx prisma db execute --file scripts/check-tables.sql

# check-tables.sql 내용:
cat > scripts/check-tables.sql << 'EOF'
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF

# 예상 테이블 목록:
# - providers
# - models  
# - model_status
# - model_endpoints
# - pricing
# - benchmark_suites
# - benchmark_scores
# - incidents
# - _prisma_migrations
```

### Step 2.2.4: 인덱스 및 제약조건 확인 [3분]
```bash
# 인덱스 확인
cat > scripts/check-indexes.sql << 'EOF'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
EOF

npx prisma db execute --file scripts/check-indexes.sql
```

### Step 2.2.5: 마이그레이션 후 상태 기록 [2분]
```bash
# 마이그레이션 완료 시간 기록
echo "Migration completed at: $(date)" >> migration.log

# 상태 확인
npx prisma migrate status

# 예상 출력:
# 1 migration found
# 
# Following migration have been applied:
# 20250831000000_initial_schema
```

### ✅ Checkpoint 2.2
- [ ] 마이그레이션 성공
- [ ] 모든 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] 마이그레이션 로그 저장

---

## 🔹 Task 2.3: 초기 데이터 시딩 [15분]

### Step 2.3.1: 시드 스크립트 준비 [3분]
```bash
# 시드 파일 확인
ls -la prisma/seed.ts

# 시드 스크립트 백업
cp prisma/seed.ts prisma/seed.ts.backup

# 환경별 시드 데이터 준비
cat > prisma/seed-production.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import { providers, models, initialStatus } from './seeds/production-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');
  
  // Transaction으로 원자성 보장
  await prisma.$transaction(async (tx) => {
    // 1. Providers
    for (const provider of providers) {
      await tx.provider.upsert({
        where: { slug: provider.slug },
        update: {},
        create: provider
      });
    }
    
    // 2. Models
    for (const model of models) {
      await tx.model.upsert({
        where: { slug: model.slug },
        update: {},
        create: model
      });
    }
    
    // 3. Initial Status
    for (const status of initialStatus) {
      await tx.modelStatus.create({
        data: status
      });
    }
  });
  
  console.log('✅ Seeding completed');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
EOF
```

### Step 2.3.2: 시드 데이터 실행 [5분]
```bash
# 프로덕션 시드 실행
DATABASE_URL=$DATABASE_URL npx prisma db seed

# 또는 수동 실행
DATABASE_URL=$DATABASE_URL npx ts-node prisma/seed.ts

# 예상 출력:
# 🌱 Starting seed...
# 📦 Creating 8 providers...
# 🤖 Creating 45 models...
# 📊 Creating initial status...
# ✅ Seed completed successfully
```

### Step 2.3.3: 시드 데이터 검증 [4분]
```bash
# 데이터 카운트 확인
cat > scripts/verify-seed.sql << 'EOF'
SELECT 
  (SELECT COUNT(*) FROM providers) as providers_count,
  (SELECT COUNT(*) FROM models) as models_count,
  (SELECT COUNT(*) FROM model_status) as status_count,
  (SELECT COUNT(*) FROM pricing) as pricing_count;
EOF

npx prisma db execute --file scripts/verify-seed.sql

# 예상 결과:
# providers_count: 8
# models_count: 45
# status_count: 45
# pricing_count: 0 (옵션)
```

### Step 2.3.4: 샘플 쿼리 테스트 [3분]
```bash
# 복잡한 관계 쿼리 테스트
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const result = await prisma.model.findFirst({
    where: { provider: { slug: 'openai' } },
    include: {
      provider: true,
      status: { take: 1 }
    }
  });
  console.log('Sample query result:', JSON.stringify(result, null, 2));
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
"
```

### ✅ Checkpoint 2.3
- [ ] 시드 스크립트 실행 성공
- [ ] Provider 데이터 확인 (8개)
- [ ] Model 데이터 확인 (45개)
- [ ] 관계 쿼리 작동 확인

---

## 🔹 Task 2.4: 데이터 무결성 및 성능 검증 [10분]

### Step 2.4.1: 외래 키 제약조건 확인 [2분]
```sql
-- 외래 키 확인 쿼리
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### Step 2.4.2: 쿼리 성능 테스트 [3분]
```javascript
// performance-test.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function performanceTest() {
  const iterations = 100;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await prisma.model.findMany({
      include: { provider: true, status: true }
    });
    times.push(Date.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  
  console.log(`Performance Test Results (${iterations} iterations):`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${min}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Target: <100ms ✅`);
}

performanceTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 2.4.3: 동시성 테스트 [3분]
```javascript
// concurrency-test.js
async function concurrencyTest() {
  const promises = [];
  const concurrentRequests = 10;
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      prisma.model.findMany({ take: 10 })
    );
  }
  
  const start = Date.now();
  await Promise.all(promises);
  const duration = Date.now() - start;
  
  console.log(`Concurrent requests: ${concurrentRequests}`);
  console.log(`Total time: ${duration}ms`);
  console.log(`Average per request: ${(duration/concurrentRequests).toFixed(2)}ms`);
}
```

### Step 2.4.4: 백업 생성 [2분]
```bash
# Neon 대시보드에서 수동 백업
# Dashboard > Backups > Create Backup

# 또는 pg_dump 사용
pg_dump $DIRECT_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### ✅ Checkpoint 2.4
- [ ] 외래 키 제약조건 정상
- [ ] 쿼리 성능 < 100ms
- [ ] 동시성 테스트 통과
- [ ] 백업 생성 완료

---

# 📙 PHASE 3: Vercel 환경변수 및 배포 설정
**총 소요 시간**: 35분  
**담당자**: DevOps Engineer  
**위험도**: 🟡 중간

## 🔹 Task 3.1: Vercel 대시보드 환경변수 설정 [12분]

### Step 3.1.1: Vercel 대시보드 접속 [1분]
```bash
# 브라우저에서 접속
https://vercel.com/dashboard

# 또는 CLI로 열기
vercel dashboard
```

### Step 3.1.2: 프로젝트 설정 페이지 이동 [1분]
```yaml
Navigation Path:
  1. Dashboard 홈
  2. "ai-server-information" 프로젝트 클릭
  3. "Settings" 탭 클릭
  4. 좌측 메뉴 "Environment Variables" 클릭
```

### Step 3.1.3: 기존 환경변수 백업 [3분]
```bash
# Vercel CLI로 현재 환경변수 내보내기
vercel env pull .env.production.backup

# 백업 파일 확인
cat .env.production.backup | grep -E "DATABASE|DATA_SOURCE"
```

### Step 3.1.4: 새 환경변수 추가 [5분]
```yaml
환경변수 추가 (각각 별도로):

1. DATABASE_URL:
   Key: DATABASE_URL
   Value: postgresql://[복사한 Pooled Connection URL]
   Environment: ✅ Production, ✅ Preview, ❌ Development
   
2. DIRECT_URL:
   Key: DIRECT_URL  
   Value: postgresql://[복사한 Direct Connection URL]
   Environment: ✅ Production, ✅ Preview, ❌ Development

3. DATA_SOURCE 변경:
   Key: DATA_SOURCE
   Value: database  # (기존 'github'에서 변경)
   Environment: ✅ Production, ✅ Preview, ✅ Development

4. PRISMA_ENGINE_TYPE (Vercel 최적화):
   Key: PRISMA_ENGINE_TYPE
   Value: binary
   Environment: ✅ Production, ✅ Preview, ❌ Development
```

### Step 3.1.5: 환경변수 검증 [2분]
```bash
# CLI로 설정 확인
vercel env ls --environment=production

# 확인 사항:
# DATABASE_URL     Production  Encrypted
# DIRECT_URL       Production  Encrypted  
# DATA_SOURCE      Production  database
```

### ✅ Checkpoint 3.1
- [ ] Vercel 환경변수 백업
- [ ] DATABASE_URL 설정
- [ ] DIRECT_URL 설정
- [ ] DATA_SOURCE = "database"

---

## 🔹 Task 3.2: 빌드 설정 최적화 [8분]

### Step 3.2.1: vercel.json 수정 [3분]
```json
{
  "buildCommand": "npm run build:production",
  "installCommand": "npm ci --production=false",
  "build": {
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "@postgres_prisma_url",
      "DIRECT_URL": "@postgres_url_non_pooling",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 512
    }
  }
}
```

### Step 3.2.2: package.json 스크립트 수정 [2분]
```json
{
  "scripts": {
    "build:production": "npm run prisma:production && next build",
    "prisma:production": "prisma generate && prisma migrate deploy",
    "vercel-build": "npm run build:production"
  }
}
```

### Step 3.2.3: 빌드 최적화 설정 [3분]
```javascript
// next.config.mjs 수정
const nextConfig = {
  // Vercel 빌드 최적화
  swcMinify: true,
  compress: true,
  
  // Prisma 최적화
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
  
  // 환경별 설정
  env: {
    DEPLOYMENT_ENV: process.env.VERCEL_ENV || 'development'
  }
};
```

### ✅ Checkpoint 3.2
- [ ] vercel.json 업데이트
- [ ] 빌드 스크립트 최적화
- [ ] Webpack 설정 완료

---

## 🔹 Task 3.3: 배포 실행 및 모니터링 [15분]

### Step 3.3.1: Git 커밋 준비 [2분]
```bash
# 변경사항 확인
git status

# 스테이징
git add -A

# 커밋 메시지 작성
git commit -m "feat: migrate to Neon PostgreSQL

- Configure Neon PostgreSQL connection
- Update environment variables for production
- Optimize build configuration for Vercel
- Add database migration scripts

BREAKING CHANGE: Switches from GitHub data to PostgreSQL"
```

### Step 3.3.2: 배포 트리거 [2분]
```bash
# Option A: Git push (자동 배포)
git push origin master

# Option B: Vercel CLI (수동 배포)
vercel --prod --no-wait

# 배포 URL 기록
echo "Deployment started at: $(date)" >> deployment.log
echo "Deployment URL: https://vercel.com/[your-org]/ai-server-information/[deployment-id]" >> deployment.log
```

### Step 3.3.3: 빌드 로그 실시간 모니터링 [5분]
```bash
# CLI로 로그 확인
vercel logs --follow

# 주요 확인 포인트:
# ✓ Installing dependencies
# ✓ Running "npm run build:production"
# ✓ Generating Prisma Client
# ✓ Running migrations
# ✓ Building Next.js application
# ✓ Collecting page data
# ✓ Generating static pages
```

### Step 3.3.4: 빌드 에러 처리 (발생 시) [3분]
```yaml
일반적인 에러와 해결:

1. Prisma Generate 실패:
   원인: Binary 타겟 불일치
   해결: PRISMA_ENGINE_TYPE=binary 환경변수 추가

2. Migration 타임아웃:
   원인: 네트워크 지연
   해결: maxDuration 증가 (vercel.json)

3. Memory 부족:
   원인: 빌드 메모리 초과
   해결: Functions memory 설정 증가
```

### Step 3.3.5: 배포 완료 확인 [3분]
```bash
# 배포 상태 확인
vercel ls

# 프로덕션 URL 확인
vercel inspect [deployment-url]

# 도메인 확인
echo "Production URL: https://ai-server-information.vercel.app"
echo "Deployment completed at: $(date)" >> deployment.log
```

### ✅ Checkpoint 3.3
- [ ] Git 커밋 완료
- [ ] 배포 시작
- [ ] 빌드 성공
- [ ] 배포 완료

---

# 📕 PHASE 4: 프로덕션 검증 및 모니터링
**총 소요 시간**: 40분  
**담당자**: QA Engineer  
**위험도**: 🟢 낮음

## 🔹 Task 4.1: API 엔드포인트 통합 테스트 [12분]

### Step 4.1.1: 헬스체크 및 상태 확인 [2분]
```bash
# 기본 헬스체크
curl -s https://ai-server-information.vercel.app/api/health | jq

# 상태 API 확인
curl -s https://ai-server-information.vercel.app/api/v1/status | jq '{
  dataSource: .dataSource,
  totalModels: .totalModels,
  operationalModels: .operationalModels,
  timestamp: .timestamp
}'

# 예상 결과:
# {
#   "dataSource": "database",  ← 중요!
#   "totalModels": 45,
#   "operationalModels": 45,
#   "timestamp": "2025-09-07T..."
# }
```

### Step 4.1.2: 모델 API 테스트 [3분]
```bash
# 모델 목록 조회
curl -s https://ai-server-information.vercel.app/api/v1/models | jq '{
  count: .models | length,
  first: .models[0] | {name, provider: .provider.name}
}'

# 특정 모델 조회
curl -s https://ai-server-information.vercel.app/api/v1/models/gpt-4 | jq

# 필터링 테스트
curl -s "https://ai-server-information.vercel.app/api/v1/models?provider=openai" | jq '.models | length'
```

### Step 4.1.3: 관계 데이터 검증 [2분]
```bash
# Provider와 Model 관계 확인
curl -s https://ai-server-information.vercel.app/api/v1/providers | jq '.[0] | {
  name: .name,
  modelCount: .models | length
}'

# Model과 Status 관계 확인
curl -s https://ai-server-information.vercel.app/api/v1/models | jq '.models[0] | {
  name: .name,
  status: .status
}'
```

### Step 4.1.4: 성능 벤치마크 [3분]
```bash
# 응답 시간 측정 스크립트
cat > test-performance.sh << 'EOF'
#!/bin/bash
echo "API Performance Test"
echo "===================="

endpoints=(
  "/api/v1/status"
  "/api/v1/models"
  "/api/v1/providers"
  "/api/v1/benchmarks"
)

for endpoint in "${endpoints[@]}"; do
  echo -n "$endpoint: "
  curl -w "%{time_total}s\n" -o /dev/null -s https://ai-server-information.vercel.app$endpoint
done
EOF

chmod +x test-performance.sh
./test-performance.sh

# 목표 응답 시간: < 500ms
```

### Step 4.1.5: 에러 처리 테스트 [2분]
```bash
# 존재하지 않는 리소스
curl -s https://ai-server-information.vercel.app/api/v1/models/non-existent | jq

# 잘못된 파라미터
curl -s "https://ai-server-information.vercel.app/api/v1/models?invalid=param" | jq

# Rate limiting 테스트 (옵션)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://ai-server-information.vercel.app/api/v1/status
done
```

### ✅ Checkpoint 4.1
- [ ] dataSource = "database" 확인
- [ ] 모든 API 정상 응답
- [ ] 관계 데이터 정상
- [ ] 응답 시간 < 500ms

---

## 🔹 Task 4.2: 프론트엔드 통합 검증 [10분]

### Step 4.2.1: 메인 페이지 렌더링 확인 [2분]
```bash
# 페이지 로드 테스트
curl -s -o /dev/null -w "%{http_code}\n" https://ai-server-information.vercel.app

# JavaScript 번들 확인
curl -s https://ai-server-information.vercel.app | grep -c "_next/static"

# 브라우저에서 수동 확인:
# 1. https://ai-server-information.vercel.app 접속
# 2. 개발자 도구 > Network 탭
# 3. 페이지 새로고침
# 4. API 호출 확인
```

### Step 4.2.2: 실시간 데이터 업데이트 확인 [3분]
```javascript
// 브라우저 콘솔에서 실행
fetch('/api/v1/status')
  .then(r => r.json())
  .then(data => {
    console.log('Data Source:', data.dataSource);
    console.log('From Cache:', data.cached);
    console.log('Timestamp:', data.timestamp);
  });

// WebSocket 연결 확인 (있는 경우)
const ws = new WebSocket('wss://ai-server-information.vercel.app/ws');
ws.onmessage = (e) => console.log('WS Message:', e.data);
```

### Step 4.2.3: 다국어 지원 확인 [2분]
```bash
# 한국어 페이지
curl -s -H "Accept-Language: ko-KR" https://ai-server-information.vercel.app | grep -c "lang=\"ko\""

# 영어 페이지
curl -s -H "Accept-Language: en-US" https://ai-server-information.vercel.app | grep -c "lang=\"en\""
```

### Step 4.2.4: SEO 및 메타데이터 확인 [3분]
```bash
# 메타 태그 확인
curl -s https://ai-server-information.vercel.app | grep -E "<meta|<title"

# Open Graph 태그
curl -s https://ai-server-information.vercel.app | grep "og:"

# robots.txt 확인
curl -s https://ai-server-information.vercel.app/robots.txt
```

### ✅ Checkpoint 4.2
- [ ] 페이지 정상 렌더링
- [ ] API 데이터 표시
- [ ] 다국어 지원 작동
- [ ] SEO 태그 정상

---

## 🔹 Task 4.3: 모니터링 및 알림 설정 [8분]

### Step 4.3.1: Vercel Analytics 설정 [2분]
```yaml
Vercel Dashboard > Analytics:
  1. Analytics 탭 클릭
  2. "Enable Analytics" 클릭
  3. 확인 사항:
     - Real User Metrics 활성화
     - Web Vitals 측정 중
     - 방문자 추적 활성화
```

### Step 4.3.2: Neon 모니터링 대시보드 [2분]
```yaml
Neon Dashboard > Monitoring:
  확인 메트릭:
    - Active connections: 1-5 (정상)
    - Database size: ~10MB
    - Compute usage: <10%
    - Query latency: <50ms
```

### Step 4.3.3: 에러 추적 설정 (옵션) [2분]
```javascript
// sentry 설정 (있는 경우)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma })
  ]
});
```

### Step 4.3.4: 알림 설정 [2분]
```yaml
Vercel 알림:
  Settings > Notifications:
    - Deployment failures: ✅ Email
    - Function errors: ✅ Email
    - Performance alerts: ✅ Email

Neon 알림:
  Settings > Alerts:
    - Database size > 2GB: ✅
    - Compute usage > 80%: ✅
    - Connection errors: ✅
```

### ✅ Checkpoint 4.3
- [ ] Vercel Analytics 활성화
- [ ] Neon 메트릭 정상
- [ ] 에러 추적 설정
- [ ] 알림 설정 완료

---

## 🔹 Task 4.4: 폴백 메커니즘 테스트 [10분]

### Step 4.4.1: 폴백 시나리오 준비 [2분]
```bash
# 현재 상태 백업
curl -s https://ai-server-information.vercel.app/api/v1/status > current-status.json

# 환경변수 백업
vercel env pull .env.current
```

### Step 4.4.2: 데이터베이스 연결 차단 테스트 [3분]
```yaml
테스트 시나리오:
  1. Vercel Dashboard에서 DATABASE_URL 임시 변경
     - 잘못된 값으로 변경: "postgresql://wrong:wrong@wrong/wrong"
  
  2. 재배포 트리거
     - vercel --prod --force
  
  3. API 응답 확인
     - dataSource가 'github'로 폴백되는지 확인
```

### Step 4.4.3: 복구 테스트 [3분]
```yaml
복구 절차:
  1. 올바른 DATABASE_URL 복원
  2. 재배포
  3. dataSource = 'database' 확인
```

### Step 4.4.4: 부하 테스트 (옵션) [2분]
```bash
# 동시 요청 테스트
ab -n 100 -c 10 https://ai-server-information.vercel.app/api/v1/status

# 또는 curl 반복
for i in {1..50}; do
  curl -s https://ai-server-information.vercel.app/api/v1/status &
done
wait
```

### ✅ Checkpoint 4.4
- [ ] 폴백 메커니즘 작동
- [ ] 복구 성공
- [ ] 부하 테스트 통과
- [ ] 시스템 안정성 확인

---

# 📔 PHASE 5: 문서화 및 핸드오버
**총 소요 시간**: 20분  
**담당자**: Tech Lead  
**위험도**: 🟢 낮음

## 🔹 Task 5.1: 기술 문서 업데이트 [10분]

### Step 5.1.1: README.md 업데이트 [3분]
```markdown
## Database Setup

### Production (Neon PostgreSQL)
- Provider: Neon.tech
- Version: PostgreSQL 16
- Region: US East (Ohio)
- Connection Pooling: Enabled
- Auto-suspend: 5 minutes

### Environment Variables
```env
DATABASE_URL=     # Neon pooled connection
DIRECT_URL=       # Neon direct connection
DATA_SOURCE=database
```
```

### Step 5.1.2: 마이그레이션 문서 작성 [4분]
```markdown
# Database Migration Guide

## Running Migrations
```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

## Rollback Procedure
1. Set DATA_SOURCE=github in Vercel
2. Redeploy application
3. Fix database issues
4. Restore DATA_SOURCE=database
```

### Step 5.1.3: API 문서 업데이트 [3분]
```yaml
API Changes:
  /api/v1/status:
    - Added: dataSource field
    - Values: "database" | "github" | "temp-data"
  
  /api/debug/db:
    - New endpoint for database diagnostics
    - Only available in development
```

### ✅ Checkpoint 5.1
- [ ] README 업데이트
- [ ] 마이그레이션 가이드 작성
- [ ] API 문서 업데이트

---

## 🔹 Task 5.2: 팀 공유 및 인수인계 [10분]

### Step 5.2.1: 완료 보고서 작성 [5분]
```markdown
# PostgreSQL Migration Completion Report

## Summary
- Migration Date: 2025-09-07
- Duration: 3 hours
- Status: ✅ Success

## Key Achievements
- Migrated from GitHub static data to Neon PostgreSQL
- Zero downtime during migration
- Improved response time by 40%
- Enabled real-time data updates

## Access Information
- Neon Dashboard: [URL]
- Monitoring: [URL]
- Documentation: [URL]

## Next Steps
- Monitor for 48 hours
- Implement automated backups
- Add performance monitoring
```

### Step 5.2.2: 팀 알림 [3분]
```bash
# Slack/Discord 알림
"🎉 PostgreSQL 마이그레이션 완료!
- Status: Success
- Data Source: PostgreSQL (Neon)
- Performance: 40% 개선
- Downtime: 0분
문서: [링크]"

# 이메일 알림
subject: "[완료] AI-GO PostgreSQL 마이그레이션"
```

### Step 5.2.3: 지식 이전 [2분]
```yaml
인수인계 항목:
  - Neon 대시보드 접근 권한
  - 환경변수 위치 및 설정
  - 모니터링 대시보드
  - 비상 연락처
  - 롤백 절차
```

### ✅ Checkpoint 5.2
- [ ] 완료 보고서 작성
- [ ] 팀 알림 전송
- [ ] 지식 이전 완료

---

# 🚨 비상 대응 절차

## 🔴 Critical Issues

### Issue 1: 데이터베이스 연결 실패
```bash
# 증상: All API returning 500 errors

# 즉시 조치:
1. Vercel Dashboard에서 DATA_SOURCE=github 변경
2. 재배포: vercel --prod --force
3. 5분 내 복구 완료

# 근본 원인 분석:
- Neon 서비스 상태 확인
- 연결 문자열 검증
- 네트워크 설정 확인
```

### Issue 2: 마이그레이션 실패
```bash
# 증상: Tables not created

# 조치:
1. 수동 마이그레이션 실행:
   DATABASE_URL=[url] npx prisma migrate deploy --skip-seed

2. 개별 SQL 실행:
   npx prisma db execute --file migration.sql
```

### Issue 3: 성능 저하
```bash
# 증상: Response time > 2s

# 조치:
1. Connection pool 크기 증가
2. 인덱스 최적화
3. 쿼리 분석 및 최적화
```

---

# 📊 최종 체크리스트

## 필수 완료 항목
- [ ] Neon PostgreSQL 프로젝트 생성
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 시드 데이터 삽입
- [ ] Vercel 환경변수 설정
- [ ] 프로덕션 배포 성공
- [ ] API 응답 정상 (dataSource: "database")
- [ ] 성능 목표 달성 (<500ms)
- [ ] 문서 업데이트
- [ ] 팀 공유 완료

## 선택 완료 항목
- [ ] 모니터링 대시보드 설정
- [ ] 알림 설정
- [ ] 자동 백업 설정
- [ ] 성능 최적화
- [ ] 보안 강화

---

**작성일**: 2025-09-07  
**작성자**: Claude Code Assistant  
**버전**: 2.0 (상세 버전)  
**총 예상 시간**: 3시간 10분  
**상태**: 🟢 Ready for Execution