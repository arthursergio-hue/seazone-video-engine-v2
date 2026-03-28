export type VideoType = 'fachada' | 'interior' | 'construcao' | 'unidade';

export type ImageCategory = 'fachada' | 'interior' | 'construcao' | 'drone';

export type AspectRatio = '9:16' | '4:5' | '16:9';

export type VideoStatus =
  | 'pending'
  | 'preparing'
  | 'generating_prompt'
  | 'sending_to_api'
  | 'processing'
  | 'validating'
  | 'completed'
  | 'failed';

export interface UploadedImage {
  id: string;
  url: string;
  category: ImageCategory;
  filename: string;
  isPrimary?: boolean;
}

export interface CategoryImages {
  primaryImage: UploadedImage | null;
  referenceImages: UploadedImage[];
}

export type ProjectImages = Record<ImageCategory, CategoryImages>;

export interface VideoProject {
  id: string;
  name: string;
  description?: string;
  images: UploadedImage[];
  categoryImages: ProjectImages;
  createdAt: string;
}

export interface VideoPrompt {
  text: string;
  videoType: VideoType;
  cameraMovement: string;
  visualStyle: string;
  lighting: string;
  mood: string;
  duration: number;
}

export interface VideoJob {
  id: string;
  projectId: string;
  videoType: VideoType;
  aspectRatio: AspectRatio;
  status: VideoStatus;
  progress: number;
  prompt: VideoPrompt;
  imageUrl: string;
  referenceImageUrls?: string[];
  constructionFromFacade?: boolean;
  resultUrl?: string;
  apiJobId?: string;
  logs: VideoLog[];
  parameters: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface VideoLog {
  timestamp: string;
  message: string;
  progress: number;
}

export interface GenerationRequest {
  projectId: string;
  imageUrl: string;
  referenceImageUrls?: string[];
  imageCategory: ImageCategory;
  videoType: VideoType;
  aspectRatio: AspectRatio;
  constructionFromFacade?: boolean;
}

export interface ApiGenerationResponse {
  taskId: string;
  status: string;
}

export interface ApiStatusResponse {
  taskId: string;
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}

export const EMPTY_PROJECT_IMAGES: ProjectImages = {
  fachada: { primaryImage: null, referenceImages: [] },
  interior: { primaryImage: null, referenceImages: [] },
  construcao: { primaryImage: null, referenceImages: [] },
  drone: { primaryImage: null, referenceImages: [] },
};

export function createEmptyProjectImages(): ProjectImages {
  return {
    fachada: { primaryImage: null, referenceImages: [] },
    interior: { primaryImage: null, referenceImages: [] },
    construcao: { primaryImage: null, referenceImages: [] },
    drone: { primaryImage: null, referenceImages: [] },
  };
}

export function getAllImagesFromCategory(cat: CategoryImages): UploadedImage[] {
  const imgs: UploadedImage[] = [];
  if (cat.primaryImage) imgs.push(cat.primaryImage);
  imgs.push(...cat.referenceImages);
  return imgs;
}

export function getTotalImageCount(projectImages: ProjectImages): number {
  return (Object.keys(projectImages) as ImageCategory[]).reduce((sum, key) => {
    return sum + getAllImagesFromCategory(projectImages[key]).length;
  }, 0);
}
