import { AspectRatio, VideoJob, VideoType } from '../types';
import { createVideoJob, startVideoGeneration } from '../services/videoService';
import { VideoProvider } from '../services/apiClient';

export class VideoGenerationAgent {
  async generate(params: {
    projectId: string;
    imageUrl: string;
    referenceImageUrls?: string[];
    videoType: VideoType;
    aspectRatio: AspectRatio;
    constructionFromFacade?: boolean;
    provider?: VideoProvider;
  }): Promise<VideoJob> {
    const job = await createVideoJob(params);
    await startVideoGeneration(job.id, params.provider);
    return job;
  }
}
