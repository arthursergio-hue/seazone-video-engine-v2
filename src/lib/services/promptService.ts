import { ImageCategory, VideoPrompt, VideoType } from '../types';
import { buildPrompt } from '../prompts/templates';

const categoryToVideoType: Record<ImageCategory, VideoType> = {
  fachada: 'fachada',
  interior: 'interior',
  construcao: 'construcao',
  drone: 'fachada',
};

export function suggestVideoType(imageCategory: ImageCategory): VideoType {
  return categoryToVideoType[imageCategory];
}

export function generatePrompt(videoType: VideoType): VideoPrompt {
  return buildPrompt(videoType);
}

export function formatPromptForApi(prompt: VideoPrompt): string {
  return [
    prompt.text,
    `Camera: ${prompt.cameraMovement}.`,
    `Style: ${prompt.visualStyle}.`,
    `Lighting: ${prompt.lighting}.`,
    `Mood: ${prompt.mood}.`,
  ].join(' ');
}
