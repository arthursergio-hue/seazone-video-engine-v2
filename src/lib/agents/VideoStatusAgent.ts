import { VideoJob } from '../types';
import { checkVideoStatus, getJob } from '../services/videoService';

export class VideoStatusAgent {
  async check(jobId: string): Promise<VideoJob> {
    const job = getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    if (!job.apiJobId) {
      return job;
    }

    return checkVideoStatus(jobId);
  }
}
