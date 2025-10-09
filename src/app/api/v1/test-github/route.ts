import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: []
  }

  // Test 1: Check environment variables
  results.tests.push({
    name: 'Environment Variables',
    github_repo: process.env.GITHUB_REPO || 'NOT_SET',
    github_branch: process.env.GITHUB_BRANCH || 'NOT_SET',
    github_owner: process.env.GITHUB_OWNER || 'NOT_SET',
    node_env: process.env.NODE_ENV
  })

  // Test 2: Build GitHub URL
  const repo = process.env.GITHUB_REPO || 'ksy2728/AI-GO'
  const branch = process.env.GITHUB_BRANCH || 'master'
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/data/models.json`
  
  results.tests.push({
    name: 'GitHub URL',
    url: url
  })

  // Test 3: Try to fetch from GitHub
  try {
    console.log('Attempting to fetch from:', url)
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })
    
    results.tests.push({
      name: 'GitHub Fetch',
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      }
    })

    if (response.ok) {
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        results.tests.push({
          name: 'JSON Parse',
          success: true,
          dataType: typeof data,
          isArray: Array.isArray(data),
          hasModels: !!data.models,
          modelsCount: data.models?.length || (Array.isArray(data) ? data.length : 0)
        })
      } catch (parseError: any) {
        results.tests.push({
          name: 'JSON Parse',
          success: false,
          error: parseError.message,
          textLength: text.length,
          firstChars: text.substring(0, 100)
        })
      }
    }
  } catch (fetchError: any) {
    results.tests.push({
      name: 'GitHub Fetch',
      success: false,
      error: fetchError.message,
      errorType: fetchError.constructor.name,
      stack: fetchError.stack?.split('\n').slice(0, 3)
    })
  }

  // Test 4: Check if GitHubDataService is accessible
  try {
    const { GitHubDataService } = await import('@/services/github-data.service')
    results.tests.push({
      name: 'GitHubDataService',
      imported: true,
      hasMethods: {
        getAllData: typeof GitHubDataService.getAllData === 'function',
        getAllModels: typeof GitHubDataService.getAllModels === 'function'
      }
    })
    
    // Try to use the service
    try {
      const data = await GitHubDataService.getAllData()
      results.tests.push({
        name: 'GitHubDataService.getAllData',
        success: true,
        hasModels: !!data.models,
        modelsCount: data.models?.length || 0,
        hasStatistics: !!data.statistics
      })
    } catch (serviceError: any) {
      results.tests.push({
        name: 'GitHubDataService.getAllData',
        success: false,
        error: serviceError.message
      })
    }
  } catch (importError: any) {
    results.tests.push({
      name: 'GitHubDataService Import',
      success: false,
      error: importError.message
    })
  }

  return NextResponse.json(results, { status: 200 })
}