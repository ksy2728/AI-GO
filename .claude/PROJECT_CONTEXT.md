# AI Server Information - 프로젝트 컨텍스트

## 🎯 프로젝트 개요
AI 모델 상태 모니터링 대시보드 시스템

## 🔧 기술 스택
- **Framework**: Next.js 15.0.4
- **Language**: TypeScript 5.7.3
- **Database**: PostgreSQL (마이그레이션 중, 기존 SQLite)
- **ORM**: Prisma 6.1.0
- **UI**: React 19, TailwindCSS, Recharts
- **Deployment**: Vercel

## 📂 주요 디렉토리 구조
```
ai-server-information/
├── prisma/
│   ├── schema.prisma         # PostgreSQL 스키마
│   ├── init-model-status.ts  # 상태 초기화 스크립트
│   └── seed.ts               # 시드 데이터
├── src/
│   ├── app/
│   │   └── api/v1/          # API 엔드포인트
│   ├── components/
│   │   └── monitoring/      # 모니터링 UI 컴포넌트
│   ├── services/            # 비즈니스 로직
│   └── contexts/            # React Context
└── docs/                    # 문서
```

## 🔄 현재 작업 상태 (2025-08-30)

### ✅ 완료된 작업
1. **PostgreSQL 마이그레이션 코드 준비**
   - Prisma 스키마 변경 완료
   - 환경설정 파일 업데이트
   - 타입 에러 해결

2. **데이터 일관성 개선**
   - GitHub 하드코딩 제거
   - 단일 데이터 소스 (DB) 사용
   - 에러 처리 표준화

3. **UI/UX 개선**
   - 로딩 상태 추가
   - 에러 핸들링 구현
   - 재시도 기능 추가

### ⏳ 진행 중인 작업
- PostgreSQL 로컬 설치 및 설정
- DATABASE_URL 환경변수 구성
- Prisma 마이그레이션 실행

### 📋 다음 작업
- 데이터 시딩
- 모델 상태 초기화
- Vercel 배포 환경변수 설정

## 🐛 알려진 이슈

### Critical
- **PostgreSQL 연결 실패**: DATABASE_URL 설정 필요
- **API 500 에러**: DB 연결 없이 API 호출 불가

### Minor
- **포트 충돌**: 3005 포트 사용 중 확인 필요

## 🔑 환경변수 설정

### 개발 환경 (.env.local)
```env
# PostgreSQL 연결 (설정 필요)
DATABASE_URL="postgresql://postgres:[password]@localhost:5432/ai_server_info?schema=public"

# 기타 설정
NODE_ENV=development
PORT=3005
NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_DISABLE_WEBSOCKET=true
```

### 프로덕션 환경 (Vercel)
- DATABASE_URL: PostgreSQL 연결 문자열 설정 필요
- 나머지 환경변수는 기존 설정 유지

## 📝 주요 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 상태 |
|-----------|--------|------|------|
| `/api/v1/status` | GET | 시스템 상태 | ⚠️ DB 필요 |
| `/api/v1/realtime-stats` | GET | 실시간 통계 | ⚠️ DB 필요 |
| `/api/v1/models` | GET | 모델 목록 | ⚠️ DB 필요 |
| `/api/v1/models/init-status` | POST | 상태 초기화 | ⚠️ DB 필요 |

## 🧪 테스트 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# API 테스트
node test-api.js

# Prisma Studio (DB 관리)
npx prisma studio
```

## 📚 관련 문서
- `docs/MONITORING_DEPLOYMENT_SOLUTIONS.md` - 아키텍처 분석
- `TEST_REPORT_2025_08_30.md` - 테스트 결과
- `PROJECT_STATUS.md` - 작업 상태 상세

## 🚀 빠른 시작 가이드

### 1. PostgreSQL 설치
```bash
# PostgreSQL 16 설치 후
psql -U postgres
CREATE DATABASE ai_server_info;
```

### 2. 환경변수 설정
```bash
# .env.local 수정
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ai_server_info"
```

### 3. 마이그레이션 실행
```bash
npx prisma migrate dev --name init
npx prisma db seed  # 선택사항
```

### 4. 서버 실행
```bash
npm run dev
# http://localhost:3005 접속
```

## 💡 팁
- 포트 충돌 시: `netstat -ano | findstr :3005`로 프로세스 확인
- DB 연결 테스트: `npx prisma db push`
- 로그 확인: `npm run dev | grep -i error`

---

**이 문서는 `/sc:load`로 프로젝트 컨텍스트를 빠르게 복원하기 위한 것입니다.**