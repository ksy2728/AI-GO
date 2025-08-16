'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { Model } from '@/types/models'
import { getStatusColor, formatNumber } from '@/lib/utils'
import { ModelDetailModal } from '@/components/ModelDetailModal'
import { ModelComparisonModal } from '@/components/ModelComparisonModal'
import {
  Search,
  Server,
  Eye,
  ChevronRight,
  GitCompare,
  Plus,
  Minus
} from 'lucide-react'

// Featured models that should appear first
const FEATURED_MODELS = ['GPT-5', 'o3', 'o3-mini', 'GPT-4.5', 'gpt-oss-120b', 'gpt-oss-20b', 
  'Claude-3-Opus', 'Claude-3.5-Sonnet', 'Gemini-2.0-Flash', 'Gemini-2.0-Pro', 'Llama-3.3-70B'];

// Major providers that should be prioritized
const MAJOR_PROVIDERS = ['openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon'];

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModality, setSelectedModality] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedForComparison, setSelectedForComparison] = useState<Model[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [showAllModels, setShowAllModels] = useState(false)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        const response = await api.getModels({
          provider: selectedProvider || undefined,
          modality: selectedModality || undefined,
          limit: 50
        })
        // Sort models with featured ones first
        const sortedModels = response.models.sort((a, b) => {
          // 1. Featured models at the top
          const aFeatured = FEATURED_MODELS.includes(a.name);
          const bFeatured = FEATURED_MODELS.includes(b.name);
          if (aFeatured && !bFeatured) return -1;
          if (!aFeatured && bFeatured) return 1;
          
          // 2. Major providers next
          const aProviderIndex = MAJOR_PROVIDERS.indexOf(a.provider?.id || a.providerId || '');
          const bProviderIndex = MAJOR_PROVIDERS.indexOf(b.provider?.id || b.providerId || '');
          const aMajor = aProviderIndex !== -1;
          const bMajor = bProviderIndex !== -1;
          if (aMajor && !bMajor) return -1;
          if (!aMajor && bMajor) return 1;
          
          // 3. Unknown status goes to the bottom
          const aStatus = Array.isArray(a.status) ? a.status[0] : a.status;
          const bStatus = Array.isArray(b.status) ? b.status[0] : b.status;
          const aUnknown = !aStatus;
          const bUnknown = !bStatus;
          if (!aUnknown && bUnknown) return -1;
          if (aUnknown && !bUnknown) return 1;
          
          // 4. Alphabetical by name
          return a.name.localeCompare(b.name);
        });
        
        setModels(sortedModels)
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [selectedProvider, selectedModality])

  // Filter models based on search and exclude unknown status if not showing all
  let filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If not showing all, filter out unknown status and non-major providers
    if (!showAllModels && !searchQuery) {
      const isMajorProvider = MAJOR_PROVIDERS.includes(model.provider?.id || model.providerId || '');
      const modelStatus = Array.isArray(model.status) ? model.status[0] : model.status;
      const hasKnownStatus = !!modelStatus;
      return matchesSearch && isMajorProvider && hasKnownStatus;
    }
    
    return matchesSearch;
  });
  
  // Limit to 30 models initially unless showing all
  const displayModels = showAllModels || searchQuery ? filteredModels : filteredModels.slice(0, 30)

  const providers = Array.from(new Set(models.map(m => m.provider?.name || m.providerId).filter(Boolean)))
  const modalities = Array.from(new Set(models.flatMap(m => m.modalities || [])))

  const toggleModelForComparison = (model: Model) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.find(m => m.id === model.id)
      if (isSelected) {
        return prev.filter(m => m.id !== model.id)
      } else if (prev.length < 4) { // Max 4 models for comparison
        return [...prev, model]
      }
      return prev
    })
  }

  const isSelectedForComparison = (model: Model) => {
    return selectedForComparison.find(m => m.id === model.id) !== undefined
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
              <h1 className="text-3xl font-bold text-gray-900">AI Models</h1>
              <p className="text-gray-600 mt-2">
                Browse and compare AI models from leading providers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {filteredModels.length} models
              </Badge>
              {selectedForComparison.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {selectedForComparison.length} selected for comparison
                  </Badge>
                  <Button
                    onClick={() => setShowComparison(true)}
                    disabled={selectedForComparison.length < 2}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    Compare Models
                  </Button>
                </div>
              )}
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
                placeholder="Search models..."
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
                value={selectedModality}
                onChange={(e) => setSelectedModality(e.target.value)}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Modalities</option>
                {modalities.map(modality => (
                  <option key={modality} value={modality}>{modality}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Instructions */}
        {selectedForComparison.length === 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <GitCompare className="w-5 h-5" />
              <span className="font-medium">Model Comparison</span>
            </div>
            <p className="text-blue-600 text-sm">
              Select 2-4 models using the + buttons to compare their specifications, pricing, and benchmarks side-by-side.
            </p>
          </div>
        )}

        {/* Show featured models indicator */}
        {!showAllModels && !searchQuery && displayModels.length < filteredModels.length && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">🔥 Showing Featured Models</h3>
                <p className="text-purple-700 text-sm">
                  Displaying {displayModels.length} featured and major provider models. 
                  {filteredModels.length - displayModels.length} additional models available.
                </p>
              </div>
              <Button
                onClick={() => setShowAllModels(true)}
                variant="outline"
                className="bg-white hover:bg-purple-50 border-purple-300"
              >
                Show All {filteredModels.length} Models
              </Button>
            </div>
          </div>
        )}

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayModels.map((model) => {
            const isFeatured = FEATURED_MODELS.includes(model.name);
            const isLatest = ['GPT-5', 'o3', 'o3-mini', 'GPT-4.5', 'gpt-oss-120b', 'gpt-oss-20b'].includes(model.name);
            const isSelected = isSelectedForComparison(model)
            return (
            <Card key={model.id} className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 group relative ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={`absolute top-4 right-4 z-10 w-8 h-8 p-0 ${
                      isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleModelForComparison(model)
                    }}
                    disabled={!isSelected && selectedForComparison.length >= 4}
                  >
                    {isSelected ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {model.name}
                      </CardTitle>
                      {isLatest && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">
                          NEW
                        </Badge>
                      )}
                      {isFeatured && !isLatest && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                          FEATURED
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      by {model.provider?.name || model.providerId}
                    </CardDescription>
                  </div>
                  <Badge variant={model.isActive ? 'success' : 'secondary'}>
                    {model.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {isSelected && (
                  <Badge variant="default" className="mt-2 bg-blue-600">
                    Selected for comparison
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {model.description || 'No description available'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {model.modalities && model.modalities.length > 0 ? (
                    <>
                      {model.modalities.slice(0, 2).map(modality => (
                        <Badge key={modality} variant="outline" className="text-xs">
                          {modality}
                        </Badge>
                      ))}
                      {model.modalities.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{model.modalities.length - 2} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      No modalities
                    </Badge>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-blue-50 group-hover:border-blue-300"
                    onClick={() => setSelectedModel(model)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                    <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>

        {filteredModels.length === 0 && !loading && (
          <div className="text-center py-12">
            <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Model Detail Modal */}
      <ModelDetailModal 
        model={selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />

      {/* Model Comparison Modal */}
      {showComparison && selectedForComparison.length >= 2 && (
        <ModelComparisonModal 
          models={selectedForComparison}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  )
}