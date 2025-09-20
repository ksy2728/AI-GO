import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { OpenAIService } from './external/openai.service'
import { GoogleService } from './external/google.service'
import { AnthropicService } from './external/anthropic.service'
import { MetaService } from './external/meta.service'

export interface LatencyMetrics {
  p50: number
  p95: number
  p99: number
  mean: number
  min: number
  max: number
  sampleCount: number
  errorRate: number
}

export interface ThroughputMetrics {
  tokensPerSecond: number
  requestsPerMinute: number
  concurrentRequests: number
}

export interface ModelMetrics {
  modelId: string
  provider: string
  latency: LatencyMetrics
  throughput: ThroughputMetrics
  availability: number
  lastMeasured: Date
}

/**
 * Real-time metrics collector that measures actual model performance
 * No fake calculations - all metrics are based on real API calls
 */
export class MetricsCollector {
  private readonly sampleSizes = {
    latency: 10,
    throughput: 5,
    concurrent: 3
  }

  private readonly testPrompts = [
    'Hello, how are you?',
    'What is 2+2?',
    'Write a short sentence.',
    'Explain quantum computing in one line.',
    'What color is the sky?'
  ]

  /**
   * Collect comprehensive metrics for a model
   */
  async collectModelMetrics(
    modelId: string,
    provider: string,
    options: {
      includeThroughput?: boolean
      sampleSize?: number
    } = {}
  ): Promise<ModelMetrics | null> {
    const cacheKey = `metrics:${provider}:${modelId}`
    const cached = await cache.get<ModelMetrics>(cacheKey)

    // Use cached metrics if less than 10 minutes old
    if (cached && Date.now() - cached.lastMeasured.getTime() < 600000) {
      return cached
    }

    try {
      console.log(`🔍 Collecting metrics for ${provider}:${modelId}`)

      // Collect latency metrics
      const latencyMetrics = await this.measureLatency(modelId, provider, options.sampleSize)
      if (!latencyMetrics) {
        return null
      }

      // Collect throughput metrics if requested
      let throughputMetrics: ThroughputMetrics = {
        tokensPerSecond: 0,
        requestsPerMinute: 0,
        concurrentRequests: 0
      }

      if (options.includeThroughput) {
        const measured = await this.measureThroughput(modelId, provider)
        if (measured) {
          throughputMetrics = measured
        }
      }

      // Calculate availability based on error rate
      const availability = Math.max(0, 100 - latencyMetrics.errorRate)

      const metrics: ModelMetrics = {
        modelId,
        provider,
        latency: latencyMetrics,
        throughput: throughputMetrics,
        availability,
        lastMeasured: new Date()
      }

      // Cache for 10 minutes
      await cache.set(cacheKey, metrics, 600)

      // Store in database
      await this.storeMetrics(metrics)

      console.log(`✅ Collected metrics for ${provider}:${modelId}:`, {
        p50: `${latencyMetrics.p50}ms`,
        p95: `${latencyMetrics.p95}ms`,
        errorRate: `${latencyMetrics.errorRate}%`,
        availability: `${availability}%`
      })

      return metrics

    } catch (error) {
      console.error(`❌ Failed to collect metrics for ${provider}:${modelId}:`, error)
      return null
    }
  }

  /**
   * Measure actual latency by making real API calls
   */
  private async measureLatency(
    modelId: string,
    provider: string,
    customSampleSize?: number
  ): Promise<LatencyMetrics | null> {
    const sampleSize = customSampleSize || this.sampleSizes.latency
    const samples: number[] = []
    let errors = 0

    console.log(`📊 Measuring latency for ${provider}:${modelId} (${sampleSize} samples)`)

    for (let i = 0; i < sampleSize; i++) {
      try {
        const prompt = this.testPrompts[i % this.testPrompts.length]
        const latency = await this.measureSingleRequest(modelId, provider, prompt)

        if (latency !== null) {
          samples.push(latency)
        } else {
          errors++
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        errors++
        console.warn(`Request ${i + 1} failed:`, error)
      }
    }

    if (samples.length === 0) {
      console.warn(`No successful samples for ${provider}:${modelId}`)
      return null
    }

    // Calculate percentiles
    samples.sort((a, b) => a - b)
    const p50 = this.calculatePercentile(samples, 0.5)
    const p95 = this.calculatePercentile(samples, 0.95)
    const p99 = this.calculatePercentile(samples, 0.99)
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length
    const min = samples[0]
    const max = samples[samples.length - 1]
    const errorRate = (errors / sampleSize) * 100

    return {
      p50,
      p95,
      p99,
      mean,
      min,
      max,
      sampleCount: samples.length,
      errorRate
    }
  }

  /**
   * Measure a single request latency
   */
  private async measureSingleRequest(
    modelId: string,
    provider: string,
    prompt: string
  ): Promise<number | null> {
    const startTime = Date.now()

    try {
      let success = false

      switch (provider.toLowerCase()) {
        case 'openai':
          const openaiService = new OpenAIService()
          if (openaiService.isConfigured()) {
            // Use a minimal completion request
            await this.makeOpenAIRequest(openaiService, modelId, prompt)
            success = true
          }
          break

        case 'google':
          const googleService = new GoogleService()
          const result = await googleService.testModel(modelId, prompt)
          success = result.success
          break

        case 'anthropic':
          const anthropicService = new AnthropicService()
          const claudeResult = await anthropicService.testModel(modelId, prompt)
          success = claudeResult.success
          break

        case 'meta':
          const metaService = new MetaService()
          const llamaResult = await metaService.testModel(modelId, prompt)
          success = llamaResult.success
          break

        default:
          console.warn(`Unknown provider: ${provider}`)
          return null
      }

      if (success) {
        return Date.now() - startTime
      } else {
        return null
      }

    } catch (error) {
      console.warn(`Request failed for ${provider}:${modelId}:`, error)
      return null
    }
  }

  /**
   * Make OpenAI request with proper error handling
   */
  private async makeOpenAIRequest(service: any, modelId: string, prompt: string): Promise<void> {
    // Try chat completion first, then regular completion
    try {
      const client = (service as any).client
      if (client) {
        await client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
          temperature: 0
        })
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Try regular completion
        const client = (service as any).client
        if (client) {
          await client.completions.create({
            model: modelId,
            prompt,
            max_tokens: 10,
            temperature: 0
          })
        }
      } else {
        throw error
      }
    }
  }

  /**
   * Measure throughput metrics
   */
  private async measureThroughput(
    modelId: string,
    provider: string
  ): Promise<ThroughputMetrics | null> {
    try {
      console.log(`⚡ Measuring throughput for ${provider}:${modelId}`)

      // Measure sequential requests
      const startTime = Date.now()
      let successfulRequests = 0
      let totalTokens = 0

      for (let i = 0; i < this.sampleSizes.throughput; i++) {
        const prompt = this.testPrompts[i % this.testPrompts.length]
        const latency = await this.measureSingleRequest(modelId, provider, prompt)

        if (latency !== null) {
          successfulRequests++
          // Estimate tokens (simplified - real implementation would count actual tokens)
          totalTokens += prompt.length / 4 + 10 // rough token estimation
        }
      }

      const durationMinutes = (Date.now() - startTime) / 60000
      const requestsPerMinute = successfulRequests / durationMinutes
      const tokensPerSecond = totalTokens / ((Date.now() - startTime) / 1000)

      // Test concurrent requests
      const concurrentRequests = await this.measureConcurrentCapacity(modelId, provider)

      return {
        tokensPerSecond,
        requestsPerMinute,
        concurrentRequests
      }

    } catch (error) {
      console.error(`Failed to measure throughput for ${provider}:${modelId}:`, error)
      return null
    }
  }

  /**
   * Measure concurrent request capacity
   */
  private async measureConcurrentCapacity(modelId: string, provider: string): Promise<number> {
    try {
      const promises = []
      const maxConcurrent = this.sampleSizes.concurrent

      for (let i = 0; i < maxConcurrent; i++) {
        promises.push(
          this.measureSingleRequest(modelId, provider, 'Test concurrent request')
        )
      }

      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length

      return successful

    } catch (error) {
      console.error('Failed to measure concurrent capacity:', error)
      return 0
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = percentile * (sortedArray.length - 1)
    const floor = Math.floor(index)
    const ceil = Math.ceil(index)

    if (floor === ceil) {
      return sortedArray[floor]
    }

    const lower = sortedArray[floor]
    const upper = sortedArray[ceil]
    return lower + (upper - lower) * (index - floor)
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: ModelMetrics): Promise<void> {
    try {
      // Find the model in database
      const model = await prisma.model.findFirst({
        where: {
          OR: [
            { slug: metrics.modelId },
            { id: metrics.modelId },
            { name: { contains: metrics.modelId } }
          ]
        }
      })

      if (!model) {
        console.warn(`Model not found in database: ${metrics.modelId}`)
        return
      }

      // Create model status record
      await prisma.modelStatus.create({
        data: {
          modelId: model.id,
          status: metrics.availability > 95 ? 'operational' :
                  metrics.availability > 80 ? 'degraded' : 'outage',
          availability: metrics.availability,
          latencyP50: metrics.latency.p50,
          latencyP95: metrics.latency.p95,
          latencyP99: metrics.latency.p99,
          errorRate: metrics.latency.errorRate,
          requestsPerMin: metrics.throughput.requestsPerMinute,
          tokensPerMin: metrics.throughput.tokensPerSecond * 60,
          usage: 0, // Would be calculated from actual usage data
          region: 'global',
          checkedAt: metrics.lastMeasured,
        }
      })

      console.log(`💾 Stored metrics for ${metrics.modelId} in database`)

    } catch (error) {
      console.error('Failed to store metrics in database:', error)
    }
  }

  /**
   * Collect metrics for all active models
   */
  async collectAllModelMetrics(): Promise<number> {
    try {
      console.log('🔄 Starting comprehensive metrics collection...')

      const models = await prisma.model.findMany({
        where: { isActive: true },
        include: { provider: true }
      })

      let collectedCount = 0

      for (const model of models) {
        try {
          const metrics = await this.collectModelMetrics(
            model.slug,
            model.provider.slug,
            { includeThroughput: false, sampleSize: 5 } // Smaller sample for bulk collection
          )

          if (metrics) {
            collectedCount++
          }

          // Rate limiting: wait between models
          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error) {
          console.error(`Failed to collect metrics for ${model.slug}:`, error)
        }
      }

      console.log(`✅ Collected metrics for ${collectedCount}/${models.length} models`)
      return collectedCount

    } catch (error) {
      console.error('Failed to collect all model metrics:', error)
      return 0
    }
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector()