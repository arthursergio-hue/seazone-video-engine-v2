const KLING_API_BASE = 'https://api.klingai.com/v1';

function getApiKey(): string | null {
  return process.env.KLING_API_KEY || null;
}

function getHeaders(): Record<string, string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('KLING_API_KEY is not configured');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

export function isApiConfigured(): boolean {
  const key = getApiKey();
  return !!key && key.length > 0;
}

// Demo mode: simulates API responses when no API key is configured
async function simulateGeneration(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  duration: number;
}): Promise<{ taskId: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  const taskId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return { taskId };
}

async function simulateStatusCheck(taskId: string): Promise<{
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}> {
  // Demo tasks "complete" after creation
  // In a real scenario, this would poll an actual API
  const createdAt = parseInt(taskId.split('_')[1] || '0');
  const elapsed = Date.now() - createdAt;

  if (elapsed < 3000) {
    return { status: 'processing', progress: 30 };
  } else if (elapsed < 6000) {
    return { status: 'processing', progress: 60 };
  } else if (elapsed < 9000) {
    return { status: 'processing', progress: 90 };
  } else {
    return {
      status: 'completed',
      progress: 100,
      // Demo video URL - a sample video for testing
      resultUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    };
  }
}

export async function klingGenerateVideo(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  duration: number;
}): Promise<{ taskId: string }> {
  if (!isApiConfigured()) {
    console.log('[DEMO MODE] Simulating video generation — no KLING_API_KEY configured');
    return simulateGeneration(params);
  }

  // Don't send full base64 to Kling if image is a data URL — it needs a hosted URL
  let imageParam = params.imageUrl;
  if (imageParam.startsWith('data:')) {
    // For now, Kling needs a public URL. In production, upload to S3/Cloudinary first.
    // In demo mode this is handled above.
    console.warn('[API] Image is base64 — Kling requires a public URL. Sending as-is.');
  }

  const response = await fetch(`${KLING_API_BASE}/videos/image2video`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model_name: 'kling-v1',
      image: imageParam,
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

export async function klingCheckStatus(taskId: string): Promise<{
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}> {
  // Demo mode
  if (taskId.startsWith('demo_')) {
    return simulateStatusCheck(taskId);
  }

  if (!isApiConfigured()) {
    return { status: 'failed', error: 'KLING_API_KEY not configured' };
  }

  const response = await fetch(`${KLING_API_BASE}/videos/image2video/${taskId}`, {
    method: 'GET',
    headers: getHeaders(),
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
    progress: task?.task_status_msg ? undefined : undefined,
    resultUrl: task?.task_result?.videos?.[0]?.url,
    error: task?.task_status === 'failed' ? task?.task_status_msg : undefined,
  };
}
