# AI-GO 배포 가이드

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [환경 변수 설정](#환경-변수-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [Redis 설정](#redis-설정)
5. [빌드 및 배포](#빌드-및-배포)
6. [프로덕션 최적화](#프로덕션-최적화)
7. [모니터링](#모니터링)

## 사전 요구사항

- Node.js 18.x 이상
- PostgreSQL 14 이상
- Redis 7.0 이상
- npm 또는 yarn

## 환경 변수 설정

1. `.env.production.example`을 `.env.production`으로 복사:
```bash
cp .env.production.example .env.production
```

2. 실제 값으로 환경 변수 업데이트:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `REDIS_URL`: Redis 연결 문자열
- `JWT_SECRET`: 최소 32자 이상의 보안 문자열
- 기타 필요한 API 키

## 데이터베이스 설정

1. 데이터베이스 생성:
```sql
CREATE DATABASE ai_go_production;
```

2. Prisma 마이그레이션 실행:
```bash
npx prisma migrate deploy
```

3. 초기 데이터 시드 (선택사항):
```bash
npx prisma db seed
```

## Redis 설정

1. Redis 서버 설치 및 실행
2. 보안을 위해 비밀번호 설정:
```bash
redis-cli CONFIG SET requirepass "your-redis-password"
```

3. 영구 저장 설정:
```bash
redis-cli CONFIG SET save "900 1 300 10 60 10000"
redis-cli CONFIG REWRITE
```

## 빌드 및 배포

### 1. 의존성 설치
```bash
npm ci --production
```

### 2. 프로덕션 빌드
```bash
npm run build
```

### 3. 빌드 검증
```bash
npm run start
```

### 4. PM2를 사용한 프로세스 관리 (권장)
```bash
# PM2 설치
npm install -g pm2

# 앱 시작
pm2 start npm --name "ai-go" -- start

# 자동 재시작 설정
pm2 save
pm2 startup
```

## 프로덕션 최적화

### 1. Next.js 최적화
- 이미지 최적화 활성화
- 정적 페이지 생성 활용
- API 라우트 캐싱

### 2. 성능 최적화
- CDN 사용 (CloudFlare, AWS CloudFront 등)
- gzip/brotli 압축 활성화
- HTTP/2 활성화

### 3. 보안 강화
```javascript
// next.config.js에 보안 헤더 추가
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 모니터링

### 1. Core Web Vitals 모니터링
- 빌트인 Web Vitals 리포팅 활용
- Google Analytics 또는 커스텀 대시보드 구축

### 2. 에러 트래킹 (Sentry)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 3. 로그 수집
- PM2 로그: `pm2 logs ai-go`
- 커스텀 로그: Winston 또는 Pino 사용 권장

### 4. 업타임 모니터링
- Uptime Robot
- Pingdom
- AWS CloudWatch

## 배포 플랫폼별 가이드

### Vercel (권장)
1. Vercel CLI 설치: `npm i -g vercel`
2. 배포: `vercel --prod`
3. 환경 변수는 Vercel 대시보드에서 설정

### AWS EC2
1. EC2 인스턴스 생성 (t3.medium 이상 권장)
2. Node.js, PostgreSQL, Redis 설치
3. Nginx 리버스 프록시 설정
4. SSL 인증서 설정 (Let's Encrypt)

### Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

## 문제 해결

### 빌드 실패
- Node.js 버전 확인
- 의존성 충돌 확인: `npm ls`
- 캐시 삭제: `rm -rf .next node_modules`

### 성능 이슈
- Redis 연결 확인
- 데이터베이스 인덱스 최적화
- CDN 캐시 설정 확인

### 보안 이슈
- 환경 변수 노출 확인
- CORS 설정 검토
- Rate limiting 구현