#!/usr/bin/env node

/**
 * AI-GO 빠른 배포 스크립트
 *
 * 새 컴퓨터에서 AI-GO를 Vercel에 배포하는 과정을 자동화합니다.
 * 사용법: node scripts/quick-deploy.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// 로그 함수
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.magenta}▶ ${msg}${colors.reset}`)
};

// readline 인터페이스
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 질문 함수
function question(prompt) {
  return new Promise(resolve => {
    rl.question(`${colors.yellow}${prompt}${colors.reset}`, resolve);
  });
}

// 명령 실행 함수
function runCommand(command, description) {
  try {
    log.info(description);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    return true;
  } catch (error) {
    log.error(`실패: ${description}`);
    return false;
  }
}

// 파일 존재 확인
function checkFile(filePath) {
  return fs.existsSync(filePath);
}

// 환경 변수 생성
async function createEnvFile() {
  log.header('환경 변수 설정');

  const envVars = {};

  // 필수 환경 변수
  log.step('필수 환경 변수를 입력해주세요');

  // Artificial Analysis API
  console.log('\n📌 Artificial Analysis API 키 (필수!)');
  console.log('   획득 방법: https://artificialanalysis.ai 가입 → Dashboard → API Keys');
  envVars.artificialanalysis_API_TOKEN = await question('artificialanalysis_API_TOKEN (aa_로 시작): ');

  if (!envVars.artificialanalysis_API_TOKEN.startsWith('aa_')) {
    log.warning('API 키가 aa_로 시작하지 않습니다. 올바른 키인지 확인하세요.');
  }

  // 데이터베이스 선택
  console.log('\n📌 데이터베이스 설정');
  console.log('   1. Neon (PostgreSQL) - 추천');
  console.log('   2. Supabase (PostgreSQL)');
  console.log('   3. PlanetScale (MySQL)');
  console.log('   4. 로컬 SQLite (개발용)');

  const dbChoice = await question('데이터베이스 선택 (1-4): ');

  switch (dbChoice) {
    case '1':
      console.log('   Neon 가입: https://neon.tech');
      envVars.DATABASE_URL = await question('DATABASE_URL (postgresql://...): ');
      break;
    case '2':
      console.log('   Supabase 가입: https://supabase.com');
      envVars.DATABASE_URL = await question('DATABASE_URL (postgresql://...): ');
      break;
    case '3':
      console.log('   PlanetScale 가입: https://planetscale.com');
      envVars.DATABASE_URL = await question('DATABASE_URL (mysql://...): ');
      break;
    case '4':
      envVars.DATABASE_URL = 'file:./dev.db';
      log.info('로컬 SQLite 데이터베이스를 사용합니다.');
      break;
    default:
      log.error('잘못된 선택입니다.');
      process.exit(1);
  }

  // 선택 환경 변수
  log.step('선택 환경 변수 (Enter로 건너뛰기 가능)');

  // Redis
  console.log('\n📌 Redis 캐싱 (선택사항, 성능 향상)');
  console.log('   Upstash 가입: https://upstash.com');
  const redisUrl = await question('UPSTASH_REDIS_REST_URL (비워두면 건너뜀): ');
  if (redisUrl) {
    envVars.UPSTASH_REDIS_REST_URL = redisUrl;
    envVars.UPSTASH_REDIS_REST_TOKEN = await question('UPSTASH_REDIS_REST_TOKEN: ');
  }

  // 기본 설정
  envVars.NODE_ENV = 'production';
  envVars.NEXT_PUBLIC_APP_URL = 'https://your-project.vercel.app';
  envVars.NEXT_PUBLIC_API_URL = 'https://your-project.vercel.app';
  envVars.FRONTEND_URL = 'https://your-project.vercel.app';

  // .env.local 파일 생성
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  fs.writeFileSync('.env.local', envContent);
  log.success('.env.local 파일이 생성되었습니다.');

  return envVars;
}

// Vercel CLI 확인 및 설치
async function checkVercelCLI() {
  log.header('Vercel CLI 확인');

  try {
    execSync('vercel --version', { stdio: 'ignore' });
    log.success('Vercel CLI가 이미 설치되어 있습니다.');
    return true;
  } catch (error) {
    log.warning('Vercel CLI가 설치되어 있지 않습니다.');
    const install = await question('Vercel CLI를 설치하시겠습니까? (y/n): ');

    if (install.toLowerCase() === 'y') {
      return runCommand('npm install -g vercel', 'Vercel CLI 설치 중...');
    }
    return false;
  }
}

// 의존성 설치
async function installDependencies() {
  log.header('의존성 설치');

  if (!checkFile('package.json')) {
    log.error('package.json 파일을 찾을 수 없습니다.');
    return false;
  }

  if (checkFile('node_modules')) {
    const reinstall = await question('node_modules가 이미 존재합니다. 재설치하시겠습니까? (y/n): ');
    if (reinstall.toLowerCase() !== 'y') {
      log.info('의존성 설치를 건너뜁니다.');
      return true;
    }
  }

  return runCommand('npm install', '의존성 설치 중... (2-5분 소요)');
}

// Prisma 설정
async function setupPrisma() {
  log.header('Prisma 설정');

  if (!checkFile('prisma/schema.prisma')) {
    log.error('Prisma 스키마 파일을 찾을 수 없습니다.');
    return false;
  }

  // Prisma 클라이언트 생성
  if (!runCommand('npx prisma generate', 'Prisma 클라이언트 생성 중...')) {
    return false;
  }

  // 데이터베이스 마이그레이션
  const migrate = await question('데이터베이스 마이그레이션을 실행하시겠습니까? (y/n): ');
  if (migrate.toLowerCase() === 'y') {
    runCommand('npx prisma db push', '데이터베이스 마이그레이션 실행 중...');
  }

  return true;
}

// 빌드 테스트
async function testBuild() {
  log.header('빌드 테스트');

  const test = await question('로컬 빌드를 테스트하시겠습니까? (시간이 걸립니다) (y/n): ');

  if (test.toLowerCase() === 'y') {
    return runCommand('npm run build', '빌드 테스트 중... (3-5분 소요)');
  }

  log.info('빌드 테스트를 건너뜁니다.');
  return true;
}

// Vercel 배포
async function deployToVercel(envVars) {
  log.header('Vercel 배포');

  log.info('Vercel에 로그인합니다...');
  runCommand('vercel login', 'Vercel 로그인');

  log.info('Vercel 프로젝트를 설정합니다...');
  console.log('\n다음 프롬프트에서:');
  console.log('  - Set up and deploy: Y');
  console.log('  - Which scope: 본인 계정 선택');
  console.log('  - Link to existing project: N');
  console.log('  - Project name: ai-go (또는 원하는 이름)');
  console.log('  - Directory: ./');
  console.log('  - Override settings: N\n');

  runCommand('vercel', 'Vercel 프로젝트 설정');

  // 환경 변수 설정
  log.step('Vercel에 환경 변수 설정 중...');

  for (const [key, value] of Object.entries(envVars)) {
    if (key === 'DATABASE_URL' || key.includes('TOKEN') || key.includes('KEY')) {
      // 민감한 정보는 production에만
      execSync(`echo "${value}" | vercel env add ${key} production`, {
        stdio: 'ignore',
        shell: true
      });
    } else {
      // 일반 변수는 모든 환경에
      execSync(`echo "${value}" | vercel env add ${key} production preview development`, {
        stdio: 'ignore',
        shell: true
      });
    }
    log.success(`${key} 설정 완료`);
  }

  // 프로덕션 배포
  const deploy = await question('\n프로덕션 배포를 진행하시겠습니까? (y/n): ');
  if (deploy.toLowerCase() === 'y') {
    runCommand('vercel --prod', '프로덕션 배포 중... (5-10분 소요)');
  }

  return true;
}

// 최종 안내
function showFinalInstructions(projectUrl) {
  log.header('🎉 배포 완료!');

  console.log('\n다음 단계:');
  console.log('1. Vercel Dashboard에서 프로젝트 확인');
  console.log('   https://vercel.com/dashboard\n');
  console.log('2. 배포된 URL 확인 후 환경 변수 업데이트');
  console.log('   - NEXT_PUBLIC_APP_URL');
  console.log('   - NEXT_PUBLIC_API_URL');
  console.log('   - FRONTEND_URL\n');
  console.log('3. 데이터 동기화 실행 (선택사항)');
  console.log('   vercel exec npm run sync:init\n');
  console.log('4. 문제 발생시 참고 문서:');
  console.log('   - docs/DEPLOYMENT_GUIDE.md');
  console.log('   - docs/DEPLOYMENT_CHECKLIST.md\n');
}

// 메인 실행 함수
async function main() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║                  AI-GO 빠른 배포 스크립트                 ║
║                                                            ║
║  이 스크립트는 AI-GO를 새로운 Vercel 프로젝트로          ║
║  배포하는 과정을 자동화합니다.                           ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // 1. Node.js 버전 확인
    log.header('시스템 요구사항 확인');
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.split('.')[0].substring(1));

    if (major < 18) {
      log.error(`Node.js ${nodeVersion} - 버전 18 이상이 필요합니다!`);
      log.info('Node.js 18 이상을 설치한 후 다시 실행해주세요.');
      process.exit(1);
    }
    log.success(`Node.js ${nodeVersion} ✓`);

    // 2. 프로젝트 구조 확인
    if (!checkFile('package.json') || !checkFile('next.config.js')) {
      log.error('AI-GO 프로젝트 루트 디렉토리에서 실행해주세요.');
      process.exit(1);
    }
    log.success('프로젝트 구조 확인 완료 ✓');

    // 3. 환경 변수 설정
    let envVars = {};
    if (checkFile('.env.local')) {
      const useExisting = await question('\n.env.local 파일이 이미 존재합니다. 사용하시겠습니까? (y/n): ');
      if (useExisting.toLowerCase() === 'y') {
        // 기존 환경 변수 읽기
        const envContent = fs.readFileSync('.env.local', 'utf-8');
        envContent.split('\n').forEach(line => {
          if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key) {
              envVars[key.trim()] = valueParts.join('=').trim().replace(/['"]/g, '');
            }
          }
        });
        log.success('기존 .env.local 파일을 사용합니다.');
      } else {
        envVars = await createEnvFile();
      }
    } else {
      envVars = await createEnvFile();
    }

    // 4. Vercel CLI 확인
    const hasVercel = await checkVercelCLI();
    if (!hasVercel) {
      log.error('Vercel CLI 없이는 배포할 수 없습니다.');
      log.info('수동으로 설치: npm install -g vercel');
      process.exit(1);
    }

    // 5. 의존성 설치
    await installDependencies();

    // 6. Prisma 설정
    await setupPrisma();

    // 7. 빌드 테스트 (선택)
    await testBuild();

    // 8. Vercel 배포
    const deploySuccess = await deployToVercel(envVars);

    if (deploySuccess) {
      // 9. 최종 안내
      showFinalInstructions();
    } else {
      log.error('배포 중 오류가 발생했습니다.');
      log.info('docs/DEPLOYMENT_GUIDE.md를 참고하여 수동으로 배포해주세요.');
    }

  } catch (error) {
    log.error('예상치 못한 오류가 발생했습니다:');
    console.error(error);
  } finally {
    rl.close();
  }
}

// 스크립트 실행
main().catch(error => {
  log.error('스크립트 실행 중 오류 발생:');
  console.error(error);
  process.exit(1);
});