# 📋 AI-GO 배포 체크리스트

새 컴퓨터에서 AI-GO를 Vercel에 배포하기 위한 단계별 체크리스트입니다.
각 단계를 완료하면 체크박스에 표시하세요.

## 🚀 빠른 시작 (예상 시간: 15-20분)

```bash
# 가장 빠른 방법:
node scripts/quick-deploy.js
```

---

## 📝 수동 배포 체크리스트

### 1️⃣ 사전 준비 (5분)

#### 필수 도구
- [ ] **Node.js v18 이상** 설치됨
  - 확인: `node --version`
  - 설치: https://nodejs.org

- [ ] **Git** 설치됨
  - 확인: `git --version`
  - 설치: https://git-scm.com

- [ ] **프로젝트 파일** 복사됨
  - AI-GO 프로젝트 폴더가 로컬에 있음

### 2️⃣ 필수 계정 생성 (10분)

#### 🔴 필수 (반드시 필요)
- [ ] **Vercel 계정**
  - 가입: https://vercel.com/signup
  - GitHub 연동 권장

- [ ] **Artificial Analysis 계정** ⭐
  - 가입: https://artificialanalysis.ai
  - API Key 발급 필수!
  - Dashboard → API Keys → Create New API Key
  - 형식: `aa_DabcfQIXPg...` (aa_로 시작)

- [ ] **데이터베이스** (하나만 선택)
  - [ ] Neon (추천): https://neon.tech
  - [ ] Supabase: https://supabase.com
  - [ ] PlanetScale: https://planetscale.com

#### 🟡 선택 (성능 향상)
- [ ] **Upstash Redis**
  - 가입: https://upstash.com
  - 무료 티어로 충분

### 3️⃣ 로컬 설정 (5분)

- [ ] **터미널에서 프로젝트 폴더로 이동**
  ```bash
  cd path/to/ai-go
  ```

- [ ] **의존성 설치**
  ```bash
  npm install
  ```

- [ ] **환경 변수 파일 생성**
  ```bash
  cp .env.example .env.local
  ```

- [ ] **.env.local 파일 편집**
  ```env
  # 필수 - AA API 키
  artificialanalysis_API_TOKEN="aa_여기에_실제_API_키_입력"

  # 필수 - 데이터베이스 URL
  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

  # 선택 - Redis (성능 향상)
  UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
  UPSTASH_REDIS_REST_TOKEN="your-token"
  ```

- [ ] **설정 검증 스크립트 실행**
  ```bash
  node scripts/setup-new-deployment.js
  ```
  모든 항목이 ✅ 표시되어야 함

### 4️⃣ Vercel 배포 (10분)

- [ ] **Vercel CLI 설치**
  ```bash
  npm install -g vercel
  ```

- [ ] **Vercel 로그인**
  ```bash
  vercel login
  ```

- [ ] **프로젝트 배포**
  ```bash
  vercel
  ```
  프롬프트 응답:
  - Set up and deploy? **Y**
  - Which scope? **본인 계정 선택**
  - Link to existing project? **N**
  - Project name? **ai-go** (또는 원하는 이름)
  - Directory? **./** (현재 디렉토리)
  - Override settings? **N**

### 5️⃣ 환경 변수 설정 (5분)

#### 방법 1: Vercel Dashboard (권장)
- [ ] https://vercel.com/dashboard 접속
- [ ] 프로젝트 선택
- [ ] Settings → Environment Variables
- [ ] 다음 변수들 추가:

| 변수명 | 값 | 환경 | 필수 |
|--------|-----|------|------|
| artificialanalysis_API_TOKEN | aa_... | Production | ✅ |
| DATABASE_URL | postgresql://... | Production | ✅ |
| NODE_ENV | production | Production | ✅ |
| NEXT_PUBLIC_APP_URL | https://[project].vercel.app | Production | ✅ |
| UPSTASH_REDIS_REST_URL | https://... | Production | ⭕ |
| UPSTASH_REDIS_REST_TOKEN | ... | Production | ⭕ |

#### 방법 2: CLI로 설정
```bash
vercel env add artificialanalysis_API_TOKEN production
# 프롬프트에 값 입력
```

### 6️⃣ 프로덕션 배포 (5분)

- [ ] **프로덕션 배포 실행**
  ```bash
  vercel --prod
  ```

- [ ] **배포 URL 확인**
  - 터미널에 표시된 URL 확인
  - 예: https://ai-go-xyz.vercel.app

### 7️⃣ 배포 후 검증 (3분)

- [ ] **웹사이트 접속 확인**
  - 배포된 URL 접속
  - 홈페이지 정상 표시

- [ ] **Models 페이지 확인**
  - /models 페이지 접속
  - 모델 데이터 표시 확인

- [ ] **API 상태 확인**
  ```bash
  curl https://[your-project].vercel.app/api/health
  ```

- [ ] **로그 확인** (문제 있을 때)
  ```bash
  vercel logs --follow
  ```

### 8️⃣ 최종 설정 (선택사항)

- [ ] **URL 환경 변수 업데이트**
  - Vercel이 제공한 실제 URL로 업데이트
  - NEXT_PUBLIC_APP_URL
  - NEXT_PUBLIC_API_URL
  - FRONTEND_URL

- [ ] **데이터 초기화** (필요시)
  ```bash
  vercel exec npm run sync:init
  ```

- [ ] **커스텀 도메인 연결** (선택)
  - Vercel Dashboard → Domains

---

## ❗ 일반적인 문제 해결

### 빌드 실패
```bash
# 로컬에서 테스트
npm run build

# Prisma 관련 오류시
npx prisma generate
```

### 데이터베이스 연결 실패
- DATABASE_URL 형식 확인
- `sslmode=require` 포함 확인
- 데이터베이스 서비스 활성화 확인

### 모델 데이터가 표시되지 않음
- artificialanalysis_API_TOKEN 확인
- API 키가 `aa_`로 시작하는지 확인
- Vercel 환경 변수에 설정되었는지 확인

### 500 에러
```bash
# 실시간 로그 확인
vercel logs --follow

# 환경 변수 목록 확인
vercel env ls
```

---

## 📞 지원

문제가 지속되면:
1. `docs/DEPLOYMENT_GUIDE.md` 상세 가이드 참조
2. `scripts/setup-new-deployment.js` 실행하여 설정 검증
3. `.env.example` 파일과 환경 변수 비교

---

## ✅ 완료!

모든 단계를 완료했다면 AI-GO가 성공적으로 배포되었습니다! 🎉

배포된 URL: `https://[your-project].vercel.app`