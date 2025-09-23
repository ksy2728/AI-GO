const checkAPI = async () => {
  const res = await fetch('https://ai-server-information.vercel.app/api/v1/models?provider=openai&limit=20');
  const data = await res.json();

  console.log('=== OpenAI 모델 최종 확인 (GPT-5 포함) ===\n');
  console.log('총 OpenAI 모델:', data.models?.length || 0);

  // GPT-5 모델 필터링
  const gpt5Models = data.models?.filter(m => m.name.includes('GPT-5')) || [];
  const otherModels = data.models?.filter(m => !m.name.includes('GPT-5')) || [];

  if (gpt5Models.length > 0) {
    console.log('\n✅ GPT-5 시리즈 (' + gpt5Models.length + '개):');
    gpt5Models.forEach(m => {
      console.log('  - ' + m.name + ' (Intelligence: ' + (m.aa?.intelligence || m.intelligenceScore || 'N/A') + ')');
    });
  } else {
    console.log('\n❌ GPT-5 모델이 아직 API에 나타나지 않습니다.');
  }

  console.log('\n📋 기타 OpenAI 모델 (' + otherModels.length + '개):');
  otherModels.slice(0, 10).forEach(m => {
    console.log('  - ' + m.name + ' (Intelligence: ' + (m.aa?.intelligence || m.intelligenceScore || 'N/A') + ')');
  });

  console.log('\n💡 결론: 총 ' + data.models?.length + '개의 OpenAI 모델이 표시됩니다.');
};

// 배포 후 잠시 대기
setTimeout(() => {
  checkAPI().catch(console.error);
}, 8000);