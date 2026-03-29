// ========================================
// Image Generation Models (shared client/server)
// ========================================

export type ImageModelId =
  | 'flux_dev'
  | 'flux_kontext'
  | 'nano_banana'
  | 'nano_banana_pro';

export interface ImageModelInfo {
  id: ImageModelId;
  name: string;
  falModel: string;
  description: string;
  supportsImageToImage: boolean;
  /** Nano Banana models use image_urls (array) instead of image_url */
  usesImageUrls: boolean;
  /** Some models use strength, others don't */
  supportsStrength: boolean;
}

export const IMAGE_MODELS: ImageModelInfo[] = [
  {
    id: 'flux_dev',
    name: 'Flux Dev (img2img)',
    falModel: 'fal-ai/flux/dev/image-to-image',
    description: 'Flux Dev — boa qualidade, strength controlavel',
    supportsImageToImage: true,
    usesImageUrls: false,
    supportsStrength: true,
  },
  {
    id: 'flux_kontext',
    name: 'Flux Kontext Pro',
    falModel: 'fal-ai/flux-pro/kontext',
    description: 'Kontext — edicao precisa por instrucao de texto',
    supportsImageToImage: true,
    usesImageUrls: false,
    supportsStrength: false,
  },
  {
    id: 'nano_banana',
    name: 'Nano Banana 2',
    falModel: 'fal-ai/nano-banana-2/edit',
    description: 'Nano Banana 2 — Google, multi-referencia, rapido',
    supportsImageToImage: true,
    usesImageUrls: true,
    supportsStrength: false,
  },
  {
    id: 'nano_banana_pro',
    name: 'Nano Banana Pro',
    falModel: 'fal-ai/nano-banana-pro/edit',
    description: 'Nano Banana Pro — Google, maior qualidade',
    supportsImageToImage: true,
    usesImageUrls: true,
    supportsStrength: false,
  },
];

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'flux_dev';

export function getImageModel(id: ImageModelId): ImageModelInfo {
  return IMAGE_MODELS.find((m) => m.id === id) || IMAGE_MODELS[0];
}
