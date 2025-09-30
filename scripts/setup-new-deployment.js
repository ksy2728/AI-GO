#!/usr/bin/env node

/**
 * AI-GO 새 배포 설정 검증 스크립트
 *
 * 이 스크립트는 새로운 Vercel 배포를 위한 환경 설정을 검증합니다.
 * 필수 환경 변수, 외부 서비스 연결, 프로젝트 구조를 확인합니다.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 로그 함수
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}`)
};

// 환경 변수 카테고리
const ENV_VARIABLES = {
  required: {
    artificialanalysis_API_TOKEN: {
      description: 'Artificial Analysis API v2 키 (모델 데이터)',
      example: 'aa_DabcfQIXPg...',
      validator: (value) => {
        if (!value) return false;
        return value.startsWith('aa_') && value.length > 10;
      }
    },
    DATABASE_URL: {
      description: '데이터베이스 연결 문자열',
      example: 'postgresql://user:pass@host/db?sslmode=require',
      validator: (value) => {
        if (!value) return false;
        return value.includes('postgresql://') ||
               value.includes('mysql://') ||
               value.includes('file:');
      }
    },
    NODE_ENV: {
      description: '실행 환경',
      example: 'production',
      validator: (value) => ['development', 'production', 'test'].includes(value)
    }
  },
  optional: {
    UPSTASH_REDIS_REST_URL: {
      description: 'Redis 캐시 URL',
      example: 'https://xxx.upstash.io',
      validator: (value) => !value || value.startsWith('https://')
    },
    UPSTASH_REDIS_REST_TOKEN: {
      description: 'Redis 인증 토큰',
      example: 'AX...',
      validator: (value) => !value || value.length > 0
    },
    OPENAI_API_KEY: {
      description: 'OpenAI API 키',
      example: 'sk-...',
      validator: (value) => !value || value.startsWith('sk-')
    },
    ANTHROPIC_API_KEY: {
      description: 'Anthropic API 키',
      example: 'sk-ant-...',
      validator: (value) => !value || value.startsWith('sk-ant-')
    },
    GOOGLE_AI_API_KEY: {
      description: 'Google AI API 키',
      example: 'AI...',
      validator: (value) => !value || value.length > 0
    },
    AA_ENABLE_PERFORMANCE_FILTER: {
      description: 'AA 성능 필터 활성화',
      example: 'true',
      validator: (value) => !value || ['true', 'false'].includes(value)
    }
  }
};

// 파일 존재 확인
function checkFile(filePath, required = false) {
  const exists = fs.existsSync(filePath);
  const fileName = path.basename(filePath);

  if (exists) {
    log.success(`${fileName} 파일 존재`);
    return true;
  } else {
    if (required) {
      log.error(`${fileName} 파일 없음 - 필수 파일입니다!`);
    } else {
      log.warning(`${fileName} 파일 없음 - 선택사항`);
    }
    return false;
  }
}

// 환경 변수 확인
function checkEnvironmentVariables() {
  log.header('환경 변수 검증');

  const envFiles = ['.env', '.env.local', '.env.production.local'];
  let envVars = {};
  let envFileFound = false;

  // 환경 변수 파일 읽기
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      envFileFound = true;
      log.info(`${file} 파일 발견`);
      const content = fs.readFileSync(file, 'utf-8');
      content.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key) {
            envVars[key.trim()] = valueParts.join('=').trim().replace(/["']/g, '');
          }
        }
      });
    }
  }

  if (!envFileFound) {
    log.error('환경 변수 파일을 찾을 수 없습니다!');
    log.info('.env.example을 복사하여 .env.local을 생성하세요:');
    log.info('  cp .env.example .env.local');
    return false;
  }

  let hasErrors = false;

  // 필수 환경 변수 확인
  console.log('\n📋 필수 환경 변수:');
  for (const [key, config] of Object.entries(ENV_VARIABLES.required)) {
    const value = envVars[key] || process.env[key];
    if (!value) {
      log.error(`${key} - 설정되지 않음`);
      log.info(`  설명: ${config.description}`);
      log.info(`  예시: ${config.example}`);
      hasErrors = true;
    } else if (!config.validator(value)) {
      log.error(`${key} - 잘못된 형식`);
      log.info(`  현재 값: ${value.substring(0, 20)}...`);
      log.info(`  예시: ${config.example}`);
      hasErrors = true;
    } else {
      log.success(`${key} - OK`);
    }
  }

  // 선택 환경 변수 확인
  console.log('\n📋 선택 환경 변수:');
  for (const [key, config] of Object.entries(ENV_VARIABLES.optional)) {
    const value = envVars[key] || process.env[key];
    if (!value) {
      log.warning(`${key} - 설정되지 않음 (선택사항)`);
    } else if (!config.validator(value)) {
      log.warning(`${key} - 잘못된 형식`);
      log.info(`  현재 값: ${value.substring(0, 20)}...`);
      log.info(`  예시: ${config.example}`);
    } else {
      log.success(`${key} - OK`);
    }
  }

  return !hasErrors;
}

// Node.js 버전 확인
function checkNodeVersion() {
  log.header('시스템 요구사항 확인');

  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.split('.')[0].substring(1));

  if (major >= 18) {
    log.success(`Node.js ${nodeVersion} - OK`);
    return true;
  } else {
    log.error(`Node.js ${nodeVersion} - 버전 18 이상 필요!`);
    return false;
  }
}

// npm 패키지 확인
function checkDependencies() {
  log.header('의존성 확인');

  if (!fs.existsSync('node_modules')) {
    log.error('node_modules 디렉토리가 없습니다!');
    log.info('다음 명령을 실행하세요:');
    log.info('  npm install');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const requiredPackages = ['next', '@prisma/client', 'prisma'];

  let hasErrors = false;
  for (const pkg of requiredPackages) {
    const packagePath = path.join('node_modules', pkg);
    if (fs.existsSync(packagePath)) {
      log.success(`${pkg} 설치됨`);
    } else {
      log.error(`${pkg} 설치되지 않음`);
      hasErrors = true;
    }
  }

  return !hasErrors;
}

// Prisma 설정 확인
function checkPrismaSetup() {
  log.header('Prisma 설정 확인');

  if (!fs.existsSync('prisma/schema.prisma')) {
    log.error('Prisma 스키마 파일이 없습니다!');
    return false;
  }
  log.success('Prisma 스키마 파일 존재');

  try {
    execSync('npx prisma generate', { stdio: 'ignore' });
    log.success('Prisma 클라이언트 생성 가능');
  } catch (error) {
    log.error('Prisma 클라이언트 생성 실패');
    log.info('다음 명령을 실행하세요:');
    log.info('  npx prisma generate');
    return false;
  }

  return true;
}

// Vercel CLI 확인
function checkVercelCLI() {
  log.header('Vercel CLI 확인');

  try {
    const version = execSync('vercel --version', { encoding: 'utf-8' }).trim();
    log.success(`Vercel CLI 설치됨: ${version}`);
    return true;
  } catch (error) {
    log.warning('Vercel CLI가 설치되지 않음');
    log.info('다음 명령으로 설치하세요:');
    log.info('  npm i -g vercel');
    return false;
  }
}

// 프로젝트 구조 확인
function checkProjectStructure() {
  log.header('프로젝트 구조 확인');

  const requiredDirs = ['src', 'src/app', 'src/components', 'prisma', 'public'];
  const requiredFiles = ['package.json', 'next.config.js', 'tsconfig.json'];

  let hasErrors = false;

  console.log('\n📁 필수 디렉토리:');
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      log.success(`${dir}/`);
    } else {
      log.error(`${dir}/ - 없음`);
      hasErrors = true;
    }
  }

  console.log('\n📄 필수 파일:');
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log.success(file);
    } else {
      log.error(`${file} - 없음`);
      hasErrors = true;
    }
  }

  return !hasErrors;
}

// 빌드 테스트
async function testBuild() {
  log.header('빌드 테스트 (선택사항)');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('빌드를 테스트하시겠습니까? (시간이 걸릴 수 있습니다) [y/N]: ', (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'y') {
        log.info('빌드 시작... (2-5분 소요)');
        try {
          execSync('npm run build', { stdio: 'inherit' });
          log.success('빌드 성공!');
          resolve(true);
        } catch (error) {
          log.error('빌드 실패!');
          log.info('오류를 확인하고 수정하세요.');
          resolve(false);
        }
      } else {
        log.info('빌드 테스트 건너뜀');
        resolve(true);
      }
    });
  });
}

// 최종 보고서
function printReport(results) {
  log.header('🏁 최종 검증 결과');

  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(r => r).length;

  console.log('\n검사 항목:');
  for (const [check, passed] of Object.entries(results)) {
    if (passed) {
      log.success(check);
    } else {
      log.error(check);
    }
  }

  console.log(`\n결과: ${passedChecks}/${totalChecks} 통과`);

  if (passedChecks === totalChecks) {
    log.success('\n🎉 모든 검사를 통과했습니다! Vercel 배포 준비 완료!');
    console.log('\n다음 단계:');
    console.log('1. vercel 명령으로 배포 시작');
    console.log('2. Vercel Dashboard에서 환경 변수 설정');
    console.log('3. 데이터베이스 마이그레이션 실행');
  } else {
    log.error('\n⚠️  일부 검사를 통과하지 못했습니다.');
    console.log('\n문제 해결:');
    console.log('1. 위에 표시된 오류 메시지 확인');
    console.log('2. DEPLOYMENT_GUIDE.md 문서 참조');
    console.log('3. 필수 환경 변수와 서비스 설정');
  }
}

// 메인 실행 함수
async function main() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════╗
║           AI-GO 새 배포 설정 검증 스크립트           ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}`);

  const results = {
    'Node.js 버전': checkNodeVersion(),
    '프로젝트 구조': checkProjectStructure(),
    '의존성 설치': checkDependencies(),
    'Prisma 설정': checkPrismaSetup(),
    '환경 변수': checkEnvironmentVariables(),
    'Vercel CLI': checkVercelCLI()
  };

  // 선택적 빌드 테스트
  const buildResult = await testBuild();
  if (buildResult !== null) {
    results['빌드 테스트'] = buildResult;
  }

  printReport(results);
}

// 스크립트 실행
main().catch(error => {
  log.error('스크립트 실행 중 오류 발생:');
  console.error(error);
  process.exit(1);
});