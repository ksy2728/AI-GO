# 🚀 AI-GO 완전 배포 가이드

이 가이드는 AI-GO 프로젝트를 새로운 컴퓨터에서 새로운 Vercel 프로젝트로 배포하는 완전한 절차를 설명합니다.

## 📋 목차

1. [사전 준비사항](#-사전-준비사항)
2. [프로젝트 복사 및 설정](#-프로젝트-복사-및-설정)
3. [외부 서비스 설정](#-외부-서비스-설정)
4. [Vercel 배포](#-vercel-배포)
5. [환경 변수 설정](#-환경-변수-설정)
6. [배포 후 검증](#-배포-후-검증)
7. [문제 해결](#-문제-해결)

## 📌 사전 준비사항

### 필수 도구 설치
- Node.js v18 이상
- npm 또는 yarn
- Git
- Vercel CLI (`npm i -g vercel`)
- Claude Code (선택사항)

### 필수 계정
- GitHub 계정
- Vercel 계정 (GitHub와 연동)
- **[Artificial Analysis](https://artificialanalysis.ai) 계정** - AI 모델 데이터 API (필수!)
- 데이터베이스 서비스 계정 (선택 1개):
  - [Neon](https://neon.tech) (PostgreSQL) - 추천
  - [PlanetScale](https://planetscale.com) (MySQL)
  - [Supabase](https://supabase.com) (PostgreSQL)

### 선택 계정 (기능에 따라 필요)
- [Upstash Redis](https://upstash.com) - 캐싱용
- API 제공자 계정:
  - OpenAI
  - Anthropic
  - Google AI

## 📁 프로젝트 복사 및 설정

### 1단계: 프로젝트 복사

```bash
# 프로젝트 폴더를 새 컴퓨터로 복사
# USB, 클라우드 스토리지, 또는 네트워크 공유 사용

# 복사된 폴더로 이동
cd /path/to/ai-server-information

# 의존성 설치
npm install
```

### 2단계: 환경 변수 준비

```bash
# 환경 변수 예제 파일 복사
cp .env.example .env.local
cp .env.production.example .env.production.local

# 설정 검증 스크립트 실행
node scripts/setup-new-deployment.js
```

## 🔧 외부 서비스 설정

### 데이터베이스 설정 (Neon 추천)

#### Neon 설정 방법:

1. [Neon Console](https://console.neon.tech) 접속
2. 새 프로젝트 생성
3. 연결 문자열 복사:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

4. Prisma 스키마 적용:
   ```bash
   # 데이터베이스 URL을 .env.local에 설정 후
   npx prisma db push
   npx prisma db seed  # 초기 데이터 생성
   ```

#### PlanetScale 설정 방법:

1. [PlanetScale Console](https://app.planetscale.com) 접속
2. 새 데이터베이스 생성
3. 연결 문자열 생성:
   ```
   mysql://[user]:[password]@[host]/[database]?ssl={"rejectUnauthorized":true}
   ```

### Redis 설정 (선택사항)

#### Upstash Redis 설정:

1. [Upstash Console](https://console.upstash.com) 접속
2. 새 Redis 데이터베이스 생성
3. REST URL과 Token 복사:
   ```
   UPSTASH_REDIS_REST_URL=https://[id].upstash.io
   UPSTASH_REDIS_REST_TOKEN=[token]
   ```

### API 키 획득

#### 🔴 Artificial Analysis API (필수):
1. [Artificial Analysis](https://artificialanalysis.ai) 접속
2. 계정 생성 및 로그인
3. Dashboard > API Keys 섹션으로 이동
4. "Create New API Key" 클릭
5. `artificialanalysis_API_TOKEN=aa_...` 형식으로 저장
6. **중요**: 이 키가 없으면 모델 데이터를 가져올 수 없습니다!

#### OpenAI API (선택):

#### Anthropic API:
1. [Anthropic Console](https://console.anthropic.com) 접속
2. API Keys에서 새 키 생성
3. `ANTHROPIC_API_KEY=sk-ant-...` 형식으로 저장

#### Google AI API:
1. [Google AI Studio](https://makersuite.google.com) 접속
2. API Key 생성
3. `GOOGLE_AI_API_KEY=...` 형식으로 저장

## 🚀 Vercel 배포

### 방법 1: Claude Code 사용 (추천)

Claude Code에서 다음 명령 실행:
```
vercel로 새 프로젝트 배포해줘
```

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI로 배포
vercel

# 프롬프트 응답:
# - Set up and deploy: Y
# - Which scope: 본인 계정 선택
# - Link to existing project: N
# - Project name: ai-go (또는 원하는 이름)
# - Directory: ./
# - Override settings: N

# 프로덕션 배포
vercel --prod
```

### 방법 3: GitHub 연동

1. GitHub에 새 레포지토리 생성
2. 프로젝트 푸시:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/ai-go.git
   git push -u origin main
   ```
3. [Vercel Dashboard](https://vercel.com/new)에서 Import
4. GitHub 레포지토리 선택하여 자동 배포

## 🔐 환경 변수 설정

### Vercel Dashboard에서 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → Settings → Environment Variables
3. 다음 변수들을 추가:

#### 필수 환경 변수

```bash
# Artificial Analysis API (필수!)
artificialanalysis_API_TOKEN="aa_..."  # AA Dashboard에서 발급받은 API 키

# 데이터베이스 (Neon PostgreSQL 예시)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# 프로덕션 URL (배포 후 Vercel이 제공하는 URL로 변경)
NEXT_PUBLIC_API_URL="https://your-project.vercel.app"
FRONTEND_URL="https://your-project.vercel.app"

# 기본 설정
NODE_ENV="production"
```

#### 선택 환경 변수 (기능별)

```bash
# Redis 캐싱 (성능 향상)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# AI API 키 (모델 정보 동기화)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# Artificial Analysis 동기화
AA_ENABLE_PERFORMANCE_FILTER="true"
# AA_MIN_INTELLIGENCE="40"  # 선택사항

# 기능 플래그
ENABLE_NEWS_SECTION="true"
ENABLE_BENCHMARKS="true"
ENABLE_ANALYTICS="true"
```

### Vercel CLI로 일괄 설정

```bash
# vercel-env-setup.json 파일 사용
vercel env add DATABASE_URL production < vercel-env-setup.json

# 또는 개별 설정
vercel env add DATABASE_URL production
# 프롬프트에 값 입력
```

## ✅ 배포 후 검증

### 1. 기본 동작 확인

```bash
# 배포된 URL 접속
open https://your-project.vercel.app

# API 상태 확인
curl https://your-project.vercel.app/api/health
```

### 2. 데이터베이스 연결 확인

```bash
# Vercel Functions 로그 확인
vercel logs --follow

# 데이터베이스 마이그레이션 확인
vercel env pull .env.production.local
npx prisma migrate status
```

### 3. 기능 테스트

- [ ] 홈페이지 로딩
- [ ] Models 페이지 데이터 표시
- [ ] API 엔드포인트 응답
- [ ] 실시간 업데이트 (WebSocket)
- [ ] 검색 및 필터링

## 🔧 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# Prisma 관련 오류시
npx prisma generate
```

#### 2. 데이터베이스 연결 실패
- DATABASE_URL 형식 확인
- SSL 설정 확인 (`sslmode=require`)
- IP 화이트리스트 확인 (일부 DB 서비스)

#### 3. 500 에러
- 환경 변수 누락 확인
- Vercel Functions 로그 확인:
  ```bash
  vercel logs --follow
  ```

#### 4. 데이터가 표시되지 않음
```bash
# 초기 데이터 생성
npx prisma db seed

# API 동기화 실행
curl -X POST https://your-project.vercel.app/api/v1/sync/openai
```

### 디버깅 명령어

```bash
# 환경 변수 확인
vercel env ls

# 배포 상태 확인
vercel inspect [deployment-url]

# 로그 스트리밍
vercel logs --follow

# 재배포
vercel --prod --force
```

## 📝 체크리스트

배포 전:
- [ ] 프로젝트 파일 완전히 복사됨
- [ ] Node.js v18+ 설치됨
- [ ] npm 의존성 설치 완료
- [ ] 데이터베이스 생성됨
- [ ] 환경 변수 준비됨

배포 중:
- [ ] Vercel 프로젝트 생성됨
- [ ] 빌드 성공
- [ ] 환경 변수 설정됨
- [ ] 데이터베이스 연결됨

배포 후:
- [ ] 웹사이트 접속 가능
- [ ] API 응답 정상
- [ ] 데이터 표시됨
- [ ] 기능 정상 작동

## 🆘 지원

문제가 발생하면:
1. 이 가이드의 문제 해결 섹션 확인
2. Vercel 로그 확인
3. `.env.example` 파일과 환경 변수 비교
4. `scripts/setup-new-deployment.js` 실행하여 설정 검증

## 🎉 완료!

축하합니다! AI-GO가 성공적으로 배포되었습니다.

배포된 URL: `https://[your-project].vercel.app`

### 다음 단계:
1. 커스텀 도메인 연결 (선택사항)
2. 모니터링 설정 (Vercel Analytics)
3. API 동기화 스케줄 설정
4. 성능 최적화