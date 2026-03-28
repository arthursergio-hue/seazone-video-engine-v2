import { VideoPrompt, VideoType } from '../types';
import { generatePrompt, formatPromptForApi } from '../services/promptService';

export class PromptBuilderAgent {
  build(videoType: VideoType): { prompt: VideoPrompt; formattedPrompt: string } {
    const prompt = generatePrompt(videoType);
    const formattedPrompt = formatPromptForApi(prompt);

    return { prompt, formattedPrompt };
  }
}
