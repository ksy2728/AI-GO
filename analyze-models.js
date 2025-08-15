const data = require('./data/models.json');

const total = data.models.length;
const active = data.models.filter(m => m.isActive).length;
const inactive = data.models.filter(m => !m.isActive).length;

const operational = data.models.filter(m => m.status?.status === 'operational').length;
const degraded = data.models.filter(m => m.status?.status === 'degraded').length;
const outage = data.models.filter(m => m.status?.status === 'outage').length;
const hasEmptyStatus = data.models.filter(m => !m.status || Object.keys(m.status).length === 0).length;
const hasStatus = data.models.filter(m => m.status && Object.keys(m.status).length > 0).length;

console.log('=== 모델 수 분석 ===');
console.log('총 모델:', total);
console.log('활성 모델 (isActive=true):', active);
console.log('비활성 모델 (isActive=false):', inactive);
console.log('');

console.log('=== 상태별 분류 ===');
console.log('Operational 상태:', operational);
console.log('Degraded 상태:', degraded);
console.log('Outage 상태:', outage);
console.log('Unknown (빈 status):', hasEmptyStatus);
console.log('Status 정보 있음:', hasStatus);
console.log('');

console.log('=== 검증 ===');
console.log('총 모델 = Status있음 + Unknown?');
console.log(`${total} = ${hasStatus} + ${hasEmptyStatus} = ${hasStatus + hasEmptyStatus}`);
console.log('일치 여부:', total === (hasStatus + hasEmptyStatus));
console.log('');

console.log('총 모델 = Operational + Degraded + Outage + Unknown?');
console.log(`${total} = ${operational} + ${degraded} + ${outage} + ${hasEmptyStatus} = ${operational + degraded + outage + hasEmptyStatus}`);
console.log('일치 여부:', total === (operational + degraded + outage + hasEmptyStatus));
console.log('');

console.log('=== 활성/비활성 모델의 상태 ===');
const activeWithStatus = data.models.filter(m => m.isActive && m.status && Object.keys(m.status).length > 0).length;
const activeWithoutStatus = data.models.filter(m => m.isActive && (!m.status || Object.keys(m.status).length === 0)).length;
const inactiveWithStatus = data.models.filter(m => !m.isActive && m.status && Object.keys(m.status).length > 0).length;
const inactiveWithoutStatus = data.models.filter(m => !m.isActive && (!m.status || Object.keys(m.status).length === 0)).length;

console.log('활성 모델 중 Status 있음:', activeWithStatus);
console.log('활성 모델 중 Unknown:', activeWithoutStatus);
console.log('비활성 모델 중 Status 있음:', inactiveWithStatus);
console.log('비활성 모델 중 Unknown:', inactiveWithoutStatus);
console.log('');

console.log('=== 최종 검증 ===');
console.log('활성 모델 = 활성+Status있음 + 활성+Unknown?');
console.log(`${active} = ${activeWithStatus} + ${activeWithoutStatus} = ${activeWithStatus + activeWithoutStatus}`);
console.log('일치 여부:', active === (activeWithStatus + activeWithoutStatus));