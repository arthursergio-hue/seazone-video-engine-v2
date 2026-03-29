import { fal } from '@fal-ai/client';

// ========================================
// Image Generation Client (FAL img2img)
// ========================================

const IMAGE_MODEL = 'fal-ai/flux/dev/image-to-image';

function getFalKey(): string | null {
  return process.env.FAL_KEY || null;
}

// ========================================
// FAL Image Generation
// ========================================

async function falGenerateImage(params: {
  prompt: string;
  imageUrl: string;
  strength: number;
}): Promise<{ requestId: string }> {
  const falKey = getFalKey();
  if (!falKey) throw new Error('FAL_KEY not configured');

  fal.config({ credentials: falKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await (fal as any).queue.submit(IMAGE_MODEL, {
    input: {
      prompt: params.prompt,
      image_url: params.imageUrl,
      strength: params.strength,
      num_images: 1,
      enable_safety_checker: false,
    },
  });

  const requestId = result?.request_id;
  if (!requestId) {
    console.error('[ImageGen] FAL submit response:', JSON.stringify(result, null, 2));
    throw new Error('FAL did not return a request_id for image generation');
  }

  return { requestId };
}

async function falCheckImageStatus(requestId: string): Promise<{
  status: string;
  imageUrl?: string;
  error?: string;
}> {
  const falKey = getFalKey();
  if (!falKey) return { status: 'failed', error: 'FAL_KEY not configured' };

  fal.config({ credentials: falKey });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusResult: any = await (fal as any).queue.status(IMAGE_MODEL, {
      requestId,
      logs: true,
    });

    const queueStatus = statusResult?.status;

    if (queueStatus === 'COMPLETED') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await (fal as any).queue.result(IMAGE_MODEL, { requestId });
      const imageUrl =
        result?.images?.[0]?.url ||
        result?.data?.images?.[0]?.url ||
        result?.output?.images?.[0]?.url ||
        '';

      if (imageUrl) {
        return { status: 'completed', imageUrl };
      }
      return { status: 'completed', error: 'Image URL not found in response' };
    }

    if (queueStatus === 'FAILED' || queueStatus === 'CANCELLED') {
      return { status: 'failed', error: statusResult?.error || 'Image generation failed' };
    }

    // IN_QUEUE or IN_PROGRESS
    return { status: 'processing' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error checking image status';
    console.error('[ImageGen] Status check error:', msg);
    return { status: 'processing' };
  }
}

// ========================================
// Demo Mode
// ========================================

async function demoGenerateImage(): Promise<{ requestId: string }> {
  await new Promise((r) => setTimeout(r, 300));
  return { requestId: `demo_img_${Date.now()}` };
}

function demoCheckImageStatus(requestId: string): {
  status: string;
  imageUrl?: string;
  error?: string;
} {
  const t = parseInt(requestId.split('_')[2] || '0');
  const elapsed = Date.now() - t;
  if (elapsed < 5000) return { status: 'processing' };
  return {
    status: 'completed',
    imageUrl: `https://fal.media/files/placeholder/demo_stage_${t}.jpg`,
  };
}

// ========================================
// Unified API
// ========================================

export async function generateImage(params: {
  prompt: string;
  imageUrl: string;
  strength: number;
}): Promise<{ requestId: string; isDemo: boolean }> {
  const falKey = getFalKey();

  if (falKey) {
    const result = await falGenerateImage(params);
    return { ...result, isDemo: false };
  }

  // Fallback to demo
  const result = await demoGenerateImage();
  return { ...result, isDemo: true };
}

export async function checkImageStatus(requestId: string): Promise<{
  status: string;
  imageUrl?: string;
  error?: string;
}> {
  if (requestId.startsWith('demo_img_')) {
    return demoCheckImageStatus(requestId);
  }
  return falCheckImageStatus(requestId);
}
