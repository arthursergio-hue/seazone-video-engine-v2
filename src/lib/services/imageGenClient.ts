import { fal } from '@fal-ai/client';
import { ImageModelId, ImageModelInfo, IMAGE_MODELS, getImageModel, DEFAULT_IMAGE_MODEL } from '../imageModels';

export type { ImageModelId, ImageModelInfo };
export { DEFAULT_IMAGE_MODEL, getImageModel };

function getFalKey(): string | null {
  return process.env.FAL_KEY || null;
}

// ========================================
// FAL Image Generation
// ========================================

async function falGenerateImage(
  model: ImageModelInfo,
  params: {
    prompt: string;
    imageUrl: string;
    strength: number;
  }
): Promise<{ requestId: string; model: string }> {
  const falKey = getFalKey();
  if (!falKey) throw new Error('FAL_KEY not configured');

  fal.config({ credentials: falKey });

  // Build input based on model capabilities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input: any = {
    prompt: params.prompt,
  };

  if (model.usesImageUrls) {
    // Nano Banana models use image_urls (array)
    input.image_urls = [params.imageUrl];
  } else {
    // Flux models use image_url (singular)
    input.image_url = params.imageUrl;
  }

  if (model.supportsStrength) {
    input.strength = params.strength;
  }

  // Common optional params
  input.num_images = 1;
  if (!model.usesImageUrls) {
    input.enable_safety_checker = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await (fal as any).queue.submit(model.falModel, { input });

  const requestId = result?.request_id;
  if (!requestId) {
    console.error('[ImageGen] FAL submit response:', JSON.stringify(result, null, 2));
    throw new Error('FAL did not return a request_id for image generation');
  }

  return { requestId, model: model.falModel };
}

async function falCheckImageStatus(
  requestId: string,
  falModel: string
): Promise<{
  status: string;
  imageUrl?: string;
  error?: string;
}> {
  const falKey = getFalKey();
  if (!falKey) return { status: 'failed', error: 'FAL_KEY not configured' };

  fal.config({ credentials: falKey });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusResult: any = await (fal as any).queue.status(falModel, {
      requestId,
      logs: true,
    });

    const queueStatus = statusResult?.status;

    if (queueStatus === 'COMPLETED') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await (fal as any).queue.result(falModel, { requestId });
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

async function demoGenerateImage(): Promise<{ requestId: string; model: string }> {
  await new Promise((r) => setTimeout(r, 300));
  return { requestId: `demo_img_${Date.now()}`, model: 'demo' };
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
  modelId?: ImageModelId;
}): Promise<{ requestId: string; isDemo: boolean; model: string }> {
  const falKey = getFalKey();

  if (falKey) {
    const model = getImageModel(params.modelId || DEFAULT_IMAGE_MODEL);
    const result = await falGenerateImage(model, params);
    return { ...result, isDemo: false };
  }

  const result = await demoGenerateImage();
  return { ...result, isDemo: true };
}

export async function checkImageStatus(
  requestId: string,
  falModel?: string
): Promise<{
  status: string;
  imageUrl?: string;
  error?: string;
}> {
  if (requestId.startsWith('demo_img_')) {
    return demoCheckImageStatus(requestId);
  }
  // Use provided model or default
  const model = falModel || IMAGE_MODELS[0].falModel;
  return falCheckImageStatus(requestId, model);
}
