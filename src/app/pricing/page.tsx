'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PricingDetailModal } from '@/components/PricingDetailModal'
import { formatNumber } from '@/lib/utils'
import {
  Search,
  DollarSign,
  Calculator,
  ExternalLink,
  Info,
  Zap,
  Users,
  Shield,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PricingTier {
  id: string
  modelName: string
  provider: string
  tier: 'free' | 'hobby' | 'pro' | 'enterprise'
  inputPrice: number // per 1K tokens
  outputPrice: number // per 1K tokens
  currency: string
  contextWindow: number
  rateLimit: string
  features: string[]
  limitations: string[]
  availability: 'public' | 'waitlist' | 'private'
  lastUpdated: string
  url: string
}

interface UsageCalculator {
  monthlyInputTokens: number
  monthlyOutputTokens: number
  selectedModel: string
}

export default function PricingPage() {
  const [pricingData, setPricingData] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [selectedPricing, setSelectedPricing] = useState<PricingTier | null>(null)
  const [calculator, setCalculator] = useState<UsageCalculator>({
    monthlyInputTokens: 100000, // 100K tokens
    monthlyOutputTokens: 50000,  // 50K tokens
    selectedModel: ''
  })

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true)
        // Mock data for demonstration
        const mockPricing: PricingTier[] = [
          {
            id: '1',
            modelName: 'GPT-4 Turbo',
            provider: 'OpenAI',
            tier: 'pro',
            inputPrice: 0.01,
            outputPrice: 0.03,
            currency: 'USD',
            contextWindow: 128000,
            rateLimit: '500 RPM',
            features: [
              'Vision capabilities',
              'Function calling',
              'JSON mode',
              'Reproducible outputs',
              'DALL-E 3 integration'
            ],
            limitations: [
              'API access only',
              'Rate limits apply'
            ],
            availability: 'public',
            lastUpdated: '2024-04-09',
            url: 'https://openai.com/pricing'
          },
          {
            id: '2',
            modelName: 'GPT-3.5 Turbo',
            provider: 'OpenAI',
            tier: 'hobby',
            inputPrice: 0.0005,
            outputPrice: 0.0015,
            currency: 'USD',
            contextWindow: 16385,
            rateLimit: '3500 RPM',
            features: [
              'Fast responses',
              'Function calling',
              'JSON mode',
              'High availability'
            ],
            limitations: [
              'Lower capability than GPT-4',
              'No vision features'
            ],
            availability: 'public',
            lastUpdated: '2024-03-15',
            url: 'https://openai.com/pricing'
          },
          {
            id: '3',
            modelName: 'Claude 3 Opus',
            provider: 'Anthropic',
            tier: 'enterprise',
            inputPrice: 0.015,
            outputPrice: 0.075,
            currency: 'USD',
            contextWindow: 200000,
            rateLimit: '4000 TPM',
            features: [
              'Highest capability',
              'Long context',
              'Advanced reasoning',
              'Creative writing',
              'Enterprise features'
            ],
            limitations: [
              'Higher cost',
              'Regional availability'
            ],
            availability: 'public',
            lastUpdated: '2024-03-04',
            url: 'https://anthropic.com/pricing'
          },
          {
            id: '4',
            modelName: 'Claude 3 Sonnet',
            provider: 'Anthropic',
            tier: 'pro',
            inputPrice: 0.003,
            outputPrice: 0.015,
            currency: 'USD',
            contextWindow: 200000,
            rateLimit: '4000 TPM',
            features: [
              'Balanced performance',
              'Long context',
              'Fast responses',
              'Reliable accuracy'
            ],
            limitations: [
              'Lower capability than Opus'
            ],
            availability: 'public',
            lastUpdated: '2024-03-04',
            url: 'https://anthropic.com/pricing'
          },
          {
            id: '5',
            modelName: 'Claude 3 Haiku',
            provider: 'Anthropic',
            tier: 'hobby',
            inputPrice: 0.00025,
            outputPrice: 0.00125,
            currency: 'USD',
            contextWindow: 200000,
            rateLimit: '4000 TPM',
            features: [
              'Fastest responses',
              'Long context',
              'Cost-effective',
              'Good for simple tasks'
            ],
            limitations: [
              'Lower reasoning capability'
            ],
            availability: 'public',
            lastUpdated: '2024-03-04',
            url: 'https://anthropic.com/pricing'
          },
          {
            id: '6',
            modelName: 'Gemini Ultra',
            provider: 'Google',
            tier: 'enterprise',
            inputPrice: 0.0125,
            outputPrice: 0.0375,
            currency: 'USD',
            contextWindow: 1000000,
            rateLimit: '300 RPM',
            features: [
              'Massive context window',
              'Multimodal capabilities',
              'Advanced reasoning',
              'Code understanding'
            ],
            limitations: [
              'Limited availability',
              'Higher latency'
            ],
            availability: 'waitlist',
            lastUpdated: '2024-02-08',
            url: 'https://ai.google.dev/pricing'
          },
          {
            id: '7',
            modelName: 'Gemini Pro',
            provider: 'Google',
            tier: 'pro',
            inputPrice: 0.00025,
            outputPrice: 0.0005,
            currency: 'USD',
            contextWindow: 32000,
            rateLimit: '300 RPM',
            features: [
              'Good performance',
              'Affordable pricing',
              'Multimodal support',
              'Fast responses'
            ],
            limitations: [
              'Smaller context window',
              'Regional restrictions'
            ],
            availability: 'public',
            lastUpdated: '2024-01-25',
            url: 'https://ai.google.dev/pricing'
          },
          {
            id: '8',
            modelName: 'Llama 3 70B',
            provider: 'Meta',
            tier: 'free',
            inputPrice: 0,
            outputPrice: 0,
            currency: 'USD',
            contextWindow: 8192,
            rateLimit: 'Self-hosted',
            features: [
              'Open source',
              'No usage fees',
              'Commercial use allowed',
              'Customizable'
            ],
            limitations: [
              'Requires hosting',
              'Infrastructure costs',
              'Technical expertise needed'
            ],
            availability: 'public',
            lastUpdated: '2024-04-18',
            url: 'https://llama.meta.com'
          }
        ]
        setPricingData(mockPricing)
      } catch (error) {
        console.error('Failed to fetch pricing data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPricingData()
  }, [])

  const filteredPricing = pricingData.filter(pricing => {
    const matchesSearch = pricing.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pricing.provider.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProvider = !selectedProvider || pricing.provider === selectedProvider
    const matchesTier = !selectedTier || pricing.tier === selectedTier
    return matchesSearch && matchesProvider && matchesTier
  })

  const providers = Array.from(new Set(pricingData.map(p => p.provider)))
  const tiers = Array.from(new Set(pricingData.map(p => p.tier)))

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Star className="w-4 h-4" />
      case 'hobby': return <Users className="w-4 h-4" />
      case 'pro': return <Zap className="w-4 h-4" />
      case 'enterprise': return <Shield className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'hobby': return 'bg-blue-100 text-blue-800'
      case 'pro': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'public':
        return <Badge variant="success" className="text-xs">Available</Badge>
      case 'waitlist':
        return <Badge variant="warning" className="text-xs">Waitlist</Badge>
      case 'private':
        return <Badge variant="secondary" className="text-xs">Private</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }

  const calculateMonthlyCost = (pricing: PricingTier) => {
    if (pricing.inputPrice === 0 && pricing.outputPrice === 0) return 0
    const inputCost = (calculator.monthlyInputTokens / 1000) * pricing.inputPrice
    const outputCost = (calculator.monthlyOutputTokens / 1000) * pricing.outputPrice
    return inputCost + outputCost
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
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/80">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
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
              <h1 className="text-3xl font-bold text-gray-900">AI Model Pricing</h1>
              <p className="text-gray-600 mt-2">
                Compare pricing across different AI models and providers
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredPricing.length} models
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Calculator */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              Monthly Cost Calculator
            </CardTitle>
            <CardDescription>
              Estimate your monthly costs based on token usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Input Tokens
                  </label>
                  <Input
                    type="number"
                    value={calculator.monthlyInputTokens}
                    onChange={(e) => setCalculator(prev => ({
                      ...prev,
                      monthlyInputTokens: parseInt(e.target.value) || 0
                    }))}
                    className="bg-white/80"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated tokens for prompts and input text
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Output Tokens
                  </label>
                  <Input
                    type="number"
                    value={calculator.monthlyOutputTokens}
                    onChange={(e) => setCalculator(prev => ({
                      ...prev,
                      monthlyOutputTokens: parseInt(e.target.value) || 0
                    }))}
                    className="bg-white/80"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated tokens for generated responses
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Usage Guidelines</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• 1 token ≈ 0.75 words (English)</div>
                  <div>• 1K tokens ≈ 750 words</div>
                  <div>• Average page ≈ 500 words (667 tokens)</div>
                  <div>• Chat conversation ≈ 100-1000 tokens</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search models or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Tiers</option>
                {tiers.map(tier => (
                  <option key={tier} value={tier} className="capitalize">
                    {tier}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPricing.map((pricing) => {
            const monthlyCost = calculateMonthlyCost(pricing)
            return (
              <Card key={pricing.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle 
                        className="text-lg group-hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => setSelectedPricing(pricing)}
                      >
                        {pricing.modelName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {pricing.provider}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`text-xs ${getTierColor(pricing.tier)}`}>
                        {getTierIcon(pricing.tier)}
                        <span className="ml-1 capitalize">{pricing.tier}</span>
                      </Badge>
                      {getAvailabilityBadge(pricing.availability)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="text-center bg-gray-50/50 p-4 rounded-lg">
                    {pricing.inputPrice === 0 && pricing.outputPrice === 0 ? (
                      <div className="text-2xl font-bold text-green-600">FREE</div>
                    ) : (
                      <>
                        <div className="text-sm text-gray-600 mb-1">Per 1K tokens</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Input:</span>
                            <span className="font-semibold">${pricing.inputPrice}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Output:</span>
                            <span className="font-semibold">${pricing.outputPrice}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {monthlyCost > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-500">Est. Monthly Cost</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${monthlyCost.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Context Window</span>
                      <span className="font-semibold">{formatNumber(pricing.contextWindow)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rate Limit</span>
                      <span className="font-semibold">{pricing.rateLimit}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="text-gray-900">
                        {new Date(pricing.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm">Features</h5>
                    <div className="space-y-1">
                      {pricing.features.slice(0, 3).map(feature => (
                        <div key={feature} className="flex items-start gap-1 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                      {pricing.features.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{pricing.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Limitations */}
                  {pricing.limitations.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2 text-sm">Limitations</h5>
                      <div className="space-y-1">
                        {pricing.limitations.slice(0, 2).map(limitation => (
                          <div key={limitation} className="flex items-start gap-1 text-xs">
                            <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-blue-50 group-hover:border-blue-300"
                      onClick={() => setSelectedPricing(pricing)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Pricing Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredPricing.length === 0 && !loading && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pricing information found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pricing Notes */}
        <Card className="mt-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              Pricing Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">General Information</h4>
                <ul className="space-y-1">
                  <li>• Prices are per 1,000 tokens and subject to change</li>
                  <li>• Input tokens include prompts, context, and system messages</li>
                  <li>• Output tokens are generated response text</li>
                  <li>• Rate limits vary by subscription tier and usage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cost Optimization Tips</h4>
                <ul className="space-y-1">
                  <li>• Use shorter prompts when possible</li>
                  <li>• Consider model capabilities vs. cost trade-offs</li>
                  <li>• Monitor usage through provider dashboards</li>
                  <li>• Set spending limits and alerts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Detail Modal */}
      <PricingDetailModal
        pricing={selectedPricing}
        onClose={() => setSelectedPricing(null)}
      />
    </div>
  )
}