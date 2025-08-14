'use client'

import { useState, useEffect } from 'react'
import { Model, ModelStatus, BenchmarkScore, Incident } from '@/types/models'
import { 
  X, Cpu, Globe, Calendar, DollarSign, Server, Activity, 
  FileText, Code, TrendingUp, AlertCircle, Clock, Zap,
  BarChart, MapPin, Shield, AlertTriangle, CheckCircle,
  XCircle, Timer, Database, Award
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useRealtime } from '@/hooks/useRealtime'

interface ModelDetailModalProps {
  model: Model | null
  onClose: () => void
}

export function ModelDetailModal({ model, onClose }: ModelDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { modelStatuses, connected } = useRealtime({
    subscribeToModels: model ? [model.id] : []
  })

  useEffect(() => {
    if (model) {
      setActiveTab('overview')
    }
  }, [model])

  if (!model) return null

  const currentStatus = modelStatuses[model.id] || model.status?.[0]
  const latestIncident = model.incidents?.[0]
  const benchmarks = model.benchmarkScores || []
  const endpoints = model.endpoints || []
  const pricing = model.pricing?.[0]

  // Calculate uptime percentage from incidents
  const calculateUptime = () => {
    if (!model.incidents || model.incidents.length === 0) return 99.9
    const now = Date.now()
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    let downtime = 0
    
    model.incidents.forEach(incident => {
      const start = new Date(incident.startedAt).getTime()
      const end = incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : now
      if (start >= thirtyDaysAgo) {
        downtime += (end - start)
      }
    })
    
    const totalTime = now - thirtyDaysAgo
    return Math.max(0, ((totalTime - downtime) / totalTime * 100)).toFixed(3)
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    const variants: Record<string, any> = {
      operational: 'success',
      degraded: 'warning',
      outage: 'destructive'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null
    const variants: Record<string, any> = {
      minor: 'secondary',
      major: 'warning',
      critical: 'destructive'
    }
    return <Badge variant={variants[severity] || 'secondary'}>{severity}</Badge>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
              {connected && (
                <Badge variant="outline" className="animate-pulse">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Live
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">by {model.provider?.name || model.providerId}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 w-full rounded-none border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6 mt-0">
              {/* Status Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Current Status</h3>
                  {getStatusBadge(currentStatus?.status)}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Availability</div>
                    <div className="text-2xl font-bold">
                      {currentStatus?.availability || 99.9}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">30-Day Uptime</div>
                    <div className="text-2xl font-bold">{calculateUptime()}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                    <div className="text-2xl font-bold">
                      {currentStatus?.errorRate?.toFixed(2) || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {model.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">About</h3>
                  <p className="text-gray-700">{model.description}</p>
                  {model.foundationModel && (
                    <p className="text-sm text-gray-600">
                      Foundation Model: <span className="font-medium">{model.foundationModel}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Specifications</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Cpu className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Context Window</div>
                        <div className="text-sm text-gray-600">
                          {model.contextWindow ? formatNumber(model.contextWindow) : 'N/A'} tokens
                        </div>
                      </div>
                    </div>

                    {model.maxOutputTokens && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Max Output</div>
                          <div className="text-sm text-gray-600">
                            {formatNumber(model.maxOutputTokens)} tokens
                          </div>
                        </div>
                      </div>
                    )}

                    {model.trainingCutoff && (
                      <div className="flex items-start gap-3">
                        <Database className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Training Cutoff</div>
                          <div className="text-sm text-gray-600">
                            {new Date(model.trainingCutoff).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {model.apiVersion && (
                      <div className="flex items-start gap-3">
                        <Code className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">API Version</div>
                          <div className="text-sm text-gray-600">{model.apiVersion}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Capabilities</h3>
                  
                  <div className="space-y-3">
                    {model.modalities && model.modalities.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Modalities</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.modalities.map(modality => (
                              <Badge key={modality} variant="outline" className="text-xs">
                                {modality}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {model.capabilities && model.capabilities.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Features</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.capabilities.map(capability => (
                              <Badge key={capability} variant="secondary" className="text-xs">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {model.releasedAt && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Released</div>
                          <div className="text-sm text-gray-600">
                            {new Date(model.releasedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {endpoints.length > 0 && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Available Regions</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {endpoints.map(endpoint => (
                              <Badge key={endpoint.id} variant="outline" className="text-xs">
                                {endpoint.region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deprecation Warning */}
              {(model.deprecatedAt || model.sunsetAt) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Deprecation Notice</h4>
                      {model.deprecatedAt && (
                        <p className="text-sm text-yellow-800 mt-1">
                          Deprecated on {new Date(model.deprecatedAt).toLocaleDateString()}
                        </p>
                      )}
                      {model.sunsetAt && (
                        <p className="text-sm text-yellow-800">
                          Will be sunset on {new Date(model.sunsetAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="p-6 space-y-6 mt-0">
              {currentStatus ? (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Latency Metrics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">P50 Latency</span>
                        </div>
                        <div className="text-2xl font-bold">{currentStatus.latencyP50}ms</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">P95 Latency</span>
                        </div>
                        <div className="text-2xl font-bold">{currentStatus.latencyP95}ms</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">P99 Latency</span>
                        </div>
                        <div className="text-2xl font-bold">{currentStatus.latencyP99}ms</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Throughput</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Requests per Minute</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatNumber(currentStatus.requestsPerMin)}
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium">Tokens per Minute</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">
                          {formatNumber(currentStatus.tokensPerMin)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Usage Metrics</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Current Load</span>
                          <span className="text-sm text-gray-600">{currentStatus.usage}%</span>
                        </div>
                        <Progress value={currentStatus.usage} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Error Rate</span>
                          <span className="text-sm text-gray-600">{currentStatus.errorRate.toFixed(2)}%</span>
                        </div>
                        <Progress value={currentStatus.errorRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No performance data available
                </div>
              )}
            </TabsContent>

            {/* Benchmarks Tab */}
            <TabsContent value="benchmarks" className="p-6 space-y-6 mt-0">
              {benchmarks.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Benchmark Scores</h3>
                  <div className="space-y-3">
                    {benchmarks.map(benchmark => (
                      <div key={benchmark.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{benchmark.suite?.name || benchmark.suiteId}</h4>
                            {benchmark.suite?.description && (
                              <p className="text-sm text-gray-600 mt-1">{benchmark.suite.description}</p>
                            )}
                          </div>
                          {benchmark.isOfficial && (
                            <Badge variant="success">Official</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <div className="text-sm text-gray-600">Score</div>
                            <div className="text-lg font-bold">
                              {benchmark.scoreRaw.toFixed(2)}
                              {benchmark.suite?.maxScore && (
                                <span className="text-sm text-gray-500">
                                  /{benchmark.suite.maxScore}
                                </span>
                              )}
                            </div>
                          </div>
                          {benchmark.percentile && (
                            <div>
                              <div className="text-sm text-gray-600">Percentile</div>
                              <div className="text-lg font-bold">{benchmark.percentile}%</div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-gray-600">Evaluated</div>
                            <div className="text-sm">
                              {new Date(benchmark.evaluationDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  No benchmark data available
                </div>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="p-6 space-y-6 mt-0">
              {pricing ? (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Token Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {pricing.inputPerMillion && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Input Tokens</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900">
                            ${pricing.inputPerMillion}
                            <span className="text-sm text-green-700 font-normal"> / 1M tokens</span>
                          </div>
                        </div>
                      )}
                      {pricing.outputPerMillion && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Output Tokens</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            ${pricing.outputPerMillion}
                            <span className="text-sm text-blue-700 font-normal"> / 1M tokens</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(pricing.imagePerUnit || pricing.audioPerMinute || pricing.videoPerMinute) && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Media Pricing</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {pricing.imagePerUnit && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm font-medium mb-1">Images</div>
                            <div className="text-lg font-bold text-purple-900">
                              ${pricing.imagePerUnit}
                              <span className="text-sm text-purple-700 font-normal"> / image</span>
                            </div>
                          </div>
                        )}
                        {pricing.audioPerMinute && (
                          <div className="bg-orange-50 rounded-lg p-4">
                            <div className="text-sm font-medium mb-1">Audio</div>
                            <div className="text-lg font-bold text-orange-900">
                              ${pricing.audioPerMinute}
                              <span className="text-sm text-orange-700 font-normal"> / minute</span>
                            </div>
                          </div>
                        )}
                        {pricing.videoPerMinute && (
                          <div className="bg-pink-50 rounded-lg p-4">
                            <div className="text-sm font-medium mb-1">Video</div>
                            <div className="text-lg font-bold text-pink-900">
                              ${pricing.videoPerMinute}
                              <span className="text-sm text-pink-700 font-normal"> / minute</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {pricing.fineTuningPerMillion && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Fine-tuning</h3>
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="text-lg font-bold text-indigo-900">
                          ${pricing.fineTuningPerMillion}
                          <span className="text-sm text-indigo-700 font-normal"> / 1M tokens</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <p>Currency: {pricing.currency}</p>
                    {pricing.region && <p>Region: {pricing.region}</p>}
                    {pricing.tier && <p>Tier: {pricing.tier}</p>}
                    <p>Effective from: {new Date(pricing.effectiveFrom).toLocaleDateString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  No pricing data available
                </div>
              )}
            </TabsContent>

            {/* Incidents Tab */}
            <TabsContent value="incidents" className="p-6 space-y-6 mt-0">
              {model.incidents && model.incidents.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Incident History</h3>
                  <div className="space-y-3">
                    {model.incidents.map(incident => (
                      <div key={incident.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{incident.title}</h4>
                          <div className="flex gap-2">
                            {getSeverityBadge(incident.severity)}
                            <Badge variant={incident.status === 'resolved' ? 'success' : 'warning'}>
                              {incident.status}
                            </Badge>
                          </div>
                        </div>
                        {incident.description && (
                          <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                        )}
                        {incident.impactDescription && (
                          <p className="text-sm text-gray-700 mb-3">
                            <strong>Impact:</strong> {incident.impactDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Started: {new Date(incident.startedAt).toLocaleString()}
                          </span>
                          {incident.resolvedAt && (
                            <span>
                              Resolved: {new Date(incident.resolvedAt).toLocaleString()}
                            </span>
                          )}
                          {incident.regions && incident.regions.length > 0 && (
                            <span>
                              Regions: {incident.regions.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium text-gray-700">No incidents reported</p>
                  <p className="text-sm mt-1">This model has been operating smoothly</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Model ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{model.slug}</code>
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}