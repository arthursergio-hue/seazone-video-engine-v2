import { AspectRatio, VideoJob, VideoType } from '../types';
import { createVideoJob, startVideoGeneration } from '../services/videoService';

export class VideoGenerationAgent {
  async generate(params: {
    projectId: string;
    imageUrl: string;
    videoType: VideoType;
    aspectRatio: AspectRatio;
  }): Promise<VideoJob> {
    const job = await createVideoJob(params);
    await startVideoGeneration(job.id);
    return job;
  }
}
