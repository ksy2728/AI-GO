@echo off
echo 🔧 Vercel 환경 변수 설정 시작...

REM AA 자동 동기화 활성화
echo true | vercel env add AA_AUTO_SYNC production
echo true | vercel env add AA_AUTO_SYNC preview
echo true | vercel env add AA_AUTO_SYNC development

REM 동기화 스케줄 설정 (6시간마다)
echo 0 */6 * * * | vercel env add AA_SYNC_SCHEDULE production
echo 0 */6 * * * | vercel env add AA_SYNC_SCHEDULE preview
echo 0 */6 * * * | vercel env add AA_SYNC_SCHEDULE development

REM 시작시 동기화 실행
echo true | vercel env add AA_SYNC_ON_STARTUP production

echo.
echo ✅ 환경 변수 설정 완료!
echo.
echo 📋 설정된 환경 변수:
vercel env ls

echo.
echo 🚀 변경사항 적용을 위해 재배포가 필요합니다:
echo vercel --prod
pause