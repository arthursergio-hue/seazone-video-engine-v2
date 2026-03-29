// ========================================
// Pipeline Types
// ========================================

export type PipelineType = 'construction' | 'interior' | 'drone';

export type StageStatus = 'pending' | 'generating' | 'generated' | 'approved' | 'failed';

export type PipelineVideoStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type PipelinePhase =
  | 'select_type'
  | 'generate_images'
  | 'approve_images'
  | 'generate_video'
  | 'completed';

export interface PipelineStage {
  id: string;
  order: number;
  name: string;
  description: string;
  prompt: string;
  strength: number;
  imageUrl?: string;
  isOriginal: boolean;
  status: StageStatus;
  version: number;
  falRequestId?: string;
  falModel?: string;
  generatedAt?: string;
  error?: string;
}

export interface Pipeline {
  id: string;
  type: PipelineType;
  projectId: string;
  sourceImageUrl: string;
  stages: PipelineStage[];
  phase: PipelinePhase;
  videoStatus: PipelineVideoStatus;
  videoJobId?: string;
  videoApiJobId?: string;
  videoUrl?: string;
  videoProvider?: string;
  videoAspectRatio?: string;
  videoPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageDefinition {
  order: number;
  name: string;
  description: string;
  prompt: string;
  strength: number;
  isOriginal: boolean;
}

export const PIPELINE_TYPE_LABELS: Record<PipelineType, string> = {
  construction: 'Construcao (Fachada)',
  interior: 'Interior',
  drone: 'Drone / Cinematografico',
};

export const PIPELINE_TYPE_DESCRIPTIONS: Record<PipelineType, string> = {
  construction: 'Timelapse de construcao: terreno vazio -> esqueleto -> obra -> fachada final. 4 estagios.',
  interior: 'Transformacao interior: sala vazia -> totalmente mobiliada. 2 estagios.',
  drone: 'Video cinematografico com multiplas imagens como takes. Sem geracao de imagem.',
};
