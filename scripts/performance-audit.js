#!/usr/bin/env node

/**
 * Comprehensive performance audit script
 * Runs multiple performance tests and generates reports
 */

const fs = require('fs').promises
const path = require('path')
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')

// Performance thresholds
const THRESHOLDS = {
  mobile: {
    performance: 90,
    accessibility: 95,
    bestPractices: 95,
    seo: 90,
    lcp: 2500,
    fid: 100,
    cls: 0.1
  },
  desktop: {
    performance: 95,
    accessibility: 95,
    bestPractices: 95,
    seo: 90,
    lcp: 2000,
    fid: 100,
    cls: 0.1
  }
}

// Pages to audit
const PAGES_TO_AUDIT = [
  { path: '/', name: 'Homepage' },
  { path: '/models', name: 'Models' },
  { path: '/status', name: 'Status' },
  { path: '/benchmarks', name: 'Benchmarks' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/news', name: 'News' }
]

class PerformanceAuditor {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.results = {}
    this.reportDir = path.join(__dirname, '..', 'performance-reports')
  }

  async init() {
    // Create reports directory
    try {
      await fs.mkdir(this.reportDir, { recursive: true })
    } catch (error) {
      console.warn('Could not create reports directory:', error.message)
    }
  }

  async launchChrome() {
    return chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--remote-debugging-port=9222'
      ]
    })
  }

  async runLighthouseAudit(url, options = {}) {
    const chrome = await this.launchChrome()

    try {
      const defaultOptions = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
        ...options
      }

      const runnerResult = await lighthouse(url, defaultOptions)

      if (!runnerResult) {
        throw new Error(`Lighthouse audit failed for ${url}`)
      }

      return runnerResult.lhr
    } finally {
      await chrome.kill()
    }
  }

  async auditMobile(pagePath, pageName) {
    console.log(`📱 Auditing ${pageName} (Mobile)...`)

    const url = `${this.baseUrl}${pagePath}`

    const options = {
      emulatedFormFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4
      }
    }

    const report = await this.runLighthouseAudit(url, options)

    const scores = {
      performance: Math.round((report.categories.performance?.score || 0) * 100),
      accessibility: Math.round((report.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((report.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((report.categories.seo?.score || 0) * 100)
    }

    const coreWebVitals = {
      lcp: Math.round(report.audits['largest-contentful-paint']?.numericValue || 0),
      fid: Math.round(report.audits['max-potential-fid']?.numericValue || 0),
      cls: parseFloat((report.audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3))
    }

    const additionalMetrics = {
      fcp: Math.round(report.audits['first-contentful-paint']?.numericValue || 0),
      tti: Math.round(report.audits['interactive']?.numericValue || 0),
      si: Math.round(report.audits['speed-index']?.numericValue || 0),
      tbt: Math.round(report.audits['total-blocking-time']?.numericValue || 0)
    }

    return {
      device: 'mobile',
      page: pageName,
      path: pagePath,
      scores,
      coreWebVitals,
      additionalMetrics,
      timestamp: new Date().toISOString(),
      thresholds: THRESHOLDS.mobile
    }
  }

  async auditDesktop(pagePath, pageName) {
    console.log(`🖥️  Auditing ${pageName} (Desktop)...`)

    const url = `${this.baseUrl}${pagePath}`

    const options = {
      emulatedFormFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1
      }
    }

    const report = await this.runLighthouseAudit(url, options)

    const scores = {
      performance: Math.round((report.categories.performance?.score || 0) * 100),
      accessibility: Math.round((report.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((report.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((report.categories.seo?.score || 0) * 100)
    }

    const coreWebVitals = {
      lcp: Math.round(report.audits['largest-contentful-paint']?.numericValue || 0),
      fid: Math.round(report.audits['max-potential-fid']?.numericValue || 0),
      cls: parseFloat((report.audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3))
    }

    const additionalMetrics = {
      fcp: Math.round(report.audits['first-contentful-paint']?.numericValue || 0),
      tti: Math.round(report.audits['interactive']?.numericValue || 0),
      si: Math.round(report.audits['speed-index']?.numericValue || 0),
      tbt: Math.round(report.audits['total-blocking-time']?.numericValue || 0)
    }

    return {
      device: 'desktop',
      page: pageName,
      path: pagePath,
      scores,
      coreWebVitals,
      additionalMetrics,
      timestamp: new Date().toISOString(),
      thresholds: THRESHOLDS.desktop
    }
  }

  analyzeResults(results) {
    const analysis = {
      summary: {
        totalPages: results.length,
        passedMobile: 0,
        passedDesktop: 0,
        failedMobile: 0,
        failedDesktop: 0
      },
      recommendations: [],
      criticalIssues: []
    }

    results.forEach(result => {
      const { device, scores, coreWebVitals, thresholds, page } = result

      // Check if all scores meet thresholds
      const scoresPassed = (
        scores.performance >= thresholds.performance &&
        scores.accessibility >= thresholds.accessibility &&
        scores.bestPractices >= thresholds.bestPractices &&
        scores.seo >= thresholds.seo
      )

      // Check if Core Web Vitals meet thresholds
      const coreWebVitalsPassed = (
        coreWebVitals.lcp <= thresholds.lcp &&
        coreWebVitals.fid <= thresholds.fid &&
        coreWebVitals.cls <= thresholds.cls
      )

      const passed = scoresPassed && coreWebVitalsPassed

      if (passed) {
        if (device === 'mobile') analysis.summary.passedMobile++
        else analysis.summary.passedDesktop++
      } else {
        if (device === 'mobile') analysis.summary.failedMobile++
        else analysis.summary.failedDesktop++

        // Add specific recommendations
        if (scores.performance < thresholds.performance) {
          analysis.recommendations.push(`${page} (${device}): Performance score ${scores.performance} < ${thresholds.performance}`)
        }

        if (scores.accessibility < thresholds.accessibility) {
          analysis.criticalIssues.push(`${page} (${device}): Accessibility score ${scores.accessibility} < ${thresholds.accessibility}`)
        }

        if (coreWebVitals.lcp > thresholds.lcp) {
          analysis.recommendations.push(`${page} (${device}): LCP ${coreWebVitals.lcp}ms > ${thresholds.lcp}ms`)
        }

        if (coreWebVitals.cls > thresholds.cls) {
          analysis.recommendations.push(`${page} (${device}): CLS ${coreWebVitals.cls} > ${thresholds.cls}`)
        }
      }
    })

    return analysis
  }

  async generateReport(results, analysis) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(this.reportDir, `performance-report-${timestamp}.json`)

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        baseUrl: this.baseUrl,
        thresholds: THRESHOLDS,
        tool: 'lighthouse',
        version: '1.0.0'
      },
      summary: analysis.summary,
      results,
      analysis,
      recommendations: this.generateRecommendations(analysis)
    }

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

    console.log(`\n📊 Performance report generated: ${reportPath}`)

    return report
  }

  generateRecommendations(analysis) {
    const recommendations = []

    if (analysis.criticalIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Accessibility',
        description: 'Fix accessibility issues immediately',
        issues: analysis.criticalIssues
      })
    }

    if (analysis.recommendations.length > 0) {
      const performanceIssues = analysis.recommendations.filter(r => r.includes('Performance') || r.includes('LCP') || r.includes('CLS'))

      if (performanceIssues.length > 0) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Performance',
          description: 'Optimize performance metrics',
          issues: performanceIssues
        })
      }
    }

    // General recommendations based on common issues
    if (analysis.summary.failedMobile > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Mobile Optimization',
        description: 'Improve mobile performance',
        suggestions: [
          'Optimize images for mobile devices',
          'Reduce JavaScript bundle size',
          'Implement critical CSS inlining',
          'Add progressive loading for non-critical content'
        ]
      })
    }

    return recommendations
  }

  printSummary(analysis) {
    console.log('\n🎯 PERFORMANCE AUDIT SUMMARY')
    console.log('================================')

    const { summary } = analysis

    console.log(`📱 Mobile: ${summary.passedMobile}/${summary.passedMobile + summary.failedMobile} pages passed`)
    console.log(`🖥️  Desktop: ${summary.passedDesktop}/${summary.passedDesktop + summary.failedDesktop} pages passed`)

    if (analysis.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:')
      analysis.criticalIssues.forEach(issue => console.log(`  ❌ ${issue}`))
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:')
      analysis.recommendations.slice(0, 5).forEach(rec => console.log(`  ⚠️  ${rec}`))

      if (analysis.recommendations.length > 5) {
        console.log(`  ... and ${analysis.recommendations.length - 5} more (see full report)`)
      }
    }

    const overallSuccess = (
      summary.failedMobile === 0 &&
      summary.failedDesktop === 0 &&
      analysis.criticalIssues.length === 0
    )

    if (overallSuccess) {
      console.log('\n✅ ALL PERFORMANCE TARGETS MET!')
    } else {
      console.log('\n⚠️  Some performance targets not met. See recommendations above.')
    }

    return overallSuccess
  }

  async run() {
    console.log('🚀 Starting comprehensive performance audit...')
    console.log(`Base URL: ${this.baseUrl}`)

    await this.init()

    const results = []

    for (const { path: pagePath, name: pageName } of PAGES_TO_AUDIT) {
      try {
        // Audit mobile
        const mobileResult = await this.auditMobile(pagePath, pageName)
        results.push(mobileResult)

        // Audit desktop
        const desktopResult = await this.auditDesktop(pagePath, pageName)
        results.push(desktopResult)

        // Brief summary for this page
        console.log(`  📊 ${pageName} - Mobile: P${mobileResult.scores.performance} A${mobileResult.scores.accessibility} | Desktop: P${desktopResult.scores.performance} A${desktopResult.scores.accessibility}`)

      } catch (error) {
        console.error(`❌ Failed to audit ${pageName}:`, error.message)

        // Add failed result
        results.push({
          device: 'mobile',
          page: pageName,
          path: pagePath,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Analyze results
    const validResults = results.filter(r => !r.error)
    const analysis = this.analyzeResults(validResults)

    // Generate report
    const report = await this.generateReport(validResults, analysis)

    // Print summary
    const success = this.printSummary(analysis)

    // Exit with appropriate code
    process.exit(success ? 0 : 1)
  }
}

// Main execution
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  const auditor = new PerformanceAuditor(baseUrl)

  try {
    await auditor.run()
  } catch (error) {
    console.error('❌ Performance audit failed:', error.message)
    process.exit(1)
  }
}

// Only run if called directly
if (require.main === module) {
  main()
}

module.exports = { PerformanceAuditor }