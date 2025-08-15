'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { NewsArticleModal } from '@/components/NewsArticleModal'
import { formatRelativeTime } from '@/lib/utils'
import {
  Search,
  Newspaper,
  ExternalLink,
  TrendingUp,
  Rocket,
  AlertCircle,
  Building,
  Users,
  Eye,
  Clock
} from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  author: string
  publishedAt: string
  category: 'release' | 'research' | 'funding' | 'partnership' | 'regulation' | 'market'
  tags: string[]
  url: string
  imageUrl?: string
  readTime: number
  views: number
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        // Fetch real news data from API
        const response = await fetch('/api/v1/news?limit=100')
        const data = await response.json()
        
        if (data.articles && Array.isArray(data.articles)) {
          // Transform API data to match component interface
          const transformedArticles: NewsArticle[] = data.articles.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            content: item.content,
            source: item.source,
            author: item.author,
            publishedAt: item.publishedAt,
            category: item.category,
            tags: item.tags || [],
            url: item.url || '#',
            imageUrl: '/api/placeholder/400/200', // Keep placeholder for now
            readTime: item.readTime || 5,
            views: item.views || 0
          }))
          setArticles(transformedArticles)
        } else {
          console.warn('No news data available from API')
          setArticles([])
        }
      } catch (error) {
        console.error('Failed to fetch news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNews, 300000)
    return () => clearInterval(interval)
  }, [])

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || article.category === selectedCategory
    const matchesSource = !selectedSource || article.source === selectedSource
    return matchesSearch && matchesCategory && matchesSource
  })

  const categories = Array.from(new Set(articles.map(a => a.category)))
  const sources = Array.from(new Set(articles.map(a => a.source)))

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'release': return <Rocket className="w-4 h-4" />
      case 'research': return <Eye className="w-4 h-4" />
      case 'funding': return <TrendingUp className="w-4 h-4" />
      case 'partnership': return <Users className="w-4 h-4" />
      case 'regulation': return <AlertCircle className="w-4 h-4" />
      case 'market': return <Building className="w-4 h-4" />
      default: return <Newspaper className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'release': return 'bg-green-100 text-green-800'
      case 'research': return 'bg-blue-100 text-blue-800'
      case 'funding': return 'bg-purple-100 text-purple-800'
      case 'partnership': return 'bg-orange-100 text-orange-800'
      case 'regulation': return 'bg-red-100 text-red-800'
      case 'market': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/80">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Industry News</h1>
              <p className="text-gray-600 mt-2">
                Latest developments and insights from the artificial intelligence industry
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {filteredArticles.length} articles
              </Badge>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Updates every 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search news, topics, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Sources</option>
                {sources.map(source => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Featured Article */}
        {filteredArticles.length > 0 && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <Badge variant="destructive" className="text-xs">FEATURED</Badge>
              </div>
              <CardTitle 
                className="text-2xl hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => setSelectedArticle(filteredArticles[0])}
              >
                {filteredArticles[0].title}
              </CardTitle>
              <CardDescription className="text-base">
                {filteredArticles[0].summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  {getCategoryIcon(filteredArticles[0].category)}
                  <Badge className={`text-xs ${getCategoryColor(filteredArticles[0].category)}`}>
                    {filteredArticles[0].category}
                  </Badge>
                </div>
                <span>{filteredArticles[0].source}</span>
                <span>{formatRelativeTime(filteredArticles[0].publishedAt)}</span>
                <span>{filteredArticles[0].readTime} min read</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{filteredArticles[0].views.toLocaleString()} views</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {filteredArticles[0].tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button 
                className="w-full sm:w-auto"
                onClick={() => setSelectedArticle(filteredArticles[0])}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Full Article
              </Button>
            </CardContent>
          </Card>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.slice(1).map((article) => (
            <Card key={article.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`text-xs ${getCategoryColor(article.category)}`}>
                    {getCategoryIcon(article.category)}
                    <span className="ml-1 capitalize">{article.category}</span>
                  </Badge>
                  <div className="text-xs text-gray-500">
                    {formatRelativeTime(article.publishedAt)}
                  </div>
                </div>
                <CardTitle 
                  className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium">{article.source}</span>
                  <span>{article.readTime} min read</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>by {article.author}</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{article.views.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-blue-50 group-hover:border-blue-300"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Read Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && !loading && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No news articles found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* News Article Modal */}
      <NewsArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  )
}