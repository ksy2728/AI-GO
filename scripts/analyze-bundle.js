#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Analysis Tool
 * Analyzes Next.js build output and identifies optimization opportunities
 */

const buildDir = path.join(__dirname, '../.next');
const staticDir = path.join(buildDir, 'static/chunks');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('📦 Bundle Size Analysis');
  console.log('======================\n');

  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return;
  }

  // Analyze build manifest
  const manifestPath = path.join(buildDir, 'build-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('📋 Build Manifest Analysis:');

    // Analyze pages
    const pages = manifest.pages || {};
    let totalPageSize = 0;
    const pageSizes = [];

    Object.entries(pages).forEach(([page, chunks]) => {
      let pageSize = 0;
      chunks.forEach(chunk => {
        const chunkPath = path.join(staticDir, chunk);
        if (fs.existsSync(chunkPath)) {
          pageSize += fs.statSync(chunkPath).size;
        }
      });
      totalPageSize += pageSize;
      pageSizes.push({ page, size: pageSize, chunks: chunks.length });
    });

    // Sort by size
    pageSizes.sort((a, b) => b.size - a.size);

    console.log(`\n🔍 Page Sizes (Top 10):`);
    pageSizes.slice(0, 10).forEach(({ page, size, chunks }) => {
      console.log(`  ${page}: ${formatBytes(size)} (${chunks} chunks)`);
    });
  }

  // Analyze static chunks
  if (fs.existsSync(staticDir)) {
    const chunks = fs.readdirSync(staticDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(staticDir, file);
        const size = fs.statSync(filePath).size;
        return { file, size };
      })
      .sort((a, b) => b.size - a.size);

    console.log(`\n📊 Largest Chunks:`);
    chunks.slice(0, 15).forEach(({ file, size }) => {
      console.log(`  ${file}: ${formatBytes(size)}`);
    });

    // Calculate total bundle size
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    console.log(`\n📈 Total Bundle Size: ${formatBytes(totalSize)}`);

    // Identify potential optimizations
    console.log('\n🎯 Optimization Opportunities:');

    const largeChunks = chunks.filter(chunk => chunk.size > 100 * 1024); // > 100KB
    if (largeChunks.length > 0) {
      console.log(`  • ${largeChunks.length} chunks over 100KB - consider code splitting`);
    }

    const vendorChunks = chunks.filter(chunk => chunk.file.includes('vendor') || chunk.file.includes('node_modules'));
    if (vendorChunks.length > 0) {
      console.log(`  • ${vendorChunks.length} vendor chunks - review dependency usage`);
    }
  }

  // Check package.json for heavy dependencies
  const packagePath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const heavyDeps = [
      '@tanstack/react-query',
      '@radix-ui/react-tabs',
      'recharts',
      'framer-motion',
      'socket.io-client',
      '@anthropic-ai/sdk',
      '@google/generative-ai',
      'openai'
    ];

    console.log('\n📚 Heavy Dependencies Detected:');
    heavyDeps.forEach(dep => {
      if (pkg.dependencies?.[dep]) {
        console.log(`  • ${dep} v${pkg.dependencies[dep]}`);
      }
    });
  }

  console.log('\n💡 Recommendations:');
  console.log('  1. Implement dynamic imports for large dependencies');
  console.log('  2. Use route-based code splitting');
  console.log('  3. Lazy load mobile-specific components');
  console.log('  4. Consider tree shaking for unused exports');
  console.log('  5. Optimize third-party library imports');
}

// Check for webpack-bundle-analyzer report
function checkBundleAnalyzer() {
  console.log('\n🔬 Bundle Analyzer Integration:');
  const analyzerPath = path.join(__dirname, '../analyze');
  if (fs.existsSync(analyzerPath)) {
    console.log('  ✅ Webpack Bundle Analyzer available');
    console.log('  📊 Run "npm run analyze" to view detailed report');
  } else {
    console.log('  ⚠️  Bundle analyzer not configured');
    console.log('  💡 Consider adding @next/bundle-analyzer for detailed analysis');
  }
}

if (require.main === module) {
  analyzeBundle();
  checkBundleAnalyzer();
}

module.exports = { analyzeBundle, formatBytes };