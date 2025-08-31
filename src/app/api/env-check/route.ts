import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    dataSource: process.env.DATA_SOURCE || 'not-set',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}