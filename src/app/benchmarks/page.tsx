'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BenchmarkDetailModal } from '@/components/BenchmarkDetailModal'
import { formatNumber } from '@/lib/utils'
import {
  Search,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Award,
  Zap,
  Brain,
  Eye
} from 'lucide-react'

interface BenchmarkResult {
  id: string
  modelName: string
  provider: string
  benchmarkName: string
  score: number
  maxScore: number
  percentile: number
  date: string
  category: 'reasoning' | 'language' | 'coding' | 'math' | 'multimodal'
}

interface BenchmarkSuite {
  name: string
  description: string
  category: string
  maxScore: number
  unit: string
}

export default function BenchmarksPage() {
  const [results, setResults] = useState<BenchmarkResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('')
  const [selectedBenchmarkDetail, setSelectedBenchmarkDetail] = useState<BenchmarkResult | null>(null)

  const benchmarkSuites: BenchmarkSuite[] = [
    {
      name: 'MMLU',
      description: 'Massive Multitask Language Understanding',
      category: 'reasoning',
      maxScore: 100,
      unit: '%'
    },
    {
      name: 'HumanEval',
      description: 'Python Code Generation',
      category: 'coding',
      maxScore: 100,
      unit: '%'
    },
    {
      name: 'GSM8K',
      description: 'Grade School Math Problems',
      category: 'math',
      maxScore: 100,
      unit: '%'
    },
    {
      name: 'HellaSwag',
      description: 'Commonsense Reasoning',
      category: 'reasoning',
      maxScore: 100,
      unit: '%'
    },
    {
      name: 'BLEU',
      description: 'Translation Quality',
      category: 'language',
      maxScore: 100,
      unit: 'score'
    },
    {
      name: 'VQA',
      description: 'Visual Question Answering',
      category: 'multimodal',
      maxScore: 100,
      unit: '%'
    }
  ]

  useEffect(() => {
    const fetchBenchmarkResults = async () => {
      try {
        setLoading(true)
        // Fetch real benchmark data from API
        const response = await fetch('/api/v1/benchmarks?limit=100')
        const data = await response.json()
        
        if (data.benchmarks && Array.isArray(data.benchmarks)) {
          // Transform API data to match component interface
          const transformedResults: BenchmarkResult[] = data.benchmarks.map((item: any) => ({
            id: item.id,
            modelName: item.modelName,
            provider: item.provider,
            benchmarkName: item.benchmarkName,
            score: item.score,
            maxScore: item.maxScore || 100,
            percentile: item.percentile,
            date: item.date,
            category: item.category
          }))
          setResults(transformedResults)
        } else {
          console.warn('No benchmark data available from API')
          setResults([])
        }
      } catch (error) {
        console.error('Failed to fetch benchmark results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBenchmarkResults()
  }, [])

  const filteredResults = results.filter(result => {
    const matchesSearch = result.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.benchmarkName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || result.category === selectedCategory
    const matchesBenchmark = !selectedBenchmark || result.benchmarkName === selectedBenchmark
    return matchesSearch && matchesCategory && matchesBenchmark
  })

  const categories = Array.from(new Set(results.map(r => r.category)))
  const benchmarks = Array.from(new Set(results.map(r => r.benchmarkName)))

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reasoning': return <Brain className="w-4 h-4" />
      case 'coding': return <Zap className="w-4 h-4" />
      case 'math': return <Target className="w-4 h-4" />
      case 'language': return <Award className="w-4 h-4" />
      case 'multimodal': return <Eye className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getScoreColor = (percentile: number) => {
    if (percentile >= 95) return 'text-green-600 bg-green-50'
    if (percentile >= 85) return 'text-blue-600 bg-blue-50'
    if (percentile >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getRankIcon = (percentile: number) => {
    if (percentile >= 95) return <Trophy className="w-4 h-4 text-yellow-500" />
    if (percentile >= 85) return <TrendingUp className="w-4 h-4 text-green-500" />
    return <TrendingDown className="w-4 h-4 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
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
              <h1 className="text-3xl font-bold text-gray-900">AI Model Benchmarks</h1>
              <p className="text-gray-600 mt-2">
                Compare AI model performance across industry-standard benchmarks
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredResults.length} results
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Benchmark Suites Overview */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Benchmark Suites
              </CardTitle>
              <CardDescription>
                Industry-standard evaluation frameworks for AI model performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benchmarkSuites.map((suite) => (
                  <div key={suite.name} className="p-4 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(suite.category)}
                      <h4 className="font-semibold text-gray-900">{suite.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{suite.description}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {suite.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search models or benchmarks..."
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
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Benchmarks</option>
                {benchmarks.map(benchmark => (
                  <option key={benchmark} value={benchmark}>
                    {benchmark}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Benchmark Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result) => (
            <Card key={result.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {result.modelName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {result.provider} • {result.benchmarkName}
                    </CardDescription>
                  </div>
                  {getRankIcon(result.percentile)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-1 p-3 rounded-lg ${getScoreColor(result.percentile)}`}>
                    {result.score}
                    {result.benchmarkName === 'BLEU' ? '' : '%'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Score (max: {result.maxScore}{result.benchmarkName === 'BLEU' ? '' : '%'})
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Percentile Rank</span>
                    <span className="font-semibold">{result.percentile}th</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {result.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Test Date</span>
                    <span className="text-gray-900">
                      {new Date(result.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-blue-50 group-hover:border-blue-300"
                    onClick={() => setSelectedBenchmarkDetail(result)}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResults.length === 0 && !loading && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No benchmark results found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Benchmark Detail Modal */}
      <BenchmarkDetailModal
        benchmark={selectedBenchmarkDetail}
        onClose={() => setSelectedBenchmarkDetail(null)}
      />
    </div>
  )
}