export type Locale = 'en-US' | 'ko-KR' | 'ja-JP' | 'zh-CN' | 'es-ES' | 'fr-FR' | 'de-DE' | 'pt-BR' | 'it-IT' | 'ru-RU' | 'hi-IN'

export interface Provider {
  id: string
  slug: string
  name: string
  logoUrl?: string
  websiteUrl?: string
  statusPageUrl?: string
  documentationUrl?: string
  regions: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Model {
  id: string
  providerId: string
  slug: string
  name: string
  description?: string
  foundationModel?: string
  releasedAt?: string
  deprecatedAt?: string
  sunsetAt?: string
  modalities: string[]
  capabilities: string[]
  contextWindow?: number
  maxOutputTokens?: number
  trainingCutoff?: string
  apiVersion?: string
  isActive: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  
  // Relations
  provider?: Provider
  endpoints?: ModelEndpoint[]
  pricing?: Pricing[]
  benchmarkScores?: BenchmarkScore[]
  incidents?: Incident[]
  status?: ModelStatus[]
}

export interface ModelEndpoint {
  id: string
  modelId: string
  region: string
  endpointUrl: string
  isActive: boolean
  priority: number
  createdAt: string
}

export interface Pricing {
  id: string
  modelId: string
  tier: string
  region?: string
  currency: string
  inputPerMillion?: number
  outputPerMillion?: number
  imagePerUnit?: number
  audioPerMinute?: number
  videoPerMinute?: number
  fineTuningPerMillion?: number
  volumeDiscounts: any[]
  effectiveFrom: string
  effectiveTo?: string
  metadata: Record<string, any>
  createdAt: string
}

export interface BenchmarkSuite {
  id: string
  slug: string
  name: string
  description?: string
  category?: string
  version?: string
  evaluationType?: string
  maxScore?: number
  scoringMethod?: string
  metadata: Record<string, any>
  createdAt: string
}

export interface BenchmarkScore {
  id: string
  modelId: string
  suiteId: string
  scoreRaw: number
  scoreNormalized?: number
  percentile?: number
  evaluationDate: string
  evaluationCommit?: string
  configuration: Record<string, any>
  notes?: string
  isOfficial: boolean
  createdAt: string
  
  // Relations
  model?: Model
  suite?: BenchmarkSuite
}

export interface Incident {
  id: string
  modelId?: string
  providerId?: string
  regions: string[]
  severity: 'minor' | 'major' | 'critical'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  title: string
  description?: string
  impactDescription?: string
  startedAt: string
  identifiedAt?: string
  resolvedAt?: string
  postmortemUrl?: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ModelStatus {
  id: string
  modelId: string
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  latencyP50: number
  latencyP95: number
  latencyP99: number
  errorRate: number
  requestsPerMin: number
  tokensPerMin: number
  usage: number
  region?: string
  checkedAt: string
  createdAt: string
  updatedAt: string
  
  // Relations
  model?: Model
}

export interface ModelStats {
  totalModels: number
  activeModels: number
  providers: number
  avgAvailability: number
  operationalModels: number
}