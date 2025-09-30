const fs = require('fs');

const html = fs.readFileSync('aa-debug.html', 'utf8');

// Find chunks that contain model-like data
const regex = /self\.__next_f\.push\(\s*\[([^\]]+)\]\s*\)/g;
let match, foundCount = 0;

console.log('=== Analyzing Flight chunks ===\n');

const chunks = [];
while ((match = regex.exec(html)) !== null) {
  try {
    const parsed = JSON.parse('[' + match[1] + ']');
    if (parsed.length >= 2) {
      chunks.push({
        segmentId: parsed[0],
        data: String(parsed[1]),
        length: String(parsed[1]).length
      });
    }
  } catch (e) {
    // Skip invalid chunks
  }
}

console.log(`Found ${chunks.length} total chunks\n`);

// Check for model-related data
for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const data = chunk.data;

  if (data.includes('model_name') || data.includes('quality_index') ||
      data.includes('Claude Sonnet 4.5') || data.includes('GPT-4')) {
    console.log(`Chunk #${i+1} (${chunk.length} bytes) contains model data:`);
    console.log(data.substring(0, 1000));
    console.log('...\n');
    foundCount++;
    if (foundCount >= 3) break;
  }
}

// Look for the longest chunks (likely to contain data)
console.log('\n=== Top 5 longest chunks ===');
chunks.sort((a, b) => b.length - a.length);
for (let i = 0; i < Math.min(5, chunks.length); i++) {
  console.log(`Chunk #${i+1}: ${chunks[i].length} bytes, starts with:`,
    chunks[i].data.substring(0, 200).replace(/\n/g, ' '));
}