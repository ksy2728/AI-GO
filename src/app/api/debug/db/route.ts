import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test basic database connection
    console.log('🔍 Testing database connection...')
    
    // Try to connect and run a simple query
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database`
    console.log('✅ Database connection successful:', result)
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log('📊 Available tables:', tables)
    
    // Check if we have any models
    let modelCount = 0
    let providerCount = 0
    
    try {
      modelCount = await prisma.model.count()
      providerCount = await prisma.provider.count()
      console.log(`📈 Database stats: ${modelCount} models, ${providerCount} providers`)
    } catch (err) {
      console.warn('⚠️ Could not count records:', err instanceof Error ? err.message : 'Unknown error')
    }
    
    return NextResponse.json({
      status: 'connected',
      database: result,
      tables: tables,
      stats: {
        models: modelCount,
        providers: providerCount
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    return NextResponse.json({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}