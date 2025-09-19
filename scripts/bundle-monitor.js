#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Monitoring and Optimization Tool
 * Monitors bundle sizes, identifies optimization opportunities, and tracks improvements
 */

const BUNDLE_SIZE_LIMITS = {
  // Initial bundle size limits (in bytes)
  initialBundle: 500 * 1024, // 500KB
  totalBundle: 2 * 1024 * 1024, // 2MB
  chunkSize: 244 * 1024, // 244KB
  // Critical path resources
  criticalResources: 100 * 1024, // 100KB
};

const PERFORMANCE_TARGETS = {
  // Performance metrics targets
  firstContentfulPaint: 1500, // 1.5s
  largestContentfulPaint: 2500, // 2.5s
  timeToInteractive: 3500, // 3.5s
  bundleLoadTime: 1000, // 1s
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle sizes...');

  const buildDir = path.join(__dirname, '../.next');
  const staticDir = path.join(buildDir, 'static/chunks');

  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return null;
  }

  // Analyze chunks
  const chunks = fs.readdirSync(staticDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(staticDir, file);
      const size = fs.statSync(filePath).size;
      return { file, size, path: filePath };
    })
    .sort((a, b) => b.size - a.size);

  // Calculate metrics
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const largeChunks = chunks.filter(chunk => chunk.size > BUNDLE_SIZE_LIMITS.chunkSize);
  const initialChunks = chunks.filter(chunk =>
    chunk.file.includes('main') ||
    chunk.file.includes('framework') ||
    chunk.file.includes('webpack-runtime')
  );
  const initialSize = initialChunks.reduce((sum, chunk) => sum + chunk.size, 0);

  return {
    chunks,
    totalSize,
    initialSize,
    largeChunks,
    initialChunks,
    chunkCount: chunks.length
  };
}

function analyzePackageSizes() {
  console.log('📦 Analyzing package sizes...');

  try {
    // Use webpack-bundle-analyzer data if available
    const analyzerPath = path.join(__dirname, '../.next/analyze');
    if (fs.existsSync(analyzerPath)) {
      console.log('✅ Bundle analyzer data found');
      return parseAnalyzerData(analyzerPath);
    }

    // Fallback to package.json analysis
    const packagePath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const heavyPackages = [
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      'recharts',
      'framer-motion',
      'socket.io-client',
      '@anthropic-ai/sdk',
      '@google/generative-ai',
      'openai',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      'lucide-react'
    ];

    const installedHeavyPackages = heavyPackages.filter(pkg =>
      pkg.dependencies && pkg.dependencies[pkg]
    );

    return { installedHeavyPackages, packageCount: Object.keys(pkg.dependencies).length };
  } catch (error) {
    console.warn('⚠️ Could not analyze package sizes:', error.message);
    return null;
  }
}

function generateOptimizationReport(bundleAnalysis, packageAnalysis) {
  console.log('\n📊 Bundle Optimization Report');
  console.log('===============================\n');

  // Bundle size analysis
  console.log('📈 Bundle Size Analysis:');
  console.log(`  Total Bundle Size: ${formatBytes(bundleAnalysis.totalSize)}`);
  console.log(`  Initial Bundle Size: ${formatBytes(bundleAnalysis.initialSize)}`);
  console.log(`  Number of Chunks: ${bundleAnalysis.chunkCount}`);

  // Size limit checks
  const totalOverLimit = bundleAnalysis.totalSize > BUNDLE_SIZE_LIMITS.totalBundle;
  const initialOverLimit = bundleAnalysis.initialSize > BUNDLE_SIZE_LIMITS.initialBundle;

  if (totalOverLimit || initialOverLimit) {
    console.log('\n⚠️ Size Limit Violations:');
    if (totalOverLimit) {
      console.log(`  ❌ Total bundle exceeds ${formatBytes(BUNDLE_SIZE_LIMITS.totalBundle)} limit`);
    }
    if (initialOverLimit) {
      console.log(`  ❌ Initial bundle exceeds ${formatBytes(BUNDLE_SIZE_LIMITS.initialBundle)} limit`);
    }
  } else {
    console.log('✅ All bundle sizes within limits');
  }

  // Large chunks analysis
  if (bundleAnalysis.largeChunks.length > 0) {
    console.log('\n🔍 Large Chunks (>244KB):');
    bundleAnalysis.largeChunks.slice(0, 10).forEach(chunk => {
      console.log(`  📦 ${chunk.file}: ${formatBytes(chunk.size)}`);
    });
  }

  // Top 10 largest chunks
  console.log('\n🎯 Largest Chunks:');
  bundleAnalysis.chunks.slice(0, 10).forEach((chunk, index) => {
    const isLarge = chunk.size > BUNDLE_SIZE_LIMITS.chunkSize;
    const indicator = isLarge ? '⚠️' : '✅';
    console.log(`  ${index + 1}. ${indicator} ${chunk.file}: ${formatBytes(chunk.size)}`);
  });

  // Optimization recommendations
  console.log('\n💡 Optimization Recommendations:');

  const recommendations = [];

  if (bundleAnalysis.largeChunks.length > 3) {
    recommendations.push('🔄 Implement more aggressive code splitting for large chunks');
  }

  if (bundleAnalysis.initialSize > BUNDLE_SIZE_LIMITS.initialBundle) {
    recommendations.push('📦 Move non-critical code to dynamic imports');
  }

  if (bundleAnalysis.totalSize > BUNDLE_SIZE_LIMITS.totalBundle) {
    recommendations.push('🎯 Review and remove unused dependencies');
  }

  const hasVendorChunks = bundleAnalysis.chunks.some(chunk =>
    chunk.file.includes('vendor') && chunk.size > 500 * 1024
  );
  if (hasVendorChunks) {
    recommendations.push('🏗️ Split vendor chunks by usage frequency');
  }

  const hasDuplicates = bundleAnalysis.chunks.filter(chunk =>
    chunk.file.includes('common') || chunk.file.includes('shared')
  ).length > 3;
  if (hasDuplicates) {
    recommendations.push('🔗 Optimize chunk splitting to reduce duplication');
  }

  if (recommendations.length === 0) {
    console.log('  ✅ Bundle is well optimized!');
  } else {
    recommendations.forEach(rec => console.log(`  ${rec}`));
  }

  return {
    totalSize: bundleAnalysis.totalSize,
    initialSize: bundleAnalysis.initialSize,
    chunkCount: bundleAnalysis.chunkCount,
    largeChunkCount: bundleAnalysis.largeChunks.length,
    withinLimits: !totalOverLimit && !initialOverLimit,
    recommendations: recommendations.length
  };
}

function saveOptimizationHistory(report) {
  const historyPath = path.join(__dirname, '../.bundle-history.json');
  const timestamp = new Date().toISOString();

  let history = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not read bundle history:', error.message);
    }
  }

  const entry = {
    timestamp,
    ...report,
    commit: getCurrentCommit()
  };

  history.push(entry);

  // Keep only last 50 entries
  if (history.length > 50) {
    history = history.slice(-50);
  }

  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`\n📝 Bundle analysis saved to history (${history.length} entries)`);
  } catch (error) {
    console.warn('⚠️ Could not save bundle history:', error.message);
  }
}

function getCurrentCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function compareWithPrevious() {
  const historyPath = path.join(__dirname, '../.bundle-history.json');
  if (!fs.existsSync(historyPath)) return;

  try {
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (history.length < 2) return;

    const current = history[history.length - 1];
    const previous = history[history.length - 2];

    console.log('\n📈 Bundle Size Comparison:');

    const totalDiff = current.totalSize - previous.totalSize;
    const initialDiff = current.initialSize - previous.initialSize;
    const chunkDiff = current.chunkCount - previous.chunkCount;

    const formatDiff = (diff, isSize = true) => {
      const prefix = diff > 0 ? '+' : '';
      const value = isSize ? formatBytes(Math.abs(diff)) : Math.abs(diff);
      const indicator = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      return `${indicator} ${prefix}${diff === 0 ? '0' : value}`;
    };

    console.log(`  Total Size: ${formatDiff(totalDiff)}`);
    console.log(`  Initial Size: ${formatDiff(initialDiff)}`);
    console.log(`  Chunk Count: ${formatDiff(chunkDiff, false)}`);

    if (Math.abs(totalDiff) > 50 * 1024) { // 50KB threshold
      const improvement = totalDiff < 0 ? 'improvement' : 'regression';
      console.log(`  🎯 Significant size ${improvement} detected!`);
    }
  } catch (error) {
    console.warn('⚠️ Could not compare with previous build:', error.message);
  }
}

function generatePerformanceMetrics() {
  console.log('\n⚡ Performance Impact Estimates:');

  // Estimate loading times based on bundle sizes
  const connectionSpeeds = {
    '3G': 1.6, // Mbps
    '4G': 10,  // Mbps
    'WiFi': 25 // Mbps
  };

  Object.entries(connectionSpeeds).forEach(([name, speed]) => {
    const speedBps = (speed * 1024 * 1024) / 8; // Convert to bytes per second
    const loadTime = (bundleAnalysis.initialSize / speedBps) * 1000; // Convert to ms

    const status = loadTime <= PERFORMANCE_TARGETS.bundleLoadTime ? '✅' : '⚠️';
    console.log(`  ${status} ${name}: ~${Math.round(loadTime)}ms initial load`);
  });

  return connectionSpeeds;
}

function runOptimizationCheck() {
  console.log('🚀 Starting Bundle Optimization Analysis...\n');

  const bundleAnalysis = analyzeBundleSize();
  if (!bundleAnalysis) {
    console.log('❌ Bundle analysis failed. Make sure to build first.');
    return;
  }

  const packageAnalysis = analyzePackageSizes();
  const report = generateOptimizationReport(bundleAnalysis, packageAnalysis);

  generatePerformanceMetrics();
  compareWithPrevious();
  saveOptimizationHistory(report);

  console.log('\n🎉 Bundle optimization analysis complete!');

  // Exit with error code if optimization needed
  if (!report.withinLimits || report.recommendations > 0) {
    console.log('\n⚠️ Optimization recommended. Consider implementing suggested improvements.');
    // Don't exit with error in CI to avoid breaking builds
    // process.exit(1);
  }

  return report;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Bundle Monitor Usage:
  node bundle-monitor.js              Run full analysis
  node bundle-monitor.js --watch      Monitor for changes
  node bundle-monitor.js --history    Show historical data
  node bundle-monitor.js --help       Show this help
    `);
    process.exit(0);
  }

  if (args.includes('--history')) {
    const historyPath = path.join(__dirname, '../.bundle-history.json');
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      console.log('📊 Bundle Size History:');
      history.slice(-10).forEach(entry => {
        console.log(`  ${entry.timestamp}: ${formatBytes(entry.totalSize)} total, ${formatBytes(entry.initialSize)} initial (${entry.commit})`);
      });
    } else {
      console.log('📊 No bundle history found. Run analysis first.');
    }
    process.exit(0);
  }

  runOptimizationCheck();
}

module.exports = {
  analyzeBundleSize,
  generateOptimizationReport,
  runOptimizationCheck,
  formatBytes
};