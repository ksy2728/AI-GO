'use client'

import { useState, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { formatNumber } from '@/lib/utils'
import { 
  X, ExternalLink, Calculator, TrendingUp, TrendingDown, 
  DollarSign, Zap, Clock, Users, Shield, Star, CheckCircle, 
  XCircle, BarChart3, PieChart, LineChart, Settings, 
  Calendar, Globe, Server, Cpu, HardDrive, Wifi,
  AlertTriangle, Info, Target, Award
} from 'lucide-react'

interface PricingTier {
  id: string
  modelName: string
  provider: string
  tier: 'free' | 'hobby' | 'pro' | 'enterprise'
  inputPrice: number
  outputPrice: number
  currency: string
  contextWindow: number
  rateLimit: string
  features: string[]
  limitations: string[]
  availability: 'public' | 'waitlist' | 'private'
  lastUpdated: string
  url: string
}

interface PricingDetailModalProps {
  pricing: PricingTier | null
  onClose: () => void
}

export function PricingDetailModal({ pricing, onClose }: PricingDetailModalProps) {
  const [customInputTokens, setCustomInputTokens] = useState(100000)
  const [customOutputTokens, setCustomOutputTokens] = useState(50000)
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly')

  if (!pricing) return null

  const getTierIcon = (tier: string): ReactNode => {
    switch (tier) {
      case 'free': return <Star className="w-5 h-5" />
      case 'hobby': return <Users className="w-5 h-5" />
      case 'pro': return <Zap className="w-5 h-5" />
      case 'enterprise': return <Shield className="w-5 h-5" />
      default: return <DollarSign className="w-5 h-5" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-green-600 bg-green-50 border-green-200'
      case 'hobby': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pro': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'enterprise': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const calculateCost = (inputTokens: number, outputTokens: number, timeframe: string) => {
    if (pricing.inputPrice === 0 && pricing.outputPrice === 0) return 0
    
    const inputCost = (inputTokens / 1000) * pricing.inputPrice
    const outputCost = (outputTokens / 1000) * pricing.outputPrice
    const totalCost = inputCost + outputCost
    
    switch (timeframe) {
      case 'daily': return totalCost / 30
      case 'monthly': return totalCost
      case 'yearly': return totalCost * 12
      default: return totalCost
    }
  }

  // Advanced pricing analysis
  const getAdvancedMetrics = () => {
    const baseCost = calculateCost(customInputTokens, customOutputTokens, 'monthly')
    const costPerToken = baseCost / (customInputTokens + customOutputTokens)
    const costPerWord = costPerToken * 1.33 // ~1.33 tokens per word
    
    return {
      baseCost,
      costPerToken: costPerToken * 1000, // per 1K tokens
      costPerWord: costPerWord * 1000, // per 1K words
      costEfficiencyScore: Math.max(0, Math.min(100, 100 - (baseCost * 10))), // 0-100 scale
      valueRating: pricing.tier === 'free' ? 100 : Math.max(0, 100 - (baseCost * 5))
    }
  }

  const metrics = getAdvancedMetrics()

  // Competitive analysis mock data
  const getCompetitiveAnalysis = () => {
    const competitors = [
      { name: 'GPT-4 Turbo', cost: 4.50, provider: 'OpenAI' },
      { name: 'Claude 3 Opus', cost: 8.25, provider: 'Anthropic' },
      { name: 'Claude 3 Sonnet', cost: 2.70, provider: 'Anthropic' },
      { name: 'Gemini Pro', cost: 0.38, provider: 'Google' },
      { name: pricing.modelName, cost: metrics.baseCost, provider: pricing.provider, isCurrent: true }
    ].sort((a, b) => a.cost - b.cost)

    return competitors
  }

  const competitiveData = getCompetitiveAnalysis()

  // Advanced features analysis
  const getAdvancedFeatures = () => {
    return {
      performance: {
        score: pricing.tier === 'enterprise' ? 95 : pricing.tier === 'pro' ? 85 : pricing.tier === 'hobby' ? 70 : 60,
        metrics: [
          { name: 'Response Speed', value: pricing.tier === 'enterprise' ? 98 : 85 },
          { name: 'Accuracy', value: pricing.tier === 'enterprise' ? 96 : 88 },
          { name: 'Consistency', value: pricing.tier === 'enterprise' ? 94 : 82 },
          { name: 'Context Handling', value: Math.min(100, (pricing.contextWindow / 2000)) }
        ]
      },
      scalability: {
        score: pricing.tier === 'enterprise' ? 90 : pricing.tier === 'pro' ? 75 : 60,
        features: [
          'Auto-scaling endpoints',
          'Load balancing',
          'Multi-region deployment',
          'Custom rate limits',
          'Priority support',
          'SLA guarantees'
        ]
      },
      security: {
        score: pricing.tier === 'enterprise' ? 98 : pricing.tier === 'pro' ? 85 : 70,
        features: [
          'End-to-end encryption',
          'SOC 2 compliance',
          'GDPR compliance',
          'Data residency options',
          'Audit logs',
          'SSO integration'
        ]
      }
    }
  }

  const advancedFeatures = getAdvancedFeatures()

  const handleExternalLink = () => {
    window.open(pricing.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-3">
              {getTierIcon(pricing.tier)}
              <Badge className={`${getTierColor(pricing.tier)} border`}>
                <span className="capitalize">{pricing.tier}</span>
              </Badge>
              <span className="text-sm text-gray-500">{pricing.provider}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{pricing.modelName}</h1>
            <p className="text-gray-600 mt-1">Advanced pricing analysis and features</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="calculator" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Cost Calculator
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Features
              </TabsTrigger>
              <TabsTrigger value="competitive" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Competitive
              </TabsTrigger>
            </TabsList>

            {/* Advanced Cost Calculator */}
            <TabsContent value="calculator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Custom Usage Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input Tokens
                      </label>
                      <Input
                        type="number"
                        value={customInputTokens}
                        onChange={(e) => setCustomInputTokens(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Tokens
                      </label>
                      <Input
                        type="number"
                        value={customOutputTokens}
                        onChange={(e) => setCustomOutputTokens(parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeframe
                      </label>
                      <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Input cost:</span>
                          <span>${((customInputTokens / 1000) * pricing.inputPrice).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Output cost:</span>
                          <span>${((customOutputTokens / 1000) * pricing.outputPrice).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total {selectedTimeframe}:</span>
                          <span>${calculateCost(customInputTokens, customOutputTokens, selectedTimeframe).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Usage Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: 'Light Usage', input: 10000, output: 5000, desc: 'Personal projects, learning' },
                        { name: 'Medium Usage', input: 100000, output: 50000, desc: 'Small business, prototypes' },
                        { name: 'Heavy Usage', input: 500000, output: 250000, desc: 'Production apps, high volume' },
                        { name: 'Enterprise', input: 2000000, output: 1000000, desc: 'Large scale operations' }
                      ].map(scenario => (
                        <div key={scenario.name} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <h5 className="font-medium">{scenario.name}</h5>
                            <span className="text-sm font-semibold text-blue-600">
                              ${calculateCost(scenario.input, scenario.output, 'monthly').toFixed(2)}/month
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{scenario.desc}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatNumber(scenario.input + scenario.output)} tokens/month
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Analysis */}
            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Cost Efficiency Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Cost Efficiency Score</span>
                        <span className="text-sm font-semibold">{metrics.costEfficiencyScore.toFixed(0)}/100</span>
                      </div>
                      <Progress value={metrics.costEfficiencyScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Value Rating</span>
                        <span className="text-sm font-semibold">{metrics.valueRating.toFixed(0)}/100</span>
                      </div>
                      <Progress value={metrics.valueRating} className="h-2" />
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Cost per 1K tokens:</span>
                        <span className="font-medium">${metrics.costPerToken.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cost per 1K words:</span>
                        <span className="font-medium">${metrics.costPerWord.toFixed(4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Model Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Context Window:</span>
                        <div className="font-medium">{formatNumber(pricing.contextWindow)} tokens</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Rate Limit:</span>
                        <div className="font-medium">{pricing.rateLimit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Availability:</span>
                        <div className="font-medium capitalize">{pricing.availability}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Updated:</span>
                        <div className="font-medium">{new Date(pricing.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Features */}
            <TabsContent value="features" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {advancedFeatures.performance.score}/100
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                      
                      {advancedFeatures.performance.metrics.map(metric => (
                        <div key={metric.name}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">{metric.name}</span>
                            <span className="text-sm font-medium">{metric.value}%</span>
                          </div>
                          <Progress value={metric.value} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      Scalability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {advancedFeatures.scalability.score}/100
                        </div>
                        <div className="text-sm text-gray-600">Scalability Score</div>
                      </div>
                      
                      <div className="space-y-2">
                        {advancedFeatures.scalability.features.map(feature => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {advancedFeatures.security.score}/100
                        </div>
                        <div className="text-sm text-gray-600">Security Score</div>
                      </div>
                      
                      <div className="space-y-2">
                        {advancedFeatures.security.features.map(feature => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-purple-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Complete Features and Limitations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      All Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pricing.features.map(feature => (
                        <div key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Limitations & Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pricing.limitations.map(limitation => (
                        <div key={limitation} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Competitive Analysis */}
            <TabsContent value="competitive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Cost Comparison (Monthly Estimate)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitiveData.map((competitor, index) => (
                      <div key={competitor.name} className={`p-3 rounded-lg ${competitor.isCurrent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-green-500 text-white' : 
                              index === 1 ? 'bg-yellow-500 text-white' : 
                              index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-400 text-white'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <div className={`font-medium ${competitor.isCurrent ? 'text-blue-900' : ''}`}>
                                {competitor.name}
                                {competitor.isCurrent && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Current</span>}
                              </div>
                              <div className="text-sm text-gray-600">{competitor.provider}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${competitor.isCurrent ? 'text-blue-600' : ''}`}>
                              ${competitor.cost.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">per month</div>
                          </div>
                        </div>
                        {competitor.isCurrent && (
                          <div className="mt-2 text-sm text-blue-700">
                            Based on {formatNumber(customInputTokens + customOutputTokens)} tokens/month usage
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Last updated: {new Date(pricing.lastUpdated).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExternalLink}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Official Pricing
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}