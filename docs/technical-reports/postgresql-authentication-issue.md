# PostgreSQL 인증 문제 기술 분석 보고서

## 요약

AI-GO 모니터링 플랫폼에서 PostgreSQL 16.10과 Node.js/Prisma 간 인증 호환성 문제가 발생하고 있습니다. pgAdmin에서는 정상적으로 연결되지만, 애플리케이션 레벨에서는 지속적인 인증 실패가 발생하여 실시간 모니터링 기능에 영향을 미치고 있습니다.

## 문제 상황

### 증상
- ✅ **pgAdmin 연결**: 정상 (사용자명: postgres, 비밀번호: ppanparts)
- ❌ **Node.js/Prisma 연결**: 지속적인 인증 실패
- ✅ **애플리케이션 서비스**: GitHub 백업 데이터로 정상 작동
- ❌ **실시간 백그라운드 서비스**: 인증 실패로 오류 발생

### 에러 메시지
```
Error [PrismaClientInitializationError]:
Authentication failed against database server, the provided database credentials for 'postgres' are not valid.
```

## 시스템 아키텍처 분석

### 플랫폼 구성
- **OS**: Windows 10.0.26100 (MSYS_NT)
- **PostgreSQL**: 16.10 (Windows x64)
- **Node.js**: v18+ (Next.js 15.0.4)
- **ORM**: Prisma 6.1.0
- **개발 환경**: 포트 3006에서 실행

### 애플리케이션 아키텍처
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Prisma Client   │    │  PostgreSQL DB  │
│                 │    │                  │    │                 │
│ - API Routes    │────│ - Schema Models  │────│ - ai_server_info│
│ - Components    │    │ - Connection Pool│    │ - Schemas/Tables│
│ - Services      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                                               │
        │              ┌──────────────────┐             │
        └──────────────│   GitHub Backup   │─────────────┘
                       │                  │
                       │ - Fallback Data  │
                       │ - 32 Models      │
                       │ - JSON Format    │
                       └──────────────────┘
```

### 영향받는 서비스

#### 1. 실시간 모니터링 서비스 (`realtime-server.js`)
```javascript
// 문제가 되는 부분
const [models, providers, statuses] = await Promise.all([
  prisma.model.count(),        // ← 인증 실패
  prisma.provider.count(),     // ← 인증 실패  
  prisma.modelStatus.findMany() // ← 인증 실패
]);
```
- **기능**: 글로벌 통계 전송, 모델 변경 사항 모니터링
- **실행 주기**: 매 30초~1분
- **영향도**: 실시간 WebSocket 업데이트 실패

#### 2. 최적화된 동기화 서비스 (`optimized-sync.service.js`)
```javascript
// 우선순위 모델 동기화 실패
const models = await prisma.model.findMany({
  where: { slug: { in: priorityModels } },
  include: { provider: true, status: true }
}); // ← 인증 실패
```
- **기능**: 우선순위 모델 동기화 (GPT-4, Claude, Gemini 등)
- **실행 주기**: 매 5분
- **영향도**: 최신 모델 상태 업데이트 실패

#### 3. API 엔드포인트 서비스
```javascript
// API 호출 시 데이터베이스 연결 실패
const systemStats = await prisma.model.count(); // ← 인증 실패
// GitHub 백업으로 폴백
return await GitHubDataService.getSystemStats();
```
- **기능**: REST API 데이터 제공
- **백업**: GitHub 데이터 소스로 자동 폴백
- **영향도**: 정상 작동 (백업 메커니즘으로 인해)

## 환경 설정 분석

### 연결 문자열 구성
```env
# .env.local
DATABASE_URL="postgresql://postgres:ppanparts@localhost:5432/ai_server_info?schema=public&sslmode=prefer&connect_timeout=60"
DIRECT_URL="postgresql://postgres:ppanparts@localhost:5432/ai_server_info?schema=public&sslmode=prefer&connect_timeout=60"
```

### PostgreSQL 인증 설정 (`pg_hba.conf`)
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            trust  # ← 변경 시도했으나 적용 안됨
host    all             all             ::1/128                 scram-sha-256
```

### Prisma 스키마 구성
- **데이터소스**: PostgreSQL
- **클라이언트**: prisma-client-js
- **연결 풀**: 기본 설정 (최대 13개 연결)

## 문제 원인 분석

### 1. 인증 방식 불일치
- **PostgreSQL 기본**: `scram-sha-256` 인증
- **Node.js pg 드라이버**: 일부 버전에서 `scram-sha-256` 호환성 이슈
- **pgAdmin**: 자체 드라이버로 정상 인증

### 2. 연결 풀 관리
```javascript
prisma:info Starting a postgresql pool with 13 connections.
prisma:error Authentication failed against database server
```
- 연결 풀 생성 시점에서 모든 연결 인증 실패
- 단일 연결이 아닌 풀 레벨에서의 문제

### 3. 권한 및 설정 적용 문제
- Windows 환경에서 PostgreSQL 서비스 재시작 권한 부족
- `pg_hba.conf` 변경사항이 적용되지 않음
- `pg_ctl reload` 실행 시 권한 거부

## 영향도 평가

### 현재 시스템 상태

| 구성요소 | 상태 | 영향도 | 대안 |
|---------|------|--------|------|
| 웹 서비스 | ✅ 정상 | 없음 | - |
| API 엔드포인트 | ✅ 정상 | 없음 | GitHub 백업 |
| 실시간 모니터링 | ❌ 실패 | 중간 | 수동 새로고침 |
| 모델 동기화 | ❌ 실패 | 낮음 | GitHub 데이터 |
| 사용자 경험 | 🟡 제한적 | 낮음 | 기본 기능 정상 |

### 비즈니스 영향
- **핵심 기능**: 32개 모델 정보 제공 정상
- **실시간 업데이트**: 백그라운드 폴링 필요
- **데이터 정확성**: GitHub 백업으로 최신성 유지

## 시도한 해결 방법

### 1. 환경 변수 수정
```bash
# 시도한 연결 문자열 변형
DATABASE_URL="postgresql://postgres@localhost:5432/ai_server_info"           # 비밀번호 제거
DATABASE_URL="postgresql://postgres:ppanparts@localhost:5432/ai_server_info" # 비밀번호 포함
DATABASE_URL="postgresql://postgres:ppanparts@localhost:5432/ai_server_info?sslmode=prefer&connect_timeout=60" # SSL 설정
```

### 2. PostgreSQL 설정 변경
```bash
# pg_hba.conf 수정 시도
host    all    all    127.0.0.1/32    trust  # scram-sha-256에서 trust로 변경

# 서비스 재시작 시도
net stop postgresql-x64-16      # 권한 오류
net start postgresql-x64-16     # 권한 오류
pg_ctl reload                   # 권한 오류
```

### 3. 포트 변경
- 포트 3005 → 3006 변경으로 충돌 해결
- 애플리케이션 시작 성공

## 권장 해결 방안

### 즉시 해결 방안 (우선순위 높음)

#### 1. 관리자 권한으로 PostgreSQL 재시작
```powershell
# 관리자 권한 PowerShell에서 실행
Stop-Service postgresql-x64-16
Start-Service postgresql-x64-16
# 또는
Restart-Service postgresql-x64-16
```

#### 2. pg_hba.conf 설정 적용
```bash
# PostgreSQL 설치 디렉토리에서
"C:\Program Files\PostgreSQL\16\bin\pg_ctl" reload -D "C:\Program Files\PostgreSQL\16\data"
```

### 중기 해결 방안

#### 1. Node.js PostgreSQL 드라이버 업그레이드
```json
// package.json 의존성 업데이트
{
  "@prisma/client": "^6.14.0",
  "prisma": "^6.14.0",
  "pg": "^8.12.0"
}
```

#### 2. 연결 풀 설정 최적화
```javascript
// Prisma 연결 설정
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

// 환경 변수에 추가
DATABASE_URL="postgresql://postgres:ppanparts@localhost:5432/ai_server_info?schema=public&sslmode=require&connect_timeout=10&pool_timeout=20&pool_max=10"
```

#### 3. 대안 인증 방식 구성
```sql
-- PostgreSQL에서 사용자별 인증 방식 변경
ALTER USER postgres PASSWORD 'ppanparts';
```

### 장기 해결 방안

#### 1. Docker 컨테이너 환경 구성
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ppanparts
      POSTGRES_DB: ai_server_info
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

#### 2. 연결 모니터링 시스템 구축
```javascript
// 연결 상태 모니터링 및 자동 복구
class DatabaseConnectionMonitor {
  async checkConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
  
  async handleConnectionFailure() {
    // GitHub 백업으로 폴백
    // 연결 복구 시도
    // 알림 발송
  }
}
```

## 테스트 계획

### 1. 연결 테스트
```bash
# PostgreSQL 연결 테스트
psql -h localhost -p 5432 -U postgres -d ai_server_info

# Node.js에서 직접 연결 테스트
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'ai_server_info',
  user: 'postgres',
  password: 'ppanparts'
});
client.connect().then(() => console.log('Connected')).catch(console.error);
"
```

### 2. Prisma 연결 테스트
```bash
# Prisma Studio 실행 테스트
npx prisma studio

# 마이그레이션 상태 확인
npx prisma migrate status

# 데이터베이스 연결 확인
npx prisma db push --preview-feature
```

### 3. 애플리케이션 레벨 테스트
```javascript
// 실시간 서비스 테스트
const testPrismaConnection = async () => {
  try {
    const result = await prisma.model.count();
    console.log('✅ Database connection successful:', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};
```

## 모니터링 및 알림

### 현재 로그 분석
```javascript
// 오류 로그 패턴
prisma:error Invalid `prisma.model.count()` invocation
Authentication failed against database server, the provided database credentials for 'postgres' are not valid.

// 성공 로그 패턴  
prisma:info Starting a postgresql pool with 13 connections.
✅ Connected to Redis
🚀 Redis client ready
```

### 권장 모니터링
1. **데이터베이스 연결 상태 대시보드**
2. **실시간 오류 알림 시스템**
3. **백업 데이터 소스 활용률 추적**
4. **성능 메트릭 모니터링**

## 결론

현재 PostgreSQL 인증 문제는 시스템의 핵심 기능에는 영향을 주지 않지만, 실시간 모니터링 기능의 완전성을 저해하고 있습니다. 시스템의 견고한 백업 메커니즘 덕분에 사용자 경험에는 최소한의 영향만 있지만, 완전한 기능 구현을 위해서는 인증 문제 해결이 필요합니다.

단기적으로는 관리자 권한으로 PostgreSQL 서비스 재시작 및 설정 적용을, 중장기적으로는 Docker 컨테이너 환경 구성과 연결 모니터링 시스템 구축을 권장합니다.

---

**보고서 작성일**: 2025-08-31  
**시스템 버전**: AI-GO v0.1.1  
**PostgreSQL 버전**: 16.10  
**Node.js/Prisma 버전**: Prisma 6.1.0, Next.js 15.0.4