import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { GoogleService } from '@/services/external/google.service';
import { logger } from '@/utils/logger';

export async function POST(_request: NextRequest) {
  try {
    logger.info('Google AI sync API called');
    
    const googleService = new GoogleService();
    await googleService.syncWithDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Google AI sync completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Google AI sync API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Google AI data',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const googleService = new GoogleService();
    const models = await googleService.getModels();
    const pricing = await googleService.getPricing();
    
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
    logger.error('Google AI API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Google AI data',
      },
      { status: 500 }
    );
  }
}