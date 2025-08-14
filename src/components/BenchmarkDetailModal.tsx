'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  X, Trophy, TrendingUp, Calendar, BarChart, Award, Target, 
  Brain, Zap, Eye, CheckCircle, AlertCircle, InfoIcon,
  ExternalLink, Code, FileText, GitCommit
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

interface BenchmarkDetailModalProps {
  benchmark: BenchmarkResult | null
  onClose: () => void
}

export function BenchmarkDetailModal({ benchmark, onClose }: BenchmarkDetailModalProps) {
  if (!benchmark) return null

  const getCategoryIcon = (category: string): ReactNode => {
    switch (category) {
      case 'reasoning': return <Brain className="w-5 h-5" />
      case 'coding': return <Zap className="w-5 h-5" />
      case 'math': return <Target className="w-5 h-5" />
      case 'language': return <Award className="w-5 h-5" />
      case 'multimodal': return <Eye className="w-5 h-5" />
      default: return <BarChart className="w-5 h-5" />
    }
  }

  const getPerformanceLevel = (percentile: number) => {
    if (percentile >= 95) return { level: 'Exceptional', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    if (percentile >= 85) return { level: 'Excellent', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    if (percentile >= 70) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
    if (percentile >= 50) return { level: 'Average', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { level: 'Below Average', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  }

  const getBenchmarkDetails = (benchmarkName: string) => {
    const details = {
      'MMLU': {
        fullName: 'Massive Multitask Language Understanding',
        description: 'Tests knowledge across 57 academic subjects including mathematics, history, law, and more.',
        methodology: 'Multiple-choice questions spanning elementary to professional levels',
        samples: '15,908 questions',
        evaluationType: 'Zero-shot and few-shot evaluation',
        domains: ['Elementary Mathematics', 'World History', 'Computer Science', 'Law', 'Medicine', 'Philosophy'],
        difficulty: 'High',
        officialPaper: 'https://arxiv.org/abs/2009.03300'
      },
      'HumanEval': {
        fullName: 'Human Evaluation of Code Generation',
        description: 'Evaluates code generation capabilities through programming problems.',
        methodology: 'Generate Python functions from docstrings and test against unit tests',
        samples: '164 programming problems',
        evaluationType: 'Pass@k evaluation (k=1,10,100)',
        domains: ['Algorithms', 'Data Structures', 'String Processing', 'Mathematics', 'Logic'],
        difficulty: 'Medium to High',
        officialPaper: 'https://arxiv.org/abs/2107.03374'
      },
      'GSM8K': {
        fullName: 'Grade School Math 8K',
        description: 'Tests mathematical reasoning on grade school level math word problems.',
        methodology: 'Multi-step reasoning problems requiring arithmetic and logical thinking',
        samples: '8,500 problems',
        evaluationType: 'Exact match evaluation',
        domains: ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems', 'Logic'],
        difficulty: 'Medium',
        officialPaper: 'https://arxiv.org/abs/2110.14168'
      },
      'HellaSwag': {
        fullName: 'HellaSwag Commonsense Reasoning',
        description: 'Tests commonsense natural language inference.',
        methodology: 'Complete sentences with the most plausible continuation',
        samples: '70,000+ questions',
        evaluationType: 'Multiple choice accuracy',
        domains: ['Commonsense', 'Natural Language', 'Reasoning', 'Context Understanding'],
        difficulty: 'Medium',
        officialPaper: 'https://arxiv.org/abs/1905.07830'
      },
      'BLEU': {
        fullName: 'Bilingual Evaluation Understudy',
        description: 'Measures quality of machine-translated text.',
        methodology: 'N-gram precision between machine and reference translations',
        samples: 'Varies by dataset',
        evaluationType: 'BLEU-1 to BLEU-4 scores',
        domains: ['Translation', 'Language Generation', 'Text Quality'],
        difficulty: 'Medium',
        officialPaper: 'https://aclanthology.org/P02-1040/'
      },
      'VQA': {
        fullName: 'Visual Question Answering',
        description: 'Tests ability to answer questions about images.',
        methodology: 'Given an image and question, generate accurate answer',
        samples: '265,000+ questions',
        evaluationType: 'Accuracy metric with human evaluation',
        domains: ['Computer Vision', 'Natural Language', 'Multimodal', 'Reasoning'],
        difficulty: 'High',
        officialPaper: 'https://arxiv.org/abs/1505.00468'
      }
    }
    
    return details[benchmarkName as keyof typeof details] || {
      fullName: benchmarkName,
      description: 'Standardized benchmark for AI model evaluation.',
      methodology: 'Various evaluation methodologies',
      samples: 'Multiple test samples',
      evaluationType: 'Standard evaluation metrics',
      domains: ['General AI'],
      difficulty: 'Medium',
      officialPaper: '#'
    }
  }

  const performance = getPerformanceLevel(benchmark.percentile)
  const details = getBenchmarkDetails(benchmark.benchmarkName)
  const scorePercentage = (benchmark.score / benchmark.maxScore) * 100

  // Generate comparison data (mock)
  const getComparisonData = () => {
    const baseScore = benchmark.score
    return [
      { model: 'Top Performer', score: Math.min(benchmark.maxScore, baseScore + (Math.random() * 10) + 5), isTop: true },
      { model: benchmark.modelName, score: baseScore, isCurrent: true },
      { model: 'Average Performer', score: Math.max(0, baseScore - (Math.random() * 15) - 5), isAverage: true },
      { model: 'Bottom Performer', score: Math.max(0, baseScore - (Math.random() * 25) - 15), isBottom: true }
    ].sort((a, b) => b.score - a.score)
  }

  const comparisonData = getComparisonData()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getCategoryIcon(benchmark.category)}
              <h2 className="text-2xl font-bold text-gray-900">{benchmark.modelName}</h2>
              <Badge variant="outline" className="capitalize">{benchmark.category}</Badge>
            </div>
            <p className="text-gray-600">{benchmark.provider} • {benchmark.benchmarkName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Score Overview */}
          <div className={`${performance.bg} ${performance.border} border rounded-lg p-6`}>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {benchmark.score}
                {benchmark.benchmarkName === 'BLEU' ? '' : '%'}
                <span className="text-lg text-gray-500 ml-2">
                  / {benchmark.maxScore}{benchmark.benchmarkName === 'BLEU' ? '' : '%'}
                </span>
              </div>
              <Badge variant="default" className={`${performance.color} ${performance.bg} text-lg px-4 py-2`}>
                {performance.level}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">Score</div>
                <Progress value={scorePercentage} className="mb-2" />
                <div className="text-sm font-medium">{scorePercentage.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Percentile Rank</div>
                <Progress value={benchmark.percentile} className="mb-2" />
                <div className="text-sm font-medium">{benchmark.percentile}th</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Evaluation Date</div>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div className="text-sm font-medium">
                    {new Date(benchmark.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="w-5 h-5" />
                About {benchmark.benchmarkName}
              </CardTitle>
              <CardDescription>{details.fullName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{details.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Methodology</h4>
                  <p className="text-sm text-gray-600">{details.methodology}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Evaluation Type</h4>
                  <p className="text-sm text-gray-600">{details.evaluationType}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dataset Size</h4>
                  <p className="text-sm text-gray-600">{details.samples}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Difficulty</h4>
                  <Badge variant="outline">{details.difficulty}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Test Domains</h4>
                <div className="flex flex-wrap gap-2">
                  {details.domains.map(domain => (
                    <Badge key={domain} variant="secondary" className="text-xs">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>

              {details.officialPaper !== '#' && (
                <div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={details.officialPaper} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Read Official Paper
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Performance Comparison
              </CardTitle>
              <CardDescription>
                How {benchmark.modelName} performs against other models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.isCurrent && <Trophy className="w-4 h-4 text-yellow-500" />}
                        <span className={`text-sm ${item.isCurrent ? 'font-bold' : 'font-medium'}`}>
                          {item.model}
                        </span>
                        {item.isCurrent && <Badge variant="default" className="text-xs">You</Badge>}
                      </div>
                      <span className="text-sm font-medium">
                        {item.score.toFixed(1)}{benchmark.benchmarkName === 'BLEU' ? '' : '%'}
                      </span>
                    </div>
                    <Progress 
                      value={(item.score / benchmark.maxScore) * 100} 
                      className={`h-2 ${item.isCurrent ? 'border border-blue-200' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h5 className="font-medium">Strengths</h5>
                      <p className="text-sm text-gray-600">
                        {benchmark.percentile >= 90 
                          ? 'Exceptional performance in this benchmark category'
                          : benchmark.percentile >= 70 
                          ? 'Strong performance with room for improvement'
                          : 'Adequate performance, may benefit from specialized training'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <h5 className="font-medium">Context</h5>
                      <p className="text-sm text-gray-600">
                        This score represents performance as of {new Date(benchmark.date).toLocaleDateString()}. 
                        Model capabilities may have improved since evaluation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Percentile Breakdown</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Top 5%: {benchmark.percentile >= 95 ? '✓ Achieved' : 'Not achieved'}</div>
                      <div>• Top 15%: {benchmark.percentile >= 85 ? '✓ Achieved' : 'Not achieved'}</div>
                      <div>• Top 30%: {benchmark.percentile >= 70 ? '✓ Achieved' : 'Not achieved'}</div>
                      <div>• Top 50%: {benchmark.percentile >= 50 ? '✓ Achieved' : 'Not achieved'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}