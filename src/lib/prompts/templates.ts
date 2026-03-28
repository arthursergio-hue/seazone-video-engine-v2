import { VideoPrompt, VideoType } from '../types';

// ========================================
// REGRAS CRIATIVAS OFICIAIS - SEAZONE
// ========================================
// Sequência narrativa: Lugar → Experiência → Produto
// Estética: sofisticada, limpa, premium, sem efeitos excessivos
// Movimentos: contínuos, sem cortes bruscos
// Consistência visual entre todos os vídeos

export type VideoPreset =
  | 'video_localizacao_contexto'
  | 'video_rooftop_unidade'
  | 'video_fachada_marca'
  | 'construction_from_facade';

export interface VideoScene {
  name: string;
  description: string;
  duration: number;
  direction: string;
}

export interface OfficialPreset {
  id: VideoPreset;
  name: string;
  narrativeObjective: string;
  tone: string;
  targetDuration: number;
  scenes: VideoScene[];
  visualStyle: string;
  movementRules: string[];
  basePrompt: string;
  directionNotes: string[];
  restrictions: string[];
}

// ========================================
// PRESET 01 – LOCALIZAÇÃO + CONTEXTO URBANO
// ========================================
const presetLocalizacao: OfficialPreset = {
  id: 'video_localizacao_contexto',
  name: 'Localização + Contexto Urbano',
  narrativeObjective: 'Mostrar onde está, como se conecta e por que o endereço é valioso.',
  tone: 'preciso, sofisticado, informativo',
  targetDuration: 11,
  scenes: [
    {
      name: 'Abertura – surgimento do volume',
      description: 'Time-lapse do prédio emergindo do terreno ou massa volumétrica se materializando',
      duration: 2.5,
      direction: 'Começar com fundo neutro ou céu limpo para foco arquitetônico',
    },
    {
      name: 'Localização macro → micro',
      description: 'Croqui estilizado com zoom progressivo até o lote',
      duration: 3,
      direction: 'Movimento contínuo, sem corte brusco',
    },
    {
      name: 'Conexões viárias',
      description: 'Linhas animadas destacando vias principais e acessos',
      duration: 1.5,
      direction: 'Usar mesma linguagem gráfica do mapa',
    },
    {
      name: 'Distância até a praia',
      description: 'Linha animada caminhando + texto discreto "X min a pé"',
      duration: 2,
      direction: 'Inserir escala humana sutil',
    },
    {
      name: 'Marcos principais',
      description: 'Ícones minimalistas: beach clubs, restaurantes, mercado, serviços',
      duration: 1.5,
      direction: 'Ícones surgem com microanimação',
    },
  ],
  visualStyle: 'cinematic, architectural, cartographic elegance',
  movementRules: [
    'Movimentos contínuos de câmera',
    'Sem cortes bruscos',
    'Zoom progressivo e suave',
  ],
  basePrompt: 'Cinematic aerial establishing shot of a premium urban neighborhood. Camera starts wide showing the city skyline and coastline, then smoothly zooms into a specific block revealing a modern luxury building emerging from the urban landscape. Clean graphic overlays show proximity to the beach and key landmarks. Sophisticated cartographic style with minimal icons. Continuous camera movement, no hard cuts. Premium real estate feel with muted, elegant color palette. Natural daylight, soft shadows. The sequence conveys location value and urban connectivity.',
  directionNotes: [
    'Leve pausa visual no lote destacado ao encerrar',
    'Linguagem gráfica discreta, sofisticada e coerente com a marca',
  ],
  restrictions: [
    'Não usar marcação vermelha nas vias',
    'Manter apenas texto e destacar somente ruas principais',
    'Sem efeitos de brilho excessivo',
    'Sem transições chamativas',
  ],
};

// ========================================
// PRESET 02 – ROOFTOP + UNIDADE
// ========================================
const presetRooftop: OfficialPreset = {
  id: 'video_rooftop_unidade',
  name: 'Rooftop + Unidade',
  narrativeObjective: 'Experiência de viver – vista, luz e lifestyle.',
  tone: 'aspiracional, sensorial, elegante',
  targetDuration: 12,
  scenes: [
    {
      name: 'Aproximação aérea',
      description: 'Drone 3D descendo suavemente até o rooftop',
      duration: 2,
      direction: 'Movimento em curva suave',
    },
    {
      name: 'Vida no rooftop',
      description: 'Detalhes do lounge, espreguiçadeiras e áreas sociais',
      duration: 2.5,
      direction: 'Inserir pessoas em escala realista apenas se fizer sentido, sem poluir',
    },
    {
      name: 'Luz e tempo',
      description: 'Time-lapse suave do sol e nuvens',
      duration: 2.5,
      direction: 'Transição contínua, sem hard cut',
    },
    {
      name: 'Entrada na unidade',
      description: 'Entrar na unidade como experiência do cliente',
      duration: 3,
      direction: 'Match-cut com enquadramento externo',
    },
    {
      name: 'Vista da unidade',
      description: 'Apartamento sendo montado elegantemente, enquadramento da paisagem pela janela',
      duration: 2,
      direction: 'Finalizar com leve profundidade de campo / desfoque sutil',
    },
  ],
  visualStyle: 'aspirational lifestyle, warm natural tones, soft depth of field',
  movementRules: [
    'Curvas suaves de drone',
    'Match-cut entre exterior e interior',
    'Transições contínuas sem hard cut',
  ],
  basePrompt: 'Cinematic drone shot descending smoothly in a curved motion towards a luxury rooftop terrace. The camera reveals a stylish lounge area with elegant furniture. Soft golden hour light transitions through a gentle time-lapse of moving clouds and shifting sun. The camera then seamlessly enters the apartment unit through a large glass door, gliding through a beautifully designed interior with modern finishes. The sequence ends with a view through the window, showing the coastline with subtle depth of field blur. Warm, aspirational, lifestyle aesthetic. Continuous smooth movements, no abrupt cuts. Premium real estate showcase.',
  directionNotes: [
    'Rooftop deve transmitir sofisticação e desejo, sem parecer genérico',
    'Entrada na unidade deve parecer natural e fluida',
    'Vista pela janela é cena-chave',
    'Efeito de montagem do interior deve ser elegante, não caricato',
  ],
  restrictions: [
    'Sem visual genérico de stock footage',
    'Sem efeitos excessivos',
    'Sem brilho forte',
    'Sem pessoas em excesso',
  ],
};

// ========================================
// PRESET 03 – FACHADA + MARCA
// ========================================
const presetFachada: OfficialPreset = {
  id: 'video_fachada_marca',
  name: 'Fachada + Marca',
  narrativeObjective: 'Produto, arquitetura e assinatura da marca.',
  tone: 'forte, sofisticado, memorável',
  targetDuration: 13,
  scenes: [
    {
      name: 'Detalhe arquitetônico',
      description: 'Close em sacadas e início da iluminação',
      duration: 1.5,
      direction: 'Começar em silêncio visual',
    },
    {
      name: 'Materiais',
      description: 'Texturas, brise, esquadrias',
      duration: 1.5,
      direction: 'Corte rítmico',
    },
    {
      name: 'Transição dia → noite',
      description: 'Céu escurecendo + iluminação ativando',
      duration: 2.5,
      direction: 'Cena-chave do vídeo',
    },
    {
      name: 'Fachada noturna',
      description: 'Prédio totalmente iluminado',
      duration: 2,
      direction: 'Plano hero',
    },
    {
      name: 'Fachada completa',
      description: 'Enquadramento frontal limpo',
      duration: 1.5,
      direction: 'Câmera estável',
    },
    {
      name: 'Perspectiva aérea do entorno',
      description: 'Drone 3D mostrando bairro e contexto para encerramento',
      duration: 2,
      direction: 'Reforçar localização premium ao anoitecer',
    },
    {
      name: 'Logo final',
      description: 'Logomarca final oficial da Seazone',
      duration: 2,
      direction: 'Glow branco neutro, fundo escuro elegante. Arquivo: "Logo reveal - Seazone.mov"',
    },
  ],
  visualStyle: 'architectural hero, day-to-night transition, premium brand reveal',
  movementRules: [
    'Começar com close e abrir progressivamente',
    'Transição dia-noite como cena central',
    'Câmera estável nos planos hero',
    'Drone suave no encerramento',
  ],
  basePrompt: 'Cinematic close-up of modern architectural details — balconies, materials, textures, and facade elements beginning to catch the first artificial light. The camera pulls back as the sky transitions from golden sunset to deep blue twilight. Building lights activate progressively, revealing the full illuminated facade in a hero shot. Camera stabilizes for a clean frontal composition, then rises into a smooth aerial perspective showing the neighborhood at dusk. The sequence ends with a subtle, premium logo reveal on a dark elegant background with neutral white glow. Strong, sophisticated, memorable. Continuous movements, no excessive effects or bright glare.',
  directionNotes: [
    'Sempre usar logomarca oficial Seazone no final',
    'Revelação da marca deve ser sutil, premium e limpa',
    'A transição dia-noite é o momento mais importante do vídeo',
  ],
  restrictions: [
    'Não usar brilho exagerado no logo',
    'Sem efeitos de lens flare fortes',
    'Sem visual artificial ou "fantasia"',
    'Manter realismo arquitetônico',
  ],
};

// ========================================
// PRESET ESPECIAL – CONSTRUÇÃO A PARTIR DA FACHADA
// ========================================
const presetConstructionFromFacade: OfficialPreset = {
  id: 'construction_from_facade',
  name: 'Construção a partir da Fachada (Simulação)',
  narrativeObjective: 'Simular a evolução construtiva do prédio baseando-se na fachada final.',
  tone: 'dinâmico, documentário, aspiracional',
  targetDuration: 8,
  scenes: [
    {
      name: 'Terreno inicial',
      description: 'Vista do terreno vazio ou fase inicial de obra',
      duration: 2,
      direction: 'Gerado por IA a partir da fachada — mostrar fase inicial',
    },
    {
      name: 'Evolução estrutural',
      description: 'Estrutura de concreto se formando progressivamente',
      duration: 3,
      direction: 'Time-lapse estilizado da construção imaginada',
    },
    {
      name: 'Fachada se completando',
      description: 'Materiais e acabamentos sendo aplicados até revelar a fachada final',
      duration: 3,
      direction: 'Transição suave para a imagem real da fachada',
    },
  ],
  visualStyle: 'construction time-lapse, documentary, progression reveal',
  movementRules: [
    'Órbita lenta em torno da construção',
    'Sem cortes bruscos',
    'Time-lapse suave e contínuo',
  ],
  basePrompt: 'Cinematic time-lapse simulation of a modern luxury building being constructed from the ground up. Starting from an empty lot, the concrete structure rises progressively — columns, floors, and the main frame take shape. Construction cranes and scaffolding appear and disappear as the building evolves. Materials are applied to the facade — glass, concrete panels, balcony railings. The sequence ends with the completed building matching the provided facade image. Dramatic sky with moving clouds. Slow orbital camera movement. Professional construction documentary aesthetic. This is a visual simulation based on the final facade, not real construction footage.',
  directionNotes: [
    'Deixar claro que é simulação visual, não documentação real de obra',
    'Transição final deve convergir com a fachada real fornecida',
  ],
  restrictions: [
    'Não apresentar como imagem real de obra',
    'Manter fidelidade arquitetônica com a fachada fornecida',
    'Sem efeitos excessivos',
  ],
};

// ========================================
// PRESETS REGISTRY
// ========================================
export const officialPresets: Record<VideoPreset, OfficialPreset> = {
  video_localizacao_contexto: presetLocalizacao,
  video_rooftop_unidade: presetRooftop,
  video_fachada_marca: presetFachada,
  construction_from_facade: presetConstructionFromFacade,
};

export function getPresetForVideoType(videoType: VideoType, constructionFromFacade?: boolean): OfficialPreset {
  if (videoType === 'construcao' && constructionFromFacade) {
    return officialPresets.construction_from_facade;
  }
  const mapping: Record<VideoType, VideoPreset> = {
    fachada: 'video_fachada_marca',
    interior: 'video_rooftop_unidade',
    construcao: 'video_localizacao_contexto',
    unidade: 'video_rooftop_unidade',
  };
  return officialPresets[mapping[videoType]];
}

// ========================================
// GLOBAL CREATIVE RULES
// ========================================
export const CREATIVE_RULES = {
  narrative_sequence: 'Lugar → Experiência → Produto',
  global_restrictions: [
    'Não usar efeitos com brilho excessivo',
    'Evitar visual exagerado ou artificial',
    'Manter estética sofisticada, limpa e premium',
    'Usar movimentos contínuos',
    'Evitar cortes bruscos',
    'Evitar cenas muito curtas (abaixo de 1s)',
    'Manter consistência visual entre todos os vídeos',
    'Manter realismo arquitetônico e apelo comercial premium',
  ],
  social_media_formats: {
    teaser: 6,
    story: 15,
    reel_short: 30,
    reel_long: 90,
  },
  logo_rules: {
    file: 'Logo reveal - Seazone.mov',
    style: 'glow branco neutro, fundo escuro elegante',
    applies_to: 'video_fachada_marca',
  },
};

// ========================================
// VIDEO PROMPT TEMPLATES (legacy compat + new preset-based)
// ========================================
const templates: Record<VideoType, VideoPrompt> = {
  fachada: {
    text: officialPresets.video_fachada_marca.basePrompt,
    videoType: 'fachada',
    cameraMovement: 'slow tilt up, day-to-night transition, hero shot',
    visualStyle: 'architectural hero, premium brand reveal',
    lighting: 'golden hour transitioning to twilight, building lights activating',
    mood: 'strong, sophisticated, memorable',
    duration: officialPresets.video_fachada_marca.targetDuration,
  },
  interior: {
    text: officialPresets.video_rooftop_unidade.basePrompt,
    videoType: 'interior',
    cameraMovement: 'drone descent curve, smooth interior dolly, match-cut',
    visualStyle: 'aspirational lifestyle, warm natural tones',
    lighting: 'golden hour, soft natural light through windows',
    mood: 'aspirational, sensorial, elegant',
    duration: officialPresets.video_rooftop_unidade.targetDuration,
  },
  construcao: {
    text: officialPresets.video_localizacao_contexto.basePrompt,
    videoType: 'construcao',
    cameraMovement: 'aerial establishing, progressive zoom, continuous',
    visualStyle: 'cinematic, architectural, cartographic elegance',
    lighting: 'natural daylight, soft shadows',
    mood: 'precise, sophisticated, informative',
    duration: officialPresets.video_localizacao_contexto.targetDuration,
  },
  unidade: {
    text: officialPresets.video_rooftop_unidade.basePrompt,
    videoType: 'unidade',
    cameraMovement: 'walkthrough dolly, smooth interior flow',
    visualStyle: 'real estate tour, premium finish, lifestyle',
    lighting: 'bright, soft, flattering, golden hour',
    mood: 'home, comfort, luxury, aspirational',
    duration: officialPresets.video_rooftop_unidade.targetDuration,
  },
};

export function getPromptTemplate(videoType: VideoType): VideoPrompt {
  return { ...templates[videoType] };
}

export function buildPrompt(videoType: VideoType, customizations?: Partial<VideoPrompt>): VideoPrompt {
  const base = getPromptTemplate(videoType);
  if (!customizations) return base;

  return {
    ...base,
    ...customizations,
    text: customizations.text || base.text,
    videoType,
  };
}

export function buildPresetPrompt(preset: OfficialPreset, context?: { empreendimento?: string; constructionFromFacade?: boolean }): string {
  let prompt = preset.basePrompt;

  if (context?.empreendimento) {
    prompt += ` The building is "${context.empreendimento}".`;
  }

  if (context?.constructionFromFacade) {
    prompt += ' NOTE: This is a visual simulation based on the final facade image, not real construction footage.';
  }

  // Append global restrictions as negative guidance
  const restrictions = [...preset.restrictions, ...CREATIVE_RULES.global_restrictions];
  const uniqueRestrictions = Array.from(new Set(restrictions));
  prompt += ` AVOID: ${uniqueRestrictions.join('; ')}.`;

  return prompt;
}
