import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Disable caching for this route
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      model: searchParams.get('model'),
      provider: searchParams.get('provider'),
      benchmark: searchParams.get('benchmark'),
      category: searchParams.get('category'),
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    // Try to read benchmarks data from JSON file
    try {
      const benchmarksDataPath = path.join(process.cwd(), 'data', 'benchmarks-data.json')
      const benchmarksDataRaw = await fs.readFile(benchmarksDataPath, 'utf-8')
      const benchmarksData = JSON.parse(benchmarksDataRaw)
      
      let filteredBenchmarks = benchmarksData.benchmarks
      
      // Apply filters
      if (filters.model) {
        filteredBenchmarks = filteredBenchmarks.filter((b: any) => 
          b.modelName.toLowerCase().includes(filters.model?.toLowerCase())
        )
      }
      
      if (filters.provider) {
        filteredBenchmarks = filteredBenchmarks.filter((b: any) => 
          b.provider.toLowerCase() === filters.provider?.toLowerCase()
        )
      }
      
      if (filters.benchmark) {
        filteredBenchmarks = filteredBenchmarks.filter((b: any) => 
          b.benchmarkName.toLowerCase() === filters.benchmark?.toLowerCase()
        )
      }
      
      if (filters.category) {
        filteredBenchmarks = filteredBenchmarks.filter((b: any) => 
          b.category === filters.category
        )
      }
      
      // Sort by score (descending) and then by date
      filteredBenchmarks.sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      
      // Apply pagination
      const start = filters.offset
      const end = filters.offset + filters.limit
      const paginatedBenchmarks = filteredBenchmarks.slice(start, end)
      
      // Calculate leaderboard for each benchmark
      const benchmarkGroups: { [key: string]: any[] } = {}
      benchmarksData.benchmarks.forEach((b: any) => {
        if (!benchmarkGroups[b.benchmarkName]) {
          benchmarkGroups[b.benchmarkName] = []
        }
        benchmarkGroups[b.benchmarkName].push(b)
      })
      
      // Add ranking information
      const enrichedBenchmarks = paginatedBenchmarks.map((benchmark: any) => {
        const group = benchmarkGroups[benchmark.benchmarkName]
        const sortedGroup = group.sort((a: any, b: any) => b.score - a.score)
        const rank = sortedGroup.findIndex((b: any) => b.id === benchmark.id) + 1
        
        return {
          ...benchmark,
          rank,
          totalModels: sortedGroup.length
        }
      })
      
      return NextResponse.json({
        benchmarks: enrichedBenchmarks,
        suites: benchmarksData.benchmarkSuites,
        total: filteredBenchmarks.length,
        limit: filters.limit,
        offset: filters.offset,
        timestamp: new Date().toISOString(),
        cached: false,
      })
    } catch (fileError) {
      console.warn('⚠️ Could not read benchmarks data file:', fileError)
      
      // Return empty results as fallback
      return NextResponse.json({
        benchmarks: [],
        suites: [],
        total: 0,
        limit: filters.limit,
        offset: filters.offset,
        timestamp: new Date().toISOString(),
        cached: false,
      })
    }
  } catch (error) {
    console.error('❌ Error fetching benchmarks:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch benchmark data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}