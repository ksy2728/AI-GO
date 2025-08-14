import { NextRequest, NextResponse } from 'next/server';
import { MetaService } from '@/services/external/meta.service';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('Meta AI sync API called');
    
    const metaService = new MetaService();
    await metaService.syncWithDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Meta AI sync completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Meta AI sync API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Meta AI data',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const metaService = new MetaService();
    const models = await metaService.getModels();
    const pricing = await metaService.getPricing();
    
    return NextResponse.json({
      success: true,
      data: {
        models,
        pricing,
        count: models.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Meta AI API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Meta AI data',
      },
      { status: 500 }
    );
  }
}