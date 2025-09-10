# ✅ Neon PostgreSQL 마이그레이션 체크리스트

## 🚀 Quick Start Commands

```bash
# 1. 환경변수 설정 (.env.local)
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# 2. 연결 테스트
node scripts/test-neon-connection.js

# 3. 마이그레이션 실행
npx prisma migrate deploy

# 4. 데이터 시딩
npx prisma db seed

# 5. 배포
git add .
git commit -m "feat: migrate to Neon PostgreSQL"
git push origin master
```

---

## Phase 1: Neon 설정 ⏱️ 30분

### 🔲 Neon 계정 설정
- [ ] Neon.tech 가입
- [ ] 프로젝트 생성 (ai-go-production)
- [ ] Region 선택 (US East)
- [ ] 연결 문자열 복사
  - [ ] Pooled connection URL
  - [ ] Direct connection URL

### 🔲 로컬 테스트
- [ ] .env.local 업데이트
- [ ] `npx prisma db pull` 실행
- [ ] `npx prisma studio` 접속 확인

---

## Phase 2: 데이터 마이그레이션 ⏱️ 45분

### 🔲 스키마 마이그레이션
- [ ] 마이그레이션 파일 확인
- [ ] `npx prisma migrate deploy` 실행
- [ ] 테이블 생성 확인

### 🔲 데이터 시딩
- [ ] `npx prisma db seed` 실행
- [ ] Provider 데이터 확인 (최소 5개)
- [ ] Model 데이터 확인 (최소 30개)
- [ ] ModelStatus 초기화 확인

### 🔲 데이터 검증
- [ ] `node scripts/test-neon-connection.js` 실행
- [ ] 모든 테스트 통과 확인

---

## Phase 3: Vercel 설정 ⏱️ 30분

### 🔲 환경변수 설정
- [ ] Vercel Dashboard 접속
- [ ] Environment Variables 페이지 이동
- [ ] 변수 추가:
  - [ ] DATABASE_URL (Production)
  - [ ] DIRECT_URL (Production)
  - [ ] DATA_SOURCE = "database"
- [ ] 설정 저장

### 🔲 빌드 설정
- [ ] vercel.json 확인/수정
- [ ] Git 커밋 및 푸시

### 🔲 재배포
- [ ] 배포 트리거
- [ ] 빌드 로그 확인
- [ ] 마이그레이션 성공 확인

---

## Phase 4: 검증 ⏱️ 30분

### 🔲 API 테스트
- [ ] `/api/v1/status` 확인
  - [ ] dataSource = "database"
  - [ ] 에러 없음
- [ ] `/api/v1/models` 확인
  - [ ] 데이터 로드됨
  - [ ] 관계 데이터 포함
- [ ] `/api/v1/benchmarks` 확인
- [ ] `/api/v1/pricing` 확인

### 🔲 성능 확인
- [ ] 응답 시간 < 500ms
- [ ] 에러율 < 1%
- [ ] 메모리 사용량 정상

### 🔲 모니터링
- [ ] Vercel Analytics 확인
- [ ] Neon Dashboard 확인
- [ ] 에러 로그 확인

---

## 🚨 문제 발생 시

### 즉시 롤백:
```bash
# Vercel Dashboard에서
DATA_SOURCE = "github"  # database → github

# 재배포
vercel --prod --force
```

### 디버깅:
```bash
# 로컬에서 연결 테스트
DATABASE_URL="neon-url" npx prisma studio

# 로그 확인
vercel logs --prod

# API 직접 테스트
curl https://ai-server-information.vercel.app/api/v1/status
```

---

## 📊 성공 지표

✅ **필수 확인 사항:**
- dataSource가 "database"로 표시
- 모든 API 엔드포인트 정상 작동
- 에러 없이 데이터 조회
- 빌드 및 배포 성공

⭐ **추가 확인 사항:**
- 응답 시간 개선
- 실시간 데이터 업데이트
- 자동 동기화 작동

---

## 📝 Notes

**중요 사항:**
- Neon 무료 플랜: 3GB 스토리지, 1개 프로젝트
- Pooled connection 사용 권장 (서버리스 환경)
- 빌드 시 시딩 제외 (별도 실행)
- 폴백 메커니즘 유지

**문제 해결:**
- P03000 에러: DATABASE_URL 확인
- P1001 에러: 네트워크/방화벽 확인
- 타임아웃: Connection pool 설정 확인

---

**작성일**: 2025-09-07
**업데이트**: 실시간
**상태**: 🟢 Ready to Execute