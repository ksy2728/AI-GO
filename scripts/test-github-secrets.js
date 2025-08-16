#!/usr/bin/env node

/**
 * Test GitHub Secrets Configuration
 * This script simulates what the GitHub Actions workflow will do
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

console.log('🔐 Testing GitHub Secrets Configuration');
console.log('=' .repeat(50));
console.log('\n📋 Instructions to verify GitHub Secrets:\n');

// Generate test workflow file
const testWorkflow = `
name: Test API Keys

on:
  workflow_dispatch:

jobs:
  test-secrets:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check API Keys
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          GOOGLE_API_KEY: \${{ secrets.GOOGLE_API_KEY }}
        run: |
          echo "🔍 Checking API Keys..."
          echo "================================"
          
          if [ ! -z "$OPENAI_API_KEY" ]; then
            echo "✅ OPENAI_API_KEY is configured"
            echo "   Length: \${#OPENAI_API_KEY} characters"
            echo "   Prefix: \${OPENAI_API_KEY:0:7}..."
          else
            echo "❌ OPENAI_API_KEY is NOT configured"
          fi
          
          if [ ! -z "$ANTHROPIC_API_KEY" ]; then
            echo "✅ ANTHROPIC_API_KEY is configured"
            echo "   Length: \${#ANTHROPIC_API_KEY} characters"
            echo "   Prefix: \${ANTHROPIC_API_KEY:0:7}..."
          else
            echo "❌ ANTHROPIC_API_KEY is NOT configured"
          fi
          
          if [ ! -z "$GEMINI_API_KEY" ] || [ ! -z "$GOOGLE_API_KEY" ]; then
            echo "✅ GEMINI/GOOGLE_API_KEY is configured"
            if [ ! -z "$GEMINI_API_KEY" ]; then
              echo "   GEMINI_API_KEY Length: \${#GEMINI_API_KEY} characters"
            fi
            if [ ! -z "$GOOGLE_API_KEY" ]; then
              echo "   GOOGLE_API_KEY Length: \${#GOOGLE_API_KEY} characters"
            fi
          else
            echo "❌ GEMINI/GOOGLE_API_KEY is NOT configured"
          fi
          
          echo "================================"
          echo "✅ Test complete!"
`;

console.log('1️⃣ **Option 1: Check via GitHub Website**');
console.log('   - Go to: https://github.com/ksy2728/AI-GO/settings/secrets/actions');
console.log('   - You should see these secrets listed:');
console.log('     • OPENAI_API_KEY');
console.log('     • ANTHROPIC_API_KEY');
console.log('     • GEMINI_API_KEY (or GOOGLE_API_KEY)');
console.log('   - Values will show as *** for security\n');

console.log('2️⃣ **Option 2: Test with GitHub Actions**');
console.log('   - Go to: https://github.com/ksy2728/AI-GO/actions');
console.log('   - Click on "Sync All AI Provider Models" workflow');
console.log('   - Click "Run workflow" button');
console.log('   - Select the branch and click "Run workflow"');
console.log('   - Check the logs to see if API keys are detected\n');

console.log('3️⃣ **Option 3: Create a Test Workflow**');
console.log('   Create file: .github/workflows/test-secrets.yml');
console.log('   Content:');
console.log('```yaml' + testWorkflow + '```\n');

console.log('4️⃣ **Option 4: Use GitHub API (requires token)**');
console.log('   ```bash');
console.log('   curl -H "Authorization: token YOUR_GITHUB_TOKEN" \\');
console.log('        https://api.github.com/repos/ksy2728/AI-GO/actions/secrets');
console.log('   ```\n');

console.log('=' .repeat(50));
console.log('\n🚀 Quick Test Commands:\n');

console.log('# Trigger workflow manually from command line (requires gh CLI):');
console.log('gh workflow run "Sync All AI Provider Models" --repo ksy2728/AI-GO\n');

console.log('# Check workflow runs:');
console.log('gh run list --workflow="Sync All AI Provider Models" --repo ksy2728/AI-GO\n');

console.log('# View latest run logs:');
console.log('gh run view --repo ksy2728/AI-GO\n');

console.log('=' .repeat(50));
console.log('\n📊 Expected Results if properly configured:');
console.log('   ✅ OpenAI: Should sync models using API');
console.log('   ✅ Anthropic: Should sync models using API');
console.log('   ✅ Gemini/Google: Should sync models using API');
console.log('   ℹ️ Others: Will use hardcoded latest models\n');

// Save test workflow file
const fs = require('fs');
const path = require('path');

const testWorkflowPath = path.join(process.cwd(), '.github', 'workflows', 'test-secrets.yml');
fs.writeFileSync(testWorkflowPath, testWorkflow.trim());
console.log(`✅ Test workflow created at: ${testWorkflowPath}`);
console.log('   Push this file and run it to test your secrets!\n');

console.log('=' .repeat(50));