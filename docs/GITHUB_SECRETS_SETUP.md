# GitHub Actions Secrets 설정 가이드

## 📋 개요
GitHub Actions에서 AI 모델 자동 동기화를 위해 필요한 API 키를 시크릿으로 설정하는 방법입니다.

## 🔐 GitHub Secrets 설정 방법

### 1. GitHub 레포지토리로 이동
1. 브라우저에서 GitHub 레포지토리 열기: https://github.com/ksy2728/AI-GO
2. 로그인 확인

### 2. Settings 메뉴 접근
1. 레포지토리 상단 메뉴에서 **Settings** 클릭
2. 왼쪽 사이드바에서 **Secrets and variables** → **Actions** 클릭

### 3. 시크릿 추가
1. **New repository secret** 버튼 클릭
2. 각 API 키마다 다음 정보 입력:
   - **Name**: 시크릿 이름 (아래 목록 참조)
   - **Secret**: 실제 API 키 값
3. **Add secret** 버튼 클릭

## 📝 필요한 시크릿 목록

### 필수 시크릿 (이미 보유한 키)
```yaml
OPENAI_API_KEY: "sk-..." # OpenAI API 키
ANTHROPIC_API_KEY: "sk-ant-..." # Anthropic API 키
```

### 선택적 시크릿 (필요시 추가)
```yaml
# Google/Gemini (둘 중 하나만 설정해도 됨)
GOOGLE_API_KEY: "AIza..." # Google AI API 키
GEMINI_API_KEY: "AIza..." # Gemini API 키

# 기타 AI 제공업체
COHERE_API_KEY: "..." # Cohere API 키
MISTRAL_API_KEY: "..." # Mistral AI API 키
REPLICATE_API_TOKEN: "r8_..." # Replicate API 토큰
META_API_KEY: "..." # Meta API 키 (필요한 경우)
```

## 🚀 로컬 환경변수에서 API 키 확인하기

### Windows PowerShell
```powershell
# 환경변수 확인
$env:OPENAI_API_KEY
$env:ANTHROPIC_API_KEY
```

### Windows Command Prompt
```cmd
# 환경변수 확인
echo %OPENAI_API_KEY%
echo %ANTHROPIC_API_KEY%
```

### .env.local 파일 확인
```bash
# .env.local 파일에서 API 키 확인
cat .env.local | grep API_KEY
```

## 📌 단계별 설정 예시

### 예시: OPENAI_API_KEY 설정

1. **GitHub 레포지토리 Settings 접근**
   ```
   https://github.com/ksy2728/AI-GO/settings/secrets/actions
   ```

2. **New repository secret 클릭**

3. **정보 입력**
   - Name: `OPENAI_API_KEY`
   - Secret: `sk-proj-xxxxxxxxxxxxx` (실제 API 키)

4. **Add secret 클릭**

5. **확인**
   - 시크릿 목록에 `OPENAI_API_KEY` 표시됨
   - 값은 보안상 표시되지 않음 (***로 표시)

## ✅ 설정 확인 방법

### 1. GitHub Actions 워크플로우 수동 실행
```bash
# GitHub 웹사이트에서:
Actions 탭 → "Sync All AI Provider Models" → Run workflow
```

### 2. 로컬에서 테스트
```bash
# 로컬 환경변수 설정 (Windows)
set OPENAI_API_KEY=sk-proj-xxxxx
set ANTHROPIC_API_KEY=sk-ant-xxxxx

# 동기화 스크립트 실행
npm run sync:models
```

## 🔍 문제 해결

### API 키가 작동하지 않는 경우
1. 시크릿 이름이 정확한지 확인 (대소문자 구분)
2. API 키 앞뒤 공백 제거
3. API 키 유효성 확인 (만료되지 않았는지)

### 워크플로우 실패 시
1. Actions 탭에서 실패한 워크플로우 클릭
2. 로그 확인하여 어떤 API 키가 문제인지 파악
3. 해당 시크릿 재설정

## 📚 참고 자료

- [GitHub Docs: Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Anthropic API Console](https://console.anthropic.com/account/keys)

## 💡 보안 주의사항

1. **절대 API 키를 코드에 직접 포함하지 마세요**
2. **시크릿은 레포지토리 설정에서만 관리하세요**
3. **API 키는 정기적으로 교체하세요**
4. **불필요한 API 키는 즉시 비활성화하세요**

---

작성일: 2025-08-15
작성자: AI-GO Team