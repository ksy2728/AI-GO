#!/usr/bin/env node

/**
 * Check API Keys Script
 * Checks for available API keys in environment variables
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking API Keys in Environment...\n');
console.log('=' .repeat(50));

const apiKeys = [
  { name: 'OPENAI_API_KEY', provider: 'OpenAI' },
  { name: 'ANTHROPIC_API_KEY', provider: 'Anthropic' },
  { name: 'GOOGLE_API_KEY', provider: 'Google' },
  { name: 'GEMINI_API_KEY', provider: 'Gemini' },
  { name: 'COHERE_API_KEY', provider: 'Cohere' },
  { name: 'MISTRAL_API_KEY', provider: 'Mistral AI' },
  { name: 'REPLICATE_API_TOKEN', provider: 'Replicate' },
  { name: 'META_API_KEY', provider: 'Meta' },
  { name: 'AZURE_OPENAI_API_KEY', provider: 'Azure OpenAI' },
  { name: 'HUGGINGFACE_TOKEN', provider: 'HuggingFace' }
];

const foundKeys = [];
const missingKeys = [];

apiKeys.forEach(({ name, provider }) => {
  const value = process.env[name];
  
  if (value) {
    // Mask the API key for security (show only first and last 4 characters)
    let maskedValue = '***';
    if (value.length > 8) {
      maskedValue = value.substring(0, 4) + '...' + value.substring(value.length - 4);
    }
    
    console.log(`✅ ${name.padEnd(25)} : ${maskedValue} (${provider})`);
    foundKeys.push({ name, provider, masked: maskedValue });
  } else {
    console.log(`❌ ${name.padEnd(25)} : Not found (${provider})`);
    missingKeys.push({ name, provider });
  }
});

console.log('\n' + '=' .repeat(50));
console.log('\n📊 Summary:');
console.log(`   Found: ${foundKeys.length} API keys`);
console.log(`   Missing: ${missingKeys.length} API keys`);

if (foundKeys.length > 0) {
  console.log('\n✅ Available API Keys for GitHub Secrets:');
  foundKeys.forEach(({ name, provider, masked }) => {
    console.log(`   ${name}: "${masked}" # ${provider}`);
  });
  
  console.log('\n📝 To add these to GitHub Secrets:');
  console.log('   1. Go to: https://github.com/ksy2728/AI-GO/settings/secrets/actions');
  console.log('   2. Click "New repository secret"');
  console.log('   3. Add each key with the same name as shown above');
  console.log('   4. Use the actual API key value (not the masked version)');
}

if (missingKeys.length > 0) {
  console.log('\n⚠️ Optional API Keys (add if you have them):');
  missingKeys.forEach(({ name, provider }) => {
    console.log(`   ${name} - ${provider}`);
  });
}

console.log('\n💡 Tip: The sync script will use hardcoded latest models for providers without API keys.');
console.log('=' .repeat(50));