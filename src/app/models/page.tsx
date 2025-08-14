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
import {
  Search,
  Filter,
  Server,
  Eye,
  Cpu,
  Globe,
  Calendar,
  ChevronRight
} from 'lucide-react'

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModality, setSelectedModality] = useState<string>('')

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        const response = await api.getModels({
          provider: selectedProvider || undefined,
          modality: selectedModality || undefined,
          limit: 50
        })
        setModels(response.models)
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [selectedProvider, selectedModality])

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const providers = Array.from(new Set(models.map(m => m.providerId)))
  const modalities = Array.from(new Set(models.flatMap(m => m.modalities)))

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
            <Badge variant="secondary" className="text-sm">
              {filteredModels.length} models
            </Badge>
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

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {model.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      by {model.providerId}
                    </CardDescription>
                  </div>
                  <Badge variant={model.isActive ? 'success' : 'secondary'}>
                    {model.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {model.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Cpu className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {model.contextWindow ? formatNumber(model.contextWindow) : 'N/A'} context window
                    </span>
                  </div>
                  
                  {model.modalities.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {model.modalities.slice(0, 3).map(modality => (
                          <Badge key={modality} variant="outline" className="text-xs">
                            {modality}
                          </Badge>
                        ))}
                        {model.modalities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{model.modalities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {model.releasedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        Released {new Date(model.releasedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-300">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  )
}