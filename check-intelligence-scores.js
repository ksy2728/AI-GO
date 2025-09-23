const fs = require('fs');
const path = require('path');

console.log('=== Intelligence Score Analysis ===\n');

// Read intelligence-index.json
const intelligenceIndexPath = path.join(__dirname, 'data', 'intelligence-index.json');
if (fs.existsSync(intelligenceIndexPath)) {
  const data = JSON.parse(fs.readFileSync(intelligenceIndexPath, 'utf8'));

  // Sort by intelligence index
  const sorted = data.models.sort((a, b) => (b.intelligenceIndex || 0) - (a.intelligenceIndex || 0));

  console.log('📊 Top 20 Models from intelligence-index.json:');
  console.log('=' .repeat(60));
  sorted.slice(0, 20).forEach((model, i) => {
    console.log(`${i+1}. ${model.name.padEnd(30)} | Score: ${model.intelligenceIndex || 'N/A'}`);
  });

  // Find max score
  const maxScore = Math.max(...data.models.map(m => m.intelligenceIndex || 0));
  console.log(`\n🎯 Maximum Intelligence Score: ${maxScore}`);

  // Count models above 70
  const above70 = data.models.filter(m => (m.intelligenceIndex || 0) > 70);
  console.log(`📈 Models with score > 70: ${above70.length}`);
  if (above70.length > 0) {
    console.log('Models above 70:');
    above70.forEach(m => {
      console.log(`  - ${m.name}: ${m.intelligenceIndex}`);
    });
  }
}

// Check aa-models.json if exists
const aaModelsPath = path.join(__dirname, 'public', 'data', 'aa-models.json');
if (fs.existsSync(aaModelsPath)) {
  console.log('\n\n📊 AA Models Data (public/data/aa-models.json):');
  console.log('=' .repeat(60));

  const aaData = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));
  const aaSorted = aaData.models.sort((a, b) => (b.intelligenceScore || 0) - (a.intelligenceScore || 0));

  console.log('Top 20 models:');
  aaSorted.slice(0, 20).forEach((model, i) => {
    console.log(`${i+1}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore || 'N/A'}`);
  });

  const aaMaxScore = Math.max(...aaData.models.map(m => m.intelligenceScore || 0));
  console.log(`\n🎯 Maximum Intelligence Score (AA): ${aaMaxScore}`);

  const aaAbove70 = aaData.models.filter(m => (m.intelligenceScore || 0) > 70);
  console.log(`📈 Models with score > 70 (AA): ${aaAbove70.length}`);
  if (aaAbove70.length > 0) {
    console.log('Models above 70:');
    aaAbove70.forEach(m => {
      console.log(`  - ${m.name}: ${m.intelligenceScore}`);
    });
  }
}

// Check models.json if exists
const modelsPath = path.join(__dirname, 'data', 'models.json');
if (fs.existsSync(modelsPath)) {
  console.log('\n\n📊 Models Data (data/models.json):');
  console.log('=' .repeat(60));

  const modelsData = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
  if (modelsData.models) {
    const modelsSorted = modelsData.models.sort((a, b) => (b.intelligenceScore || 0) - (a.intelligenceScore || 0));

    console.log('Top 20 models:');
    modelsSorted.slice(0, 20).forEach((model, i) => {
      console.log(`${i+1}. ${model.name.padEnd(30)} | Score: ${model.intelligenceScore || 'N/A'}`);
    });

    const modelsMaxScore = Math.max(...modelsData.models.map(m => m.intelligenceScore || 0));
    console.log(`\n🎯 Maximum Intelligence Score (models.json): ${modelsMaxScore}`);

    const modelsAbove70 = modelsData.models.filter(m => (m.intelligenceScore || 0) > 70);
    console.log(`📈 Models with score > 70 (models.json): ${modelsAbove70.length}`);
    if (modelsAbove70.length > 0) {
      console.log('Models above 70:');
      modelsAbove70.forEach(m => {
        console.log(`  - ${m.name}: ${m.intelligenceScore}`);
      });
    }
  }
}