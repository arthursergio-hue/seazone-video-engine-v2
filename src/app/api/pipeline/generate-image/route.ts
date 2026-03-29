import { NextRequest, NextResponse } from 'next/server';
import { generateImage, ImageModelId } from '@/lib/services/imageGenClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt, strength, stageOrder, modelId } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl and prompt are required' },
        { status: 400 }
      );
    }

    console.log(`[Pipeline] Generating image for stage ${stageOrder}...`);
    console.log(`[Pipeline] Model: ${modelId || 'default'}`);
    console.log(`[Pipeline] Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`[Pipeline] Strength: ${strength}`);

    const result = await generateImage({
      prompt,
      imageUrl,
      strength: strength || 0.8,
      modelId: (modelId as ImageModelId) || undefined,
    });

    console.log(`[Pipeline] Image generation submitted. RequestId: ${result.requestId}, Model: ${result.model}, Demo: ${result.isDemo}`);

    return NextResponse.json({
      requestId: result.requestId,
      isDemo: result.isDemo,
      model: result.model,
      status: 'processing',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Pipeline] Generate image error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
