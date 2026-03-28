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

export interface VideoProject {
  id: string;
  name: string;
  description?: string;
  images: UploadedImage[];
  createdAt: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  category: ImageCategory;
  filename: string;
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
  imageCategory: ImageCategory;
  videoType: VideoType;
  aspectRatio: AspectRatio;
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
