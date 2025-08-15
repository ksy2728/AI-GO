import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      category: searchParams.get('category'),
      source: searchParams.get('source'),
      search: searchParams.get('search'),
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    // Try to read news data from JSON file
    try {
      const newsDataPath = path.join(process.cwd(), 'data', 'news-data.json')
      const newsDataRaw = await fs.readFile(newsDataPath, 'utf-8')
      const newsData = JSON.parse(newsDataRaw)
      
      let filteredArticles = newsData.articles
      
      // Apply filters
      if (filters.category) {
        filteredArticles = filteredArticles.filter((article: any) => 
          article.category === filters.category
        )
      }
      
      if (filters.source) {
        filteredArticles = filteredArticles.filter((article: any) => 
          article.source.toLowerCase() === filters.source?.toLowerCase()
        )
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredArticles = filteredArticles.filter((article: any) => 
          article.title.toLowerCase().includes(searchLower) ||
          article.summary.toLowerCase().includes(searchLower) ||
          article.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        )
      }
      
      // Sort by publishedAt date (most recent first)
      filteredArticles.sort((a: any, b: any) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      
      // Apply pagination
      const start = filters.offset
      const end = filters.offset + filters.limit
      const paginatedArticles = filteredArticles.slice(start, end)
      
      // Get unique categories and sources for filtering
      const categories = [...new Set(newsData.articles.map((a: any) => a.category))]
      const sources = [...new Set(newsData.articles.map((a: any) => a.source))]
      
      return NextResponse.json({
        articles: paginatedArticles,
        categories,
        sources,
        total: filteredArticles.length,
        limit: filters.limit,
        offset: filters.offset,
        timestamp: new Date().toISOString(),
        cached: false,
      })
    } catch (fileError) {
      console.warn('⚠️ Could not read news data file:', fileError)
      
      // Return empty results as fallback
      return NextResponse.json({
        articles: [],
        categories: [],
        sources: [],
        total: 0,
        limit: filters.limit,
        offset: filters.offset,
        timestamp: new Date().toISOString(),
        cached: false,
      })
    }
  } catch (error) {
    console.error('❌ Error fetching news:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch news data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}