import { UnifiedModelService } from './unified-models.service'
import { getProviderLogo } from '@/constants/providerLogos'
import { normalizeProviderName, type UnifiedModel } from '@/types/unified-models'

const TARGET_PROVIDER_MAP: Record<string, string> = {
  openai: 'OpenAI',
  xai: 'xAI',
  google: 'Google',
  anthropic: 'Anthropic'
}

export const DASHBOARD_TARGET_PROVIDER_SLUGS = Object.freeze(Object.keys(TARGET_PROVIDER_MAP)) as readonly string[]
export const DASHBOARD_TARGET_PROVIDER_NAMES = Object.freeze(Object.values(TARGET_PROVIDER_MAP)) as readonly string[]

const PROVIDER_CAPABILITIES: Record<string, string[]> = {
  openai: ['Text Generation', 'Vision', 'Advanced Reasoning', 'Code'],
  xai: ['Real-time Reasoning', 'Text Generation', 'Long Context'],
  google: ['Multimodal', 'Vision', 'Audio', 'Large Context'],
  anthropic: ['Text Generation', 'Safety Guardrails', 'Long Context', 'Code']
}

interface DashboardModelSelection {
  id: string
  rank: number
  name: string
  provider: string
  providerLogo: string | null
  status: 'operational' | 'degraded' | 'down'
  availability: number
  responseTime: number
  errorRate: number
  throughput: number
  description: string
  capabilities: string[]
  intelligenceIndex: number
  releasedAt?: string
  lastUpdated?: string
}

interface SelectionOptions {
  limit?: number
}

function parseTimestamp(value?: string | Date | null): number {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : 0
}

function getRecencyScore(model: UnifiedModel): number {
  const timestamps = [
    parseTimestamp(model.releasedAt),
    parseTimestamp(model.lastUpdated),
    parseTimestamp(model.dataLastVerified as string | Date | undefined),
    parseTimestamp(model.aa?.lastUpdated)
  ]
  return Math.max(...timestamps, 0)
}

function buildDescription(displayProvider: string, intelligence: number): string {
  const rounded = intelligence ? intelligence.toFixed(2) : 'N/A'
  return `${displayProvider}의 최신 주요 모델 (Intelligence Index ${rounded})`
}

function deriveCapabilities(providerSlug: string, model: UnifiedModel): string[] {
  if (Array.isArray(model.capabilities) && model.capabilities.length > 0) {
    return model.capabilities.slice(0, 5)
  }
  const fromMap = PROVIDER_CAPABILITIES[providerSlug]
  return fromMap ? [...fromMap] : ['Text Generation', 'Advanced Reasoning']
}

function computeAvailability(model: UnifiedModel): number {
  if (typeof model.availability === 'number') return Number(model.availability.toFixed(2))
  if (typeof model.db?.availability === 'number') return Number(model.db.availability.toFixed(2))
  return 99.4
}

function computeResponseTime(model: UnifiedModel): number {
  const latency = model.db?.latency
  if (latency?.p95) return Math.round(latency.p95)
  if (latency?.p50) return Math.round(latency.p50)
  if (typeof model.speed === 'number') {
    return Math.max(120, 420 - Math.round(model.speed))
  }
  return 250
}

function computeThroughput(model: UnifiedModel): number {
  if (typeof model.speed === 'number' && Number.isFinite(model.speed)) {
    return Math.max(150, Math.round(model.speed * 8))
  }
  return 850
}

export async function loadDashboardFeaturedModels(options: SelectionOptions = {}): Promise<DashboardModelSelection[]> {
  const { limit = 9 } = options

  const { models } = await UnifiedModelService.getAll({}, 1000, 0)
  if (!models || models.length === 0) {
    throw new Error('AA 모델 데이터를 불러오지 못했습니다.')
  }

  const seen = new Set<string>()
  const normalized: Array<DashboardModelSelection & { recency: number }> = []

  for (const model of models) {
    const providerSlug = model.provider ? normalizeProviderName(model.provider) : ''
    if (!providerSlug || !TARGET_PROVIDER_MAP[providerSlug]) {
      continue
    }

    const id = model.slug || model.id
    if (!id || seen.has(id)) continue
    seen.add(id)

    const displayProvider = TARGET_PROVIDER_MAP[providerSlug]
    const intelligence = Number(model.intelligence ?? model.aa?.intelligence ?? 0)

    normalized.push({
      id,
      rank: 0,
      name: model.name,
      provider: displayProvider,
      providerLogo: getProviderLogo(displayProvider) ?? null,
      status: 'operational',
      availability: computeAvailability(model),
      responseTime: computeResponseTime(model),
      errorRate: 0.02,
      throughput: computeThroughput(model),
      description: buildDescription(displayProvider, intelligence),
      capabilities: deriveCapabilities(providerSlug, model),
      intelligenceIndex: Number(intelligence.toFixed(2)),
      releasedAt: typeof model.releasedAt === 'string' ? model.releasedAt : undefined,
      lastUpdated: typeof model.lastUpdated === 'string' ? model.lastUpdated : undefined,
      recency: getRecencyScore(model)
    })
  }

  if (normalized.length === 0) {
    throw new Error('요구 조건에 맞는 모델이 없습니다.')
  }

  const sorted = normalized
    .sort((a, b) => {
      if (b.recency !== a.recency) return b.recency - a.recency
      if (b.intelligenceIndex !== a.intelligenceIndex) return b.intelligenceIndex - a.intelligenceIndex
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
    .map((model, index) => ({
      ...model,
      rank: index + 1
    }))

  return sorted
}
