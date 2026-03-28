import { VideoPrompt, VideoType } from '../types';
import { generatePrompt, formatPromptForApi } from '../services/promptService';
import { OfficialPreset, buildPresetPrompt } from '../prompts/templates';

export class PromptBuilderAgent {
  build(
    videoType: VideoType,
    options?: {
      preset?: OfficialPreset;
      empreendimento?: string;
      constructionFromFacade?: boolean;
    }
  ): { prompt: VideoPrompt; formattedPrompt: string } {
    const prompt = generatePrompt(videoType);

    // If we have a preset, use the preset-based prompt builder
    if (options?.preset) {
      const presetPrompt = buildPresetPrompt(options.preset, {
        empreendimento: options.empreendimento,
        constructionFromFacade: options.constructionFromFacade,
      });
      prompt.text = presetPrompt;
      prompt.duration = options.preset.targetDuration;
    }

    const formattedPrompt = formatPromptForApi(prompt);
    return { prompt, formattedPrompt };
  }
}
