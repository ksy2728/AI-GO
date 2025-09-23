const fs = require('fs');
const path = require('path');

// Check if we have real AA API data
async function verifyAAApiData() {
  console.log('=== Verifying AA API Data ===\n');

  try {
    // Try to fetch from AA API
    console.log('🔍 Attempting to fetch from Artificial Analysis API...');
    const response = await fetch('https://artificialanalysis.ai/api/models');

    if (!response.ok) {
      console.log(`❌ AA API returned status: ${response.status}`);
      console.log('Note: AA API may require authentication or may have changed endpoints');
      return;
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched data from AA API`);
    console.log(`📊 Total models: ${data.length || 0}`);

    if (data && data.length > 0) {
      // Sort by quality_index
      const sorted = data.sort((a, b) => (b.quality_index || 0) - (a.quality_index || 0));

      console.log('\n🏆 Top 20 Models by Quality Index:');
      console.log('=' .repeat(70));

      sorted.slice(0, 20).forEach((model, i) => {
        const score = model.quality_index || model.intelligence_score || 'N/A';
        const provider = model.organization || model.provider || 'Unknown';
        console.log(`${(i+1).toString().padStart(2)}. ${model.name.padEnd(30)} | ${provider.padEnd(15)} | Score: ${score}`);
      });

      // Find GPT-5 models
      console.log('\n🔍 GPT-5 Models:');
      const gpt5Models = data.filter(m => m.name.includes('GPT-5'));
      if (gpt5Models.length > 0) {
        gpt5Models.forEach(m => {
          console.log(`  - ${m.name}: ${m.quality_index || m.intelligence_score || 'N/A'}`);
        });
      } else {
        console.log('  No GPT-5 models found in API data');
      }

      // Find highest score
      const maxScore = Math.max(...data.map(m => m.quality_index || m.intelligence_score || 0));
      console.log(`\n🎯 Maximum Quality Index: ${maxScore}`);

      // Count models above 70
      const above70 = data.filter(m => (m.quality_index || m.intelligence_score || 0) > 70);
      console.log(`📈 Models with score > 70: ${above70.length}`);

      if (above70.length > 0 && above70.length <= 10) {
        console.log('Models above 70:');
        above70.forEach(m => {
          const score = m.quality_index || m.intelligence_score;
          const provider = m.organization || m.provider || 'Unknown';
          console.log(`  - ${m.name} (${provider}): ${score}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error fetching AA API:', error.message);
    console.log('\nNote: This could be due to:');
    console.log('1. CORS restrictions (API might not allow direct browser/Node access)');
    console.log('2. API endpoint change');
    console.log('3. Authentication requirements');
    console.log('4. Rate limiting');
  }

  // Check local files
  console.log('\n\n=== Checking Local AA Data Files ===\n');

  const aaModelsPath = path.join(__dirname, 'public', 'data', 'aa-models.json');
  if (fs.existsSync(aaModelsPath)) {
    const aaData = JSON.parse(fs.readFileSync(aaModelsPath, 'utf8'));

    if (aaData.models && Array.isArray(aaData.models)) {
      const sorted = aaData.models.sort((a, b) => (b.intelligenceScore || 0) - (a.intelligenceScore || 0));

      console.log('📁 aa-models.json - Top 10 models:');
      sorted.slice(0, 10).forEach((m, i) => {
        console.log(`${(i+1).toString().padStart(2)}. ${m.name.padEnd(30)} | Score: ${m.intelligenceScore || 'N/A'}`);
      });

      const maxLocal = Math.max(...aaData.models.map(m => m.intelligenceScore || 0));
      console.log(`\n🎯 Maximum score in aa-models.json: ${maxLocal}`);
    }
  }
}

verifyAAApiData();