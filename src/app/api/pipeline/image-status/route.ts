import { NextRequest, NextResponse } from 'next/server';
import { checkImageStatus } from '@/lib/services/imageGenClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const model = searchParams.get('model');

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 }
      );
    }

    const result = await checkImageStatus(requestId, model || undefined);

    return NextResponse.json({
      requestId,
      status: result.status,
      imageUrl: result.imageUrl || null,
      error: result.error || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Pipeline] Image status error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
