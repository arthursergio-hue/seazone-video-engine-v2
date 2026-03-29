import { PipelineType, PipelineStage, PipelineStageDefinition } from '../types/pipeline';

// ========================================
// Stage Definitions per Pipeline Type
// ========================================

const CONSTRUCTION_STAGES: PipelineStageDefinition[] = [
  {
    order: 4,
    name: 'Terreno Vazio',
    description: 'Lote vazio, sem construcao, mesmo angulo da fachada',
    prompt: 'Empty flat urban lot with no building or construction, same exact camera angle and perspective as the reference image, bare ground, clear sky, surrounding urban context visible, neighboring buildings, sidewalk and street visible, realistic photograph, no construction equipment, no scaffolding, just an empty plot of land where a building will be constructed',
    strength: 0.85,
    isOriginal: false,
  },
  {
    order: 3,
    name: 'Estrutura (Esqueleto)',
    description: 'Apenas pilares, vigas e lajes — sem fachada',
    prompt: 'Concrete structural skeleton of a building under construction, same exact camera angle and perspective as the reference image, only reinforced concrete pillars beams and floor slabs visible, no facade no walls no windows, exposed concrete structure, construction crane in background, realistic construction site photograph, raw concrete building frame, multiple floors visible, steel reinforcement bars visible on top floor',
    strength: 0.82,
    isOriginal: false,
  },
  {
    order: 2,
    name: 'Fachada em Obra',
    description: 'Construcao ativa — andaimes, tons cinza, trabalhadores',
    prompt: 'Building under active construction with scaffolding covering the facade, same exact camera angle and perspective as the reference image, gray concrete tones, metal scaffolding structure, construction workers visible, windows not yet installed, partial facade with exposed concrete areas, construction safety nets, realistic construction site photograph, building taking shape but not yet finished, some facade panels being installed',
    strength: 0.80,
    isOriginal: false,
  },
  {
    order: 1,
    name: 'Fachada Final',
    description: 'Imagem original — fachada completa',
    prompt: '',
    strength: 0,
    isOriginal: true,
  },
];

const INTERIOR_STAGES: PipelineStageDefinition[] = [
  {
    order: 2,
    name: 'Interior Vazio',
    description: 'Mesmo ambiente sem moveis — apenas estrutura',
    prompt: 'Empty unfurnished interior room, same exact camera angle and perspective as the reference image, same architecture same walls same floor same ceiling same windows, all furniture removed, bare clean walls, empty floor, same natural lighting coming through windows, no decoration no objects no rugs, clean minimalist empty space, realistic photograph of an empty apartment before moving in',
    strength: 0.65,
    isOriginal: false,
  },
  {
    order: 1,
    name: 'Interior Final',
    description: 'Imagem original — interior completo e mobiliado',
    prompt: '',
    strength: 0,
    isOriginal: true,
  },
];

// Drone uses user images directly, no generation needed
const DRONE_STAGES: PipelineStageDefinition[] = [];

const STAGE_DEFINITIONS: Record<PipelineType, PipelineStageDefinition[]> = {
  construction: CONSTRUCTION_STAGES,
  interior: INTERIOR_STAGES,
  drone: DRONE_STAGES,
};

// ========================================
// Public API
// ========================================

export function getStagesForPipelineType(type: PipelineType): PipelineStageDefinition[] {
  return STAGE_DEFINITIONS[type] || [];
}

export function createPipelineStages(
  type: PipelineType,
  originalImageUrl: string
): PipelineStage[] {
  const definitions = getStagesForPipelineType(type);

  return definitions.map((def) => ({
    id: `stage_${def.order}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    order: def.order,
    name: def.name,
    description: def.description,
    prompt: def.prompt,
    strength: def.strength,
    imageUrl: def.isOriginal ? originalImageUrl : undefined,
    isOriginal: def.isOriginal,
    status: def.isOriginal ? ('approved' as const) : ('pending' as const),
    version: 1,
    generatedAt: def.isOriginal ? new Date().toISOString() : undefined,
  }));
}

/**
 * Creates pipeline stages for drone mode using multiple user images.
 * Each image becomes an "original" approved stage.
 */
export function createDroneStages(imageUrls: string[]): PipelineStage[] {
  return imageUrls.map((url, idx) => ({
    id: `stage_${idx + 1}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    order: idx + 1,
    name: `Take ${idx + 1}`,
    description: `Imagem ${idx + 1} do usuario`,
    prompt: '',
    strength: 0,
    imageUrl: url,
    isOriginal: true,
    status: 'approved' as const,
    version: 1,
    generatedAt: new Date().toISOString(),
  }));
}

// ========================================
// Video Prompt Builders (for final video generation)
// ========================================

export function buildPipelineVideoPrompt(type: PipelineType, projectName?: string): string {
  const prompts: Record<PipelineType, string> = {
    construction: `Cinematic architectural construction timelapse of a modern residential building emerging from the ground. The video starts from an empty urban lot and shows the complete construction evolution: foundation and structural skeleton rising floor by floor, active construction phase with scaffolding and workers, and finally the completed facade revealed in its full glory. Smooth structural evolution, scaffolding appearing and disappearing naturally, realistic construction phases with cranes and equipment. Fixed camera angle throughout the entire sequence — the building grows within the frame. Continuous time-lapse with no hard cuts, ultra realistic, high-end real estate visualization. Professional documentary construction aesthetic with dramatic sky and natural lighting. Smooth transitions between each construction phase.`,

    interior: `Cinematic interior transformation timelapse of a modern apartment. The video begins with a completely empty room — bare walls, clean floors, no furniture. Through a smooth and elegant time-lapse, furniture and decor gradually appear: first large pieces like sofas and tables materialize, then smaller items like lamps, cushions, and art. Natural lighting brightens progressively as curtains are placed and windows dressed. The transformation is organic and ordered — no chaotic movements. Soft camera motion, elegant and realistic. Premium real estate interior showcase with warm, aspirational atmosphere. Smooth transitions, no abrupt changes.`,

    drone: `Cinematic drone footage of a modern luxury building with smooth camera movements transitioning between multiple angles and perspectives. Each shot flows seamlessly into the next with elegant transitions. Building lights illuminate progressively, highlighting architectural details — balconies, textures, materials. Subtle close-ups on distinctive design elements. Premium real estate showcase with sophisticated, clean aesthetic. Day-to-night transitions where applicable. Continuous smooth movements, no hard cuts, no excessive effects. Professional architectural cinematography.`,
  };

  let prompt = prompts[type];

  if (projectName) {
    prompt += ` The building is "${projectName}".`;
  }

  prompt += ' AVOID: excessive glow; lens flare; fantasy effects; artificial styling; hard cuts; jump cuts; blurry frames; text overlays; watermarks.';

  return prompt;
}
