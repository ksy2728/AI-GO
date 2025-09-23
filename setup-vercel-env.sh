#!/bin/bash
# Vercel 환경 변수 설정 스크립트

echo "🔧 Vercel 환경 변수 설정 시작..."

# AA 자동 동기화 활성화
vercel env add AA_AUTO_SYNC production <<< "true"
vercel env add AA_AUTO_SYNC preview <<< "true"
vercel env add AA_AUTO_SYNC development <<< "true"

# 동기화 스케줄 설정 (6시간마다)
vercel env add AA_SYNC_SCHEDULE production <<< "0 */6 * * *"
vercel env add AA_SYNC_SCHEDULE preview <<< "0 */6 * * *"
vercel env add AA_SYNC_SCHEDULE development <<< "0 */6 * * *"

# 시작시 동기화 실행
vercel env add AA_SYNC_ON_STARTUP production <<< "true"

echo "✅ 환경 변수 설정 완료!"
echo ""
echo "📋 설정된 환경 변수:"
vercel env ls

echo ""
echo "🚀 변경사항 적용을 위해 재배포가 필요합니다:"
echo "vercel --prod"