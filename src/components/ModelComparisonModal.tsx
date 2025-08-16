'use client'

import { useState } from 'react'
import { Model, BenchmarkScore } from '@/types/models'
import { 
  X, Cpu, Globe, Calendar, DollarSign, Server, Activity, 
  FileText, Code, TrendingUp, AlertCircle, Clock, Zap,
  BarChart, MapPin, Shield, AlertTriangle, CheckCircle,
  XCircle, Timer, Database, Award, GitCompare, Eye
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ModelComparisonModalProps {
  models: Model[]
  onClose: () => void
}

interface ComparisonRow {
  label: string
  icon: React.ComponentType<any>
  getValue: (model: Model) => string | number | React.ReactNode
  getColor?: (value: any) => string
}

export function ModelComparisonModal({ models, onClose }: ModelComparisonModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!models || models.length < 2) return null

  const comparisonRows: ComparisonRow[] = [
    {
      label: 'Model Name',
      icon: Server,
      getValue: (model) => model.name
    },
    {
      label: 'Provider',
      icon: Globe,
      getValue: (model) => model.provider?.name || 'Unknown'
    },
    {
      label: 'Released',
      icon: Calendar,
      getValue: (model) => model.releasedAt ? new Date(model.releasedAt).toLocaleDateString() : 'N/A'
    },
    {
      label: 'Context Window',
      icon: Database,
      getValue: (model) => model.contextWindow ? formatNumber(model.contextWindow) + ' tokens' : 'N/A',
      getColor: (value) => {
        const num = parseInt(value.toString().replace(/[^0-9]/g, ''))
        if (num >= 128000) return 'text-green-600'
        if (num >= 32000) return 'text-yellow-600'
        return 'text-red-600'
      }
    },
    {
      label: 'Max Output',
      icon: FileText,
      getValue: (model) => model.maxOutputTokens ? formatNumber(model.maxOutputTokens) + ' tokens' : 'N/A',
      getColor: (value) => {
        const num = parseInt(value.toString().replace(/[^0-9]/g, ''))
        if (num >= 8192) return 'text-green-600'
        if (num >= 4096) return 'text-yellow-600'
        return 'text-red-600'
      }
    },
    {
      label: 'Modalities',
      icon: Eye,
      getValue: (model) => (
        <div className="flex flex-wrap gap-1">
          {model.modalities.map((modality, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {modality}
            </Badge>
          ))}
        </div>
      )
    },
    {
      label: 'Status',
      icon: Activity,
      getValue: (model) => {
        const status = model.status?.[0]
        if (!status) return <Badge variant="secondary">Unknown</Badge>
        
        const variant = status.status === 'operational' ? 'default' : 
                       status.status === 'degraded' ? 'secondary' : 'destructive'
        
        return <Badge variant={variant}>{status.status}</Badge>
      }
    }
  ]

  const getPricing = (model: Model) => {
    const pricing = model.pricing?.[0]
    if (!pricing) return null
    
    return {
      input: pricing.inputPerMillion,
      output: pricing.outputPerMillion,
      currency: pricing.currency
    }
  }

  const getBenchmarks = (model: Model) => {
    return model.benchmarkScores?.slice(0, 5) || []
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <GitCompare className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Model Comparison</h2>
            <Badge variant="outline">{models.length} models</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr className="border-b">
                      <th className="sticky left-0 z-10 bg-white text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Feature</th>
                      {models.map((model, idx) => (
                        <th key={idx} className="text-center p-2 sm:p-3 font-medium min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-lg font-bold">{model.name}</div>
                            <Badge variant="outline">{model.provider?.name}</Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white p-2 sm:p-3 font-medium text-xs sm:text-sm border-r">
                          <div className="flex items-center gap-2">
                            <row.icon className="h-4 w-4 text-gray-500" />
                            {row.label}
                          </div>
                        </td>
                        {models.map((model, modelIdx) => (
                          <td key={modelIdx} className="p-2 sm:p-3 text-center text-xs sm:text-sm">
                            <div className={row.getColor ? row.getColor(row.getValue(model)) : ''}>
                              {row.getValue(model)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid gap-4">
                {models.map((model, idx) => {
                  const pricing = getPricing(model)
                  return (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{model.name}</span>
                          <Badge variant="outline">{model.provider?.name}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pricing ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Input Cost</div>
                              <div className="text-2xl font-bold text-green-600">
                                ${pricing.input?.toFixed(2) || 'N/A'} / 1M tokens
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Output Cost</div>
                              <div className="text-2xl font-bold text-blue-600">
                                ${pricing.output?.toFixed(2) || 'N/A'} / 1M tokens
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Pricing information not available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="benchmarks" className="space-y-4">
              <div className="grid gap-4">
                {models.map((model, idx) => {
                  const benchmarks = getBenchmarks(model)
                  return (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{model.name}</span>
                          <Badge variant="outline">{benchmarks.length} benchmarks</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {benchmarks.length > 0 ? (
                          <div className="space-y-3">
                            {benchmarks.map((benchmark, benchIdx) => (
                              <div key={benchIdx} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <div className="font-medium">{benchmark.suite?.name || `Benchmark ${benchIdx + 1}`}</div>
                                  <div className="text-sm text-gray-600">{benchmark.suite?.category || 'General'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">{benchmark.scoreRaw}</div>
                                  {benchmark.percentile && (
                                    <div className="text-sm text-gray-600">{benchmark.percentile}th percentile</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No benchmark data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4">
              <div className="grid gap-4">
                {models.map((model, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{model.name}</span>
                        <Badge variant="outline">{model.capabilities?.length || 0} capabilities</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Modalities</div>
                          <div className="flex flex-wrap gap-2">
                            {model.modalities.map((modality, modalityIdx) => (
                              <Badge key={modalityIdx} variant="secondary">
                                {modality}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {model.capabilities && model.capabilities.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Capabilities</div>
                            <div className="flex flex-wrap gap-2">
                              {model.capabilities.map((capability, capIdx) => (
                                <Badge key={capIdx} variant="outline">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Context Window:</span>
                            <span className="ml-2 font-medium">
                              {model.contextWindow ? formatNumber(model.contextWindow) + ' tokens' : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max Output:</span>
                            <span className="ml-2 font-medium">
                              {model.maxOutputTokens ? formatNumber(model.maxOutputTokens) + ' tokens' : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Training Cutoff:</span>
                            <span className="ml-2 font-medium">
                              {model.trainingCutoff || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">API Version:</span>
                            <span className="ml-2 font-medium">
                              {model.apiVersion || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}