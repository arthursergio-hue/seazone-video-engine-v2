import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/services/imageGenClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt, strength, stageOrder } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl and prompt are required' },
        { status: 400 }
      );
    }

    console.log(`[Pipeline] Generating image for stage ${stageOrder}...`);
    console.log(`[Pipeline] Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`[Pipeline] Strength: ${strength}`);

    const result = await generateImage({
      prompt,
      imageUrl,
      strength: strength || 0.8,
    });

    console.log(`[Pipeline] Image generation submitted. RequestId: ${result.requestId}, Demo: ${result.isDemo}`);

    return NextResponse.json({
      requestId: result.requestId,
      isDemo: result.isDemo,
      status: 'processing',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Pipeline] Generate image error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
