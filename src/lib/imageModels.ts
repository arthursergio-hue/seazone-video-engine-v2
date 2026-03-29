// ========================================
// Image Generation Models (shared client/server)
// ========================================

export type ImageModelId =
  | 'flux_dev'
  | 'flux_pro'
  | 'bananana'
  | 'flux_schnell';

export interface ImageModelInfo {
  id: ImageModelId;
  name: string;
  falModel: string;
  description: string;
  supportsImageToImage: boolean;
}

export const IMAGE_MODELS: ImageModelInfo[] = [
  {
    id: 'flux_dev',
    name: 'Flux Dev (img2img)',
    falModel: 'fal-ai/flux/dev/image-to-image',
    description: 'Flux Dev — boa qualidade, img2img nativo',
    supportsImageToImage: true,
  },
  {
    id: 'flux_pro',
    name: 'Flux Pro 1.1',
    falModel: 'fal-ai/flux-pro/v1.1',
    description: 'Flux Pro — alta qualidade, mais lento',
    supportsImageToImage: false,
  },
  {
    id: 'bananana',
    name: 'Bananana (img2img)',
    falModel: 'fal-ai/bananana',
    description: 'Bananana — rapido, bom para transformacoes',
    supportsImageToImage: true,
  },
  {
    id: 'flux_schnell',
    name: 'Flux Schnell',
    falModel: 'fal-ai/flux/schnell',
    description: 'Flux Schnell — muito rapido, qualidade boa',
    supportsImageToImage: false,
  },
];

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'flux_dev';

export function getImageModel(id: ImageModelId): ImageModelInfo {
  return IMAGE_MODELS.find((m) => m.id === id) || IMAGE_MODELS[0];
}
