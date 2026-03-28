import { ImageCategory, VideoType } from '../types';
import { suggestVideoType } from '../services/promptService';
import { getPresetForVideoType, OfficialPreset } from '../prompts/templates';

export interface StrategyResult {
  videoType: VideoType;
  approach: string;
  reasoning: string;
  preset: OfficialPreset;
  constructionFromFacade: boolean;
}

export class VideoStrategistAgent {
  analyze(
    imageCategory: ImageCategory,
    preferredType?: VideoType,
    options?: { constructionFromFacade?: boolean; hasReferenceImages?: boolean }
  ): StrategyResult {
    const videoType = preferredType || suggestVideoType(imageCategory);
    const constructionFromFacade = options?.constructionFromFacade || false;
    const preset = getPresetForVideoType(videoType, constructionFromFacade);

    let approach = preset.narrativeObjective;
    let reasoning = `Usando preset oficial "${preset.name}" com ${preset.scenes.length} cenas planejadas.`;

    if (constructionFromFacade) {
      approach = 'Simulação visual da evolução construtiva a partir da fachada fornecida';
      reasoning = 'Sem imagens reais de construção — gerando simulação baseada na fachada. Preset: construction_from_facade.';
    }

    if (options?.hasReferenceImages) {
      reasoning += ' Imagens de referência disponíveis para complementar a geração.';
    }

    return {
      videoType,
      approach,
      reasoning,
      preset,
      constructionFromFacade,
    };
  }
}
