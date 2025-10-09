import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AnthropicService } from '@/services/external/anthropic.service';
import { logger } from '@/utils/logger';

export async function POST(_request: NextRequest) {
  try {
    logger.info('Anthropic sync API called');
    
    const anthropicService = new AnthropicService();
    await anthropicService.syncWithDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Anthropic sync completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Anthropic sync API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Anthropic data',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const anthropicService = new AnthropicService();
    const models = await anthropicService.getModels();
    const pricing = await anthropicService.getPricing();
    
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
    logger.error('Anthropic API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Anthropic data',
      },
      { status: 500 }
    );
  }
}