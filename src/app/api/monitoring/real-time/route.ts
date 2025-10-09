import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { realTimeMonitorV2 } from '@/services/real-time-monitor-v2.service';

export async function GET(_request: NextRequest) {
  try {
    const dashboardData = await realTimeMonitorV2.getDashboardData();

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Failed to get real-time monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to get real-time monitoring data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, providerId, success, responseTime, tokens, errorType } = body;

    // Validate required fields
    if (!modelId || !providerId || success === undefined || !responseTime || !tokens) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record the API call
    realTimeMonitorV2.recordApiCall(
      modelId,
      providerId,
      success,
      responseTime,
      tokens,
      errorType
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record API call:', error);
    return NextResponse.json(
      { error: 'Failed to record API call' },
      { status: 500 }
    );
  }
}