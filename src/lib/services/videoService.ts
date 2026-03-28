import { AspectRatio, VideoJob, VideoLog, VideoStatus, VideoType } from '../types';
import { generatePrompt, formatPromptForApi } from './promptService';
import { klingGenerateVideo, klingCheckStatus } from './apiClient';

// In-memory store (replace with DB later)
const jobs = new Map<string, VideoJob>();

function createLog(message: string, progress: number): VideoLog {
  return {
    timestamp: new Date().toISOString(),
    message,
    progress,
  };
}

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createVideoJob(params: {
  projectId: string;
  imageUrl: string;
  videoType: VideoType;
  aspectRatio: AspectRatio;
}): Promise<VideoJob> {
  const id = generateId();
  const prompt = generatePrompt(params.videoType);

  const job: VideoJob = {
    id,
    projectId: params.projectId,
    videoType: params.videoType,
    aspectRatio: params.aspectRatio,
    status: 'pending',
    progress: 0,
    prompt,
    imageUrl: params.imageUrl,
    logs: [createLog('Job criado', 0)],
    parameters: {
      videoType: params.videoType,
      aspectRatio: params.aspectRatio,
      duration: String(prompt.duration),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobs.set(id, job);
  return job;
}

export async function startVideoGeneration(jobId: string): Promise<VideoJob> {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Step 1: Prepare
  updateJob(job, 'preparing', 10, 'Preparando imagens...');

  // Step 2: Generate prompt
  updateJob(job, 'generating_prompt', 30, 'Gerando prompt otimizado...');
  const promptText = formatPromptForApi(job.prompt);

  // Step 3: Send to API
  updateJob(job, 'sending_to_api', 50, 'Enviando para API de geração...');

  try {
    const result = await klingGenerateVideo({
      prompt: promptText,
      imageUrl: job.imageUrl,
      aspectRatio: job.aspectRatio,
      duration: job.prompt.duration,
    });

    job.apiJobId = result.taskId;
    updateJob(job, 'processing', 70, `Processando vídeo (API ID: ${result.taskId})...`);

    return job;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    updateJob(job, 'failed', job.progress, `Erro: ${message}`);
    throw error;
  }
}

export async function checkVideoStatus(jobId: string): Promise<VideoJob> {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (!job.apiJobId) throw new Error(`Job ${jobId} has no API task ID`);

  const status = await klingCheckStatus(job.apiJobId);

  if (status.status === 'completed' && status.resultUrl) {
    job.resultUrl = status.resultUrl;
    updateJob(job, 'completed', 100, 'Vídeo gerado com sucesso!');
  } else if (status.status === 'failed') {
    updateJob(job, 'failed', job.progress, `Falha: ${status.error || 'Unknown error'}`);
  } else {
    updateJob(job, 'processing', 70, 'Processando vídeo...');
  }

  return job;
}

export function getJob(jobId: string): VideoJob | undefined {
  return jobs.get(jobId);
}

export function getProjectJobs(projectId: string): VideoJob[] {
  return Array.from(jobs.values()).filter((j) => j.projectId === projectId);
}

function updateJob(job: VideoJob, status: VideoStatus, progress: number, message: string) {
  job.status = status;
  job.progress = progress;
  job.updatedAt = new Date().toISOString();
  job.logs.push(createLog(message, progress));
}
