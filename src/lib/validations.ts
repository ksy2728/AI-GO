import { z } from 'zod'

// Model validation schemas
export const modelQuerySchema = z.object({
  provider: z.string().optional(),
  modality: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

export const modelIdSchema = z.string().min(1, 'Model ID is required')

// Search validation
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['models', 'providers', 'benchmarks', 'all']).optional(),
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

// Validate and sanitize user input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}