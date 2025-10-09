import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple admin check - in production, use proper authentication
function isAdmin(request: NextRequest): boolean {
  // Check for admin token in headers or cookies
  const adminToken = request.headers.get('x-admin-token')
  const adminCookie = request.cookies.get('admin-token')

  // For development, also check for a simple password
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-secret-2024'

  return adminToken === ADMIN_PASSWORD || adminCookie?.value === ADMIN_PASSWORD
}

// GET: Fetch featured models
export async function GET(_request: NextRequest) {
  try {
    const featuredModels = await prisma.model.findMany({
      where: {
        isFeatured: true
      },
      include: {
        provider: true
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { intelligenceScore: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      models: featuredModels,
      count: featuredModels.length
    })
  } catch (error) {
    console.error('Failed to fetch featured models:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured models' },
      { status: 500 }
    )
  }
}

// POST: Pin/Unpin a model
export async function POST(request: NextRequest) {
  // Check admin authorization
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { modelId, action, order, reason } = body

    if (!modelId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let updatedModel

    if (action === 'pin') {
      // Check if we already have 9 featured models
      const currentFeatured = await prisma.model.count({
        where: { isFeatured: true }
      })

      if (currentFeatured >= 9 && !order) {
        return NextResponse.json(
          { success: false, error: 'Maximum 9 featured models allowed. Please specify order to replace.' },
          { status: 400 }
        )
      }

      // If order is specified and there's already a model at that position, swap them
      if (order && order >= 1 && order <= 9) {
        const existingAtOrder = await prisma.model.findFirst({
          where: {
            isFeatured: true,
            featuredOrder: order
          }
        })

        if (existingAtOrder) {
          // Remove the existing model from featured
          await prisma.model.update({
            where: { id: existingAtOrder.id },
            data: {
              isFeatured: false,
              featuredOrder: null,
              featuredAt: null,
              featuredBy: null,
              featuredReason: null
            }
          })
        }
      }

      // Pin the model
      updatedModel = await prisma.model.update({
        where: { id: modelId },
        data: {
          isFeatured: true,
          featuredOrder: order || currentFeatured + 1,
          featuredAt: new Date(),
          featuredBy: 'admin', // In production, use actual admin ID
          featuredReason: reason || null
        },
        include: {
          provider: true
        }
      })
    } else if (action === 'unpin') {
      // Unpin the model
      updatedModel = await prisma.model.update({
        where: { id: modelId },
        data: {
          isFeatured: false,
          featuredOrder: null,
          featuredAt: null,
          featuredBy: null,
          featuredReason: null
        },
        include: {
          provider: true
        }
      })

      // Reorder remaining featured models
      const remainingFeatured = await prisma.model.findMany({
        where: { isFeatured: true },
        orderBy: { featuredOrder: 'asc' }
      })

      // Update orders to fill gaps
      for (let i = 0; i < remainingFeatured.length; i++) {
        await prisma.model.update({
          where: { id: remainingFeatured[i].id },
          data: { featuredOrder: i + 1 }
        })
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "pin" or "unpin"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      model: updatedModel,
      message: `Model ${action === 'pin' ? 'pinned' : 'unpinned'} successfully`
    })
  } catch (error) {
    console.error('Failed to update featured model:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update featured model' },
      { status: 500 }
    )
  }
}

// PUT: Reorder featured models
export async function PUT(request: NextRequest) {
  // Check admin authorization
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { modelOrders } = body // Array of { modelId, order }

    if (!Array.isArray(modelOrders)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Update each model's order
    const updatePromises = modelOrders.map(({ modelId, order }) =>
      prisma.model.update({
        where: { id: modelId },
        data: { featuredOrder: order }
      })
    )

    await Promise.all(updatePromises)

    // Fetch updated featured models
    const updatedModels = await prisma.model.findMany({
      where: { isFeatured: true },
      include: { provider: true },
      orderBy: { featuredOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      models: updatedModels,
      message: 'Featured models reordered successfully'
    })
  } catch (error) {
    console.error('Failed to reorder featured models:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reorder featured models' },
      { status: 500 }
    )
  }
}

// DELETE: Clear all featured models
export async function DELETE(request: NextRequest) {
  // Check admin authorization
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Clear all featured models
    await prisma.model.updateMany({
      where: { isFeatured: true },
      data: {
        isFeatured: false,
        featuredOrder: null,
        featuredAt: null,
        featuredBy: null,
        featuredReason: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'All featured models cleared'
    })
  } catch (error) {
    console.error('Failed to clear featured models:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear featured models' },
      { status: 500 }
    )
  }
}