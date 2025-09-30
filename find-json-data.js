const fs = require('fs');
const html = fs.readFileSync('aa-debug.html', 'utf8');

// Look for JSON data in various formats
console.log('=== Searching for embedded JSON data ===\n');

// 1. Check for script tags with JSON data
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  scriptCount++;
  const content = match[1];

  // Look for model data indicators
  if (content.includes('model_name') ||
      content.includes('quality_index') ||
      (content.includes('Claude') && content.includes('Sonnet'))) {

    console.log(`Found model data in script #${scriptCount}:`);
    console.log('Length:', content.length);
    console.log('Preview:', content.substring(0, 500).replace(/\n/g, ' '));
    console.log('\n---\n');
  }
}

console.log(`\nTotal scripts checked: ${scriptCount}`);

// 2. Try to find any JSON-like structure with models array
const jsonPattern = /\{[^{}]*"models"\s*:\s*\[[^\]]*\]/g;
const jsonMatches = html.match(jsonPattern);

if (jsonMatches) {
  console.log(`\nFound ${jsonMatches.length} potential JSON structures with "models" array`);
  jsonMatches.slice(0, 3).forEach((m, i) => {
    console.log(`\nMatch #${i+1}:`, m.substring(0, 300));
  });
}