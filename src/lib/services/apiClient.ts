const KLING_API_BASE = 'https://api.klingai.com/v1';

function getHeaders(): Record<string, string> {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) {
    throw new Error('KLING_API_KEY is not configured');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

export async function klingGenerateVideo(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  duration: number;
}): Promise<{ taskId: string }> {
  const response = await fetch(`${KLING_API_BASE}/videos/image2video`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model_name: 'kling-v1',
      image: params.imageUrl,
      prompt: params.prompt,
      negative_prompt: 'blurry, distorted, low quality, watermark, text overlay',
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
