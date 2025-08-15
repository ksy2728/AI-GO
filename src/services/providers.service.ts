/**
 * Provider Service
 * Manages AI provider data and operations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ProviderService {
  /**
   * Get all providers
   */
  static async getAll() {
    try {
      return await prisma.providers.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching providers:', error)
      throw error
    }
  }

  /**
   * Get provider by ID
   */
  static async getById(id: string) {
    try {
      return await prisma.providers.findUnique({
        where: { id }
      })
    } catch (error) {
      console.error('Error fetching provider:', error)
      throw error
    }
  }

  /**
   * Get provider by slug
   */
  static async getBySlug(slug: string) {
    try {
      return await prisma.providers.findFirst({
        where: { slug }
      })
    } catch (error) {
      console.error('Error fetching provider by slug:', error)
      throw error
    }
  }

  /**
   * Create or update provider
   */
  static async upsert(data: {
    id?: string
    name: string
    slug: string
    is_active?: boolean
  }) {
    try {
      const id = data.id || require('crypto').randomUUID()
      
      return await prisma.providers.upsert({
        where: { id },
        update: {
          name: data.name,
          slug: data.slug,
          is_active: data.is_active ?? true,
          updated_at: new Date()
        },
        create: {
          id,
          name: data.name,
          slug: data.slug,
          is_active: data.is_active ?? true,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    } catch (error) {
      console.error('Error upserting provider:', error)
      throw error
    }
  }
}

export default ProviderService