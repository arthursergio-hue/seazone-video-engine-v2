import { fal } from '@fal-ai/client';

// ========================================
// Provider Types
// ========================================
export type VideoProvider = 'fal_kling' | 'fal_minimax' | 'fal_runway' | 'kling_direct' | 'demo';

export interface ProviderInfo {
  id: VideoProvider;
  name: string;
  model: string;
  available: boolean;
  description: string;
}

// ========================================
// API Configuration
// ========================================

function getFalKey(): string | null {
  return process.env.FAL_KEY || null;
}

function getKlingKey(): string | null {
  return process.env.KLING_API_KEY || null;
}

export function isApiConfigured(): boolean {
  return !!(getFalKey() || getKlingKey());
}

export function getAvailableProviders(): ProviderInfo[] {
  const hasFal = !!getFalKey();
  const hasKling = !!getKlingKey();

  return [
    {
      id: 'fal_kling',
      name: 'Kling v2 (via FAL)',
      model: 'fal-ai/kling-video/v2/master/image-to-video',
      available: hasFal,
      description: 'Kling v2 Master — alta qualidade, 5-10s',
    },
    {
      id: 'fal_minimax',
      name: 'MiniMax Video',
      model: 'fal-ai/minimax/video-01-live/image-to-video',
      available: hasFal,
      description: 'MiniMax Video-01 — rápido, estilo cinematográfico',
    },
    {
      id: 'fal_runway',
      name: 'Runway Gen-3',
      model: 'fal-ai/runway-gen3/turbo/image-to-video',
      available: hasFal,
      description: 'Runway Gen-3 Turbo — movimentos suaves, alta fidelidade',
    },
    {
      id: 'kling_direct',
      name: 'Kling (API Direta)',
      model: 'kling-v1',
      available: hasKling,
      description: 'Kling v1 via API oficial',
    },
    {
      id: 'demo',
      name: 'Demo (Teste)',
      model: 'demo',
      available: true,
      description: 'Simulação para testes — sem geração real',
    },
  ];
}

export function getDefaultProvider(): VideoProvider {
  if (getFalKey()) return 'fal_kling';
  if (getKlingKey()) return 'kling_direct';
  return 'demo';
}

// ========================================
// FAL.ai Integration
// ========================================

async function falGenerate(
  model: string,
  params: { prompt: string; imageUrl: string; aspectRatio: string; duration: number }
): Promise<{ taskId: string }> {
  const falKey = getFalKey();
  if (!falKey) throw new Error('FAL_KEY not configured');

  fal.config({ credentials: falKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await (fal as any).subscribe(model, {
    input: {
      prompt: params.prompt,
      image_url: params.imageUrl,
      duration: params.duration <= 5 ? '5' : '10',
      aspect_ratio: params.aspectRatio === '16:9' ? '16:9' : '9:16',
    },
    logs: true,
  });

  // Extract video URL from FAL response (different models return differently)
  const videoUrl = result?.video?.url
    || result?.data?.video?.url
    || result?.output?.video?.url
    || result?.data?.output?.video?.url
    || '';

  if (!videoUrl) {
    console.error('[FAL] Full response:', JSON.stringify(result, null, 2));
    throw new Error('FAL returned no video URL. Check model response format.');
  }

  // Encode result URL in taskId for stateless retrieval
  return { taskId: `fal_completed_${Date.now()}_${encodeURIComponent(videoUrl)}` };
}

function falCheckStatus(taskId: string): {
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
} {
  if (taskId.startsWith('fal_completed_')) {
    // Extract URL: everything after the third underscore
    const thirdUnderscore = taskId.indexOf('_', taskId.indexOf('_', 4) + 1);
    const urlPart = taskId.substring(thirdUnderscore + 1);
    const videoUrl = decodeURIComponent(urlPart);

    if (videoUrl && videoUrl.startsWith('http')) {
      return { status: 'completed', progress: 100, resultUrl: videoUrl };
    }
    return { status: 'failed', error: 'No video URL in FAL response' };
  }
  return { status: 'processing', progress: 70 };
}

// ========================================
// Kling Direct API
// ========================================
const KLING_API_BASE = 'https://api.klingai.com/v1';

function getKlingHeaders(): Record<string, string> {
  const apiKey = getKlingKey();
  if (!apiKey) throw new Error('KLING_API_KEY not configured');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
}

async function klingDirectGenerate(params: {
  prompt: string; imageUrl: string; aspectRatio: string; duration: number;
}): Promise<{ taskId: string }> {
  const response = await fetch(`${KLING_API_BASE}/videos/image2video`, {
    method: 'POST',
    headers: getKlingHeaders(),
    body: JSON.stringify({
      model_name: 'kling-v1',
      image: params.imageUrl,
      prompt: params.prompt,
      negative_prompt: 'blurry, distorted, low quality, watermark, text overlay, excessive glow, bright lens flare, hard cuts, artificial effects',
      cfg_scale: 0.5,
      mode: 'std',
      aspect_ratio: params.aspectRatio,
      duration: String(params.duration),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling API error: ${response.status} - ${error}`);
  }
  const data = await response.json();
  return { taskId: data.data?.task_id || data.task_id };
}

async function klingDirectCheck(taskId: string): Promise<{
  status: string; progress?: number; resultUrl?: string; error?: string;
}> {
  const response = await fetch(`${KLING_API_BASE}/videos/image2video/${taskId}`, {
    method: 'GET', headers: getKlingHeaders(),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling status error: ${response.status} - ${error}`);
  }
  const data = await response.json();
  const task = data.data;
  let status = 'processing';
  if (task?.task_status === 'succeed') status = 'completed';
  else if (task?.task_status === 'failed') status = 'failed';
  return {
    status,
    resultUrl: task?.task_result?.videos?.[0]?.url,
    error: task?.task_status === 'failed' ? task?.task_status_msg : undefined,
  };
}

// ========================================
// Demo Mode
// ========================================

async function demoGenerate(): Promise<{ taskId: string }> {
  await new Promise(r => setTimeout(r, 500));
  return { taskId: `demo_${Date.now()}` };
}

function demoCheckStatus(taskId: string): {
  status: string; progress?: number; resultUrl?: string; error?: string;
} {
  const t = parseInt(taskId.split('_')[1] || '0');
  const e = Date.now() - t;
  if (e < 4000) return { status: 'processing', progress: 30 };
  if (e < 7000) return { status: 'processing', progress: 60 };
  if (e < 10000) return { status: 'processing', progress: 90 };
  return { status: 'completed', progress: 100, resultUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' };
}

// ========================================
// Unified API — receives provider choice
// ========================================

export async function generateVideo(
  provider: VideoProvider,
  params: { prompt: string; imageUrl: string; aspectRatio: string; duration: number }
): Promise<{ taskId: string; provider: VideoProvider }> {
  console.log(`[VideoGen] Provider: ${provider}`);

  switch (provider) {
    case 'fal_kling':
      return { ...(await falGenerate('fal-ai/kling-video/v2/master/image-to-video', params)), provider };
    case 'fal_minimax':
      return { ...(await falGenerate('fal-ai/minimax/video-01-live/image-to-video', params)), provider };
    case 'fal_runway':
      return { ...(await falGenerate('fal-ai/runway-gen3/turbo/image-to-video', params)), provider };
    case 'kling_direct':
      return { ...(await klingDirectGenerate(params)), provider };
    default:
      return { ...(await demoGenerate()), provider: 'demo' };
  }
}

export async function checkVideoStatus(taskId: string): Promise<{
  status: string; progress?: number; resultUrl?: string; error?: string;
}> {
  if (taskId.startsWith('demo_')) return demoCheckStatus(taskId);
  if (taskId.startsWith('fal_')) return falCheckStatus(taskId);
  return klingDirectCheck(taskId);
}

// Legacy aliases
export const klingGenerateVideo = (params: { prompt: string; imageUrl: string; aspectRatio: string; duration: number }) =>
  generateVideo(getDefaultProvider(), params);
export const klingCheckStatus = checkVideoStatus;
