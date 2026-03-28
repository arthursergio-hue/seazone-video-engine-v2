import { fal } from '@fal-ai/client';

// ========================================
// API Configuration
// ========================================
// Priority: FAL_KEY > KLING_API_KEY > demo mode

function getFalKey(): string | null {
  return process.env.FAL_KEY || null;
}

function getKlingKey(): string | null {
  return process.env.KLING_API_KEY || null;
}

export function isApiConfigured(): boolean {
  return !!(getFalKey() || getKlingKey());
}

export function getActiveProvider(): 'fal' | 'kling' | 'demo' {
  if (getFalKey()) return 'fal';
  if (getKlingKey()) return 'kling';
  return 'demo';
}

// ========================================
// FAL.ai Integration (Kling v2 model)
// ========================================

async function falGenerateVideo(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  duration: number;
}): Promise<{ taskId: string }> {
  const falKey = getFalKey();
  if (!falKey) throw new Error('FAL_KEY not configured');

  fal.config({ credentials: falKey });

  // Use fal's Kling video model (image-to-video)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await (fal as any).subscribe('fal-ai/kling-video/v2/master/image-to-video', {
    input: {
      prompt: params.prompt,
      image_url: params.imageUrl,
      duration: String(Math.min(params.duration, 10)),
    },
    logs: true,
  });

  const videoUrl = result?.data?.video?.url
    || result?.video?.url
    || result?.data?.output?.video?.url
    || '';

  // FAL subscribe waits for completion, so return the result directly
  // We store the video URL as the taskId for the status check to pick up
  return { taskId: `fal_completed_${Date.now()}_${encodeURIComponent(videoUrl)}` };
}

async function falCheckStatus(taskId: string): Promise<{
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}> {
  // FAL subscribe already waits for completion
  if (taskId.startsWith('fal_completed_')) {
    const parts = taskId.split('_');
    // Everything after "fal_completed_{timestamp}_" is the encoded URL
    const urlPart = taskId.substring(taskId.indexOf('_', taskId.indexOf('_', 4) + 1) + 1);
    const videoUrl = decodeURIComponent(urlPart);

    if (videoUrl && videoUrl.startsWith('http')) {
      return { status: 'completed', progress: 100, resultUrl: videoUrl };
    }
    return { status: 'failed', error: 'No video URL in FAL response' };
  }

  return { status: 'processing', progress: 70 };
}

// ========================================
// Kling Direct API Integration
// ========================================
const KLING_API_BASE = 'https://api.klingai.com/v1';

function getKlingHeaders(): Record<string, string> {
  const apiKey = getKlingKey();
  if (!apiKey) throw new Error('KLING_API_KEY not configured');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function klingDirectGenerate(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  duration: number;
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

async function klingDirectCheckStatus(taskId: string): Promise<{
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}> {
  const response = await fetch(`${KLING_API_BASE}/videos/image2video/${taskId}`, {
    method: 'GET',
    headers: getKlingHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling status check error: ${response.status} - ${error}`);
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
  await new Promise(resolve => setTimeout(resolve, 500));
  return { taskId: `demo_${Date.now()}` };
}

function demoCheckStatus(taskId: string): {
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
} {
  const createdAt = parseInt(taskId.split('_')[1] || '0');
  const elapsed = Date.now() - createdAt;

  if (elapsed < 4000) return { status: 'processing', progress: 30 };
  if (elapsed < 7000) return { status: 'processing', progress: 60 };
  if (elapsed < 10000) return { status: 'processing', progress: 90 };
  return {
    status: 'completed',
    progress: 100,
    resultUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  };
}

// ========================================
// Unified API (auto-routes to correct provider)
// ========================================

export async function klingGenerateVideo(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  duration: number;
}): Promise<{ taskId: string }> {
  const provider = getActiveProvider();
  console.log(`[VideoGen] Provider: ${provider}`);

  switch (provider) {
    case 'fal':
      return falGenerateVideo(params);
    case 'kling':
      return klingDirectGenerate(params);
    default:
      return demoGenerate();
  }
}

export async function klingCheckStatus(taskId: string): Promise<{
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}> {
  if (taskId.startsWith('demo_')) return demoCheckStatus(taskId);
  if (taskId.startsWith('fal_')) return falCheckStatus(taskId);
  return klingDirectCheckStatus(taskId);
}
