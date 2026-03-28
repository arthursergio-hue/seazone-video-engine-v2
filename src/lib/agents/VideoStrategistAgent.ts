import { ImageCategory, VideoType } from '../types';
import { suggestVideoType } from '../services/promptService';

export interface StrategyResult {
  videoType: VideoType;
  approach: string;
  reasoning: string;
}

export class VideoStrategistAgent {
  analyze(imageCategory: ImageCategory, preferredType?: VideoType): StrategyResult {
    const videoType = preferredType || suggestVideoType(imageCategory);

    const approaches: Record<VideoType, { approach: string; reasoning: string }> = {
      fachada: {
        approach: 'Tilt-up cinematográfico revelando a fachada completa',
        reasoning: 'Imagens de fachada funcionam melhor com movimentos verticais que revelam a escala do empreendimento',
      },
      interior: {
        approach: 'Dolly forward suave atravessando os ambientes',
        reasoning: 'Tours internos precisam de movimentos fluidos que simulam a experiência de caminhar pelo espaço',
      },
      construcao: {
        approach: 'Órbita lenta mostrando progresso da obra',
        reasoning: 'Obras são melhor apresentadas com perspectiva aérea que demonstra escala e progresso',
      },
      unidade: {
        approach: 'Walkthrough elegante pela unidade',
        reasoning: 'Unidades precisam mostrar fluxo entre ambientes e acabamentos de forma profissional',
      },
    };

    return {
      videoType,
      ...approaches[videoType],
    };
  }
}
