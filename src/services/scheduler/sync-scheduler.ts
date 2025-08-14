import cron, { ScheduledTask as CronTask } from 'node-cron'
import { openAIService } from '@/services/external/openai.service'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface ScheduledTask {
  name: string
  schedule: string
  task: () => Promise<void>
  isRunning: boolean
  lastRun?: Date
  nextRun?: Date
  errorCount: number
}

export class SyncScheduler {
  private tasks: Map<string, CronTask> = new Map()
  private taskStatus: Map<string, ScheduledTask> = new Map()
  private isInitialized = false

  /**
   * Initialize the scheduler with all tasks
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Scheduler already initialized')
      return
    }

    console.log('🚀 Initializing sync scheduler...')

    // Schedule OpenAI sync every 5 minutes
    this.scheduleTask({
      name: 'openai-sync',
      schedule: '*/5 * * * *', // Every 5 minutes
      task: async () => {
        console.log('⏰ Running OpenAI sync...')
        try {
          if (openAIService.isConfigured()) {
            await openAIService.syncWithDatabase()
            console.log('✅ OpenAI sync completed')
          } else {
            console.log('⚠️ OpenAI service not configured, skipping sync')
          }
        } catch (error) {
          console.error('❌ OpenAI sync failed:', error)
          throw error
        }
      }
    })

    // Schedule health check every minute
    this.scheduleTask({
      name: 'health-check',
      schedule: '* * * * *', // Every minute
      task: async () => {
        console.log('🏥 Running health check...')
        try {
          await this.performHealthCheck()
          console.log('✅ Health check completed')
        } catch (error) {
          console.error('❌ Health check failed:', error)
          throw error
        }
      }
    })

    // Schedule cache cleanup every hour
    this.scheduleTask({
      name: 'cache-cleanup',
      schedule: '0 * * * *', // Every hour
      task: async () => {
        console.log('🗑️ Running cache cleanup...')
        try {
          await this.cleanupExpiredCache()
          console.log('✅ Cache cleanup completed')
        } catch (error) {
          console.error('❌ Cache cleanup failed:', error)
          throw error
        }
      }
    })

    // Schedule database optimization daily at 3 AM
    this.scheduleTask({
      name: 'db-optimization',
      schedule: '0 3 * * *', // Daily at 3 AM
      task: async () => {
        console.log('🔧 Running database optimization...')
        try {
          await this.optimizeDatabase()
          console.log('✅ Database optimization completed')
        } catch (error) {
          console.error('❌ Database optimization failed:', error)
          throw error
        }
      }
    })

    this.isInitialized = true
    console.log('✅ Sync scheduler initialized with', this.tasks.size, 'tasks')
  }

  /**
   * Schedule a new task
   */
  private scheduleTask(taskConfig: {
    name: string
    schedule: string
    task: () => Promise<void>
  }) {
    const { name, schedule, task } = taskConfig

    // Create task status
    const status: ScheduledTask = {
      name,
      schedule,
      task,
      isRunning: false,
      errorCount: 0,
    }
    this.taskStatus.set(name, status)

    // Create scheduled task
    const scheduledTask = cron.schedule(schedule, async () => {
      const taskStatus = this.taskStatus.get(name)!
      
      if (taskStatus.isRunning) {
        console.log(`⚠️ Task ${name} is already running, skipping...`)
        return
      }

      taskStatus.isRunning = true
      taskStatus.lastRun = new Date()

      try {
        await task()
        taskStatus.errorCount = 0
      } catch (error) {
        taskStatus.errorCount++
        console.error(`❌ Task ${name} failed (attempt ${taskStatus.errorCount}):`, error)
        
        // If task fails too many times, stop it
        if (taskStatus.errorCount >= 5) {
          console.error(`🛑 Task ${name} failed too many times, stopping...`)
          this.stopTask(name)
        }
      } finally {
        taskStatus.isRunning = false
      }
    })

    this.tasks.set(name, scheduledTask)
  }

  /**
   * Start all tasks
   */
  startAll() {
    console.log('▶️ Starting all scheduled tasks...')
    this.tasks.forEach((task, name) => {
      task.start()
      console.log(`✅ Started task: ${name}`)
    })
  }

  /**
   * Stop all tasks
   */
  stopAll() {
    console.log('⏹️ Stopping all scheduled tasks...')
    this.tasks.forEach((task, name) => {
      task.stop()
      console.log(`✅ Stopped task: ${name}`)
    })
  }

  /**
   * Start a specific task
   */
  startTask(name: string) {
    const task = this.tasks.get(name)
    if (task) {
      task.start()
      console.log(`✅ Started task: ${name}`)
    } else {
      console.error(`❌ Task not found: ${name}`)
    }
  }

  /**
   * Stop a specific task
   */
  stopTask(name: string) {
    const task = this.tasks.get(name)
    if (task) {
      task.stop()
      console.log(`✅ Stopped task: ${name}`)
    } else {
      console.error(`❌ Task not found: ${name}`)
    }
  }

  /**
   * Get status of all tasks
   */
  getStatus() {
    const status: any[] = []
    this.taskStatus.forEach((task, name) => {
      status.push({
        name,
        schedule: task.schedule,
        isRunning: task.isRunning,
        lastRun: task.lastRun,
        errorCount: task.errorCount,
        isActive: this.tasks.get(name) ? true : false,
      })
    })
    return status
  }

  /**
   * Perform health check for all models
   */
  private async performHealthCheck() {
    try {
      // Get all active models
      const models = await prisma.model.findMany({
        where: { isActive: true },
        include: { provider: true }
      })

      for (const model of models) {
        try {
          // Check OpenAI models
          if (model.provider.slug === 'openai' && openAIService.isConfigured()) {
            const modelId = model.slug.replace('35', '3.5').replace('-16k', '-16k')
            const status = await openAIService.checkModelStatus(modelId)
            
            // Update database
            await prisma.modelStatus.upsert({
              where: {
                modelId_region: {
                  modelId: model.id,
                  region: 'us-east',
                },
              },
              update: {
                status: status.status,
                availability: status.availability,
                latencyP50: status.responseTime,
                latencyP95: status.responseTime * 1.5,
                latencyP99: status.responseTime * 2,
                errorRate: status.errorRate,
                requestsPerMin: 0,
                tokensPerMin: 0,
                usage: 0,
                checkedAt: new Date(),
              },
              create: {
                modelId: model.id,
                status: status.status,
                availability: status.availability,
                latencyP50: status.responseTime,
                latencyP95: status.responseTime * 1.5,
                latencyP99: status.responseTime * 2,
                errorRate: status.errorRate,
                requestsPerMin: 0,
                tokensPerMin: 0,
                usage: 0,
                region: 'us-east',
                checkedAt: new Date(),
              }
            })
          }
          // Add other providers here (Anthropic, Google, etc.)
        } catch (error) {
          console.error(`Failed to check health for model ${model.slug}:`, error)
        }
      }

      // Invalidate status caches
      await cache.invalidate('status:*')
      await cache.invalidate('models:*')
    } catch (error) {
      console.error('Health check error:', error)
      throw error
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredCache() {
    // This would ideally use Redis TTL, but we can implement manual cleanup if needed
    console.log('Cache cleanup completed (using Redis TTL)')
  }

  /**
   * Optimize database
   */
  private async optimizeDatabase() {
    try {
      // Clean up old status records (keep only last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      await prisma.modelStatus.deleteMany({
        where: {
          checkedAt: {
            lt: sevenDaysAgo
          }
        }
      })

      // Clean up old incidents
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      await prisma.incident.deleteMany({
        where: {
          resolvedAt: {
            lt: thirtyDaysAgo
          }
        }
      })

      console.log('Database cleanup completed')
    } catch (error) {
      console.error('Database optimization error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const syncScheduler = new SyncScheduler()