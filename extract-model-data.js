const fs = require('fs');
const html = fs.readFileSync('aa-debug.html', 'utf8');

// Extract script #59 which contains the model data
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scriptNum = 0;
let modelsData = null;

while ((match = scriptRegex.exec(html)) !== null) {
  scriptNum++;
  if (scriptNum !== 59) continue;

  const content = match[1];
  console.log('Script #59 length:', content.length);

  // Extract the models array from the Flight data
  // Pattern: "models":[{...model objects...}]
  // First, try to find where the models array starts
  const modelsStart = content.indexOf('"models":[');

  if (modelsStart === -1) {
    console.log('❌ "models" key not found in script');
    break;
  }

  console.log('Found "models" at position:', modelsStart);

  // Extract a large chunk starting from "models":[
  const chunk = content.substring(modelsStart, modelsStart + 500000);

  // Try to extract the array
  // Look for the pattern: "models":[{...}]
  const modelsMatch = chunk.match(/"models"\s*:\s*(\[[\s\S]*?\])/);

  if (modelsMatch) {
    try {
      // Try to parse the JSON
      let jsonStr = modelsMatch[1];

      // The JSON might be split across multiple lines, try to extract clean JSON
      const models = JSON.parse(jsonStr);

      console.log(`\n✅ Successfully parsed ${models.length} models!\n`);

      // Find Claude Sonnet models
      const claudeModels = models.filter(m =>
        m.model_name && m.model_name.includes('Claude') && m.model_name.includes('Sonnet')
      );

      console.log('Claude Sonnet models:');
      claudeModels.forEach(m => {
        console.log(`  - ${m.model_name}`);
        console.log(`    Quality Index: ${m.quality_index || m.coding_index || 'N/A'}`);
        console.log(`    Speed: ${m.tokens_per_second || 'N/A'} tokens/s`);
        console.log(`    Price: $${m.price_per_million_input_tokens || 'N/A'} / $${m.price_per_million_output_tokens || 'N/A'} per M tokens`);
        console.log();
      });

      // Check if Claude Sonnet 4.5 is present
      const sonnet45 = models.find(m =>
        m.model_name && (m.model_name.includes('Claude Sonnet 4.5') || m.model_name.includes('claude-sonnet-4-5'))
      );

      if (sonnet45) {
        console.log('🎉 Found Claude Sonnet 4.5!');
        console.log(JSON.stringify(sonnet45, null, 2));
      } else {
        console.log('⚠️ Claude Sonnet 4.5 not found in models array');
      }

      // Save sample for debugging
      fs.writeFileSync('models-sample.json', JSON.stringify(models.slice(0, 5), null, 2));
      console.log('\n📝 Saved first 5 models to models-sample.json');

    } catch (err) {
      console.error('❌ Failed to parse JSON:', err.message);
      console.log('Match preview:', modelsMatch[1].substring(0, 500));
    }
  } else {
    console.log('❌ Could not find models array in script');
  }

  break;
}