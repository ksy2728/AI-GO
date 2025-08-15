const data = require('./data/models.json');

console.log('=== 데이터 일관성 문제 분석 ===\n');

// 비활성인데 Operational인 모델 찾기
const inactiveButOperational = data.models.filter(m => 
  !m.isActive && m.status?.status === 'operational'
);

console.log('1. 비활성(isActive=false)인데 Operational 상태인 모델:');
inactiveButOperational.forEach(m => {
  console.log(`   - ${m.name} (${m.provider.name})`);
  console.log(`     isActive: ${m.isActive}, status: ${m.status?.status}, availability: ${m.status?.availability}`);
});

// 활성인데 status가 없는 모델 찾기
const activeButNoStatus = data.models.filter(m => 
  m.isActive && (!m.status || Object.keys(m.status).length === 0)
);

console.log('\n2. 활성(isActive=true)인데 Status 정보가 없는 모델:');
activeButNoStatus.forEach(m => {
  console.log(`   - ${m.name} (${m.provider.name})`);
  console.log(`     isActive: ${m.isActive}, availability: ${m.availability}`);
});

// 논리적 규칙
console.log('\n=== 제안하는 일관성 규칙 ===');
console.log('1. isActive=false인 모델 → status를 빈 객체({})로 설정');
console.log('2. isActive=true이고 status가 빈 모델 → 기본 operational 상태 부여');
console.log('3. availability < 90% → degraded 상태로 설정');
console.log('4. availability = 0% → outage 상태로 설정');