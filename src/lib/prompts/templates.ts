import { VideoPrompt, VideoType } from '../types';

const templates: Record<VideoType, VideoPrompt> = {
  fachada: {
    text: 'Cinematic slow upward tilt revealing the full facade of a modern luxury building. The camera starts at street level, capturing the entrance details, then smoothly tilts upward to reveal the complete architecture against a clear sky. Golden hour lighting with warm tones reflecting off glass surfaces. Premium real estate feel with subtle lens flare.',
    videoType: 'fachada',
    cameraMovement: 'slow tilt up',
    visualStyle: 'cinematic, architectural photography',
    lighting: 'golden hour, warm natural light',
    mood: 'luxury, modern, sophisticated',
    duration: 5,
  },
  interior: {
    text: 'Smooth dolly shot gliding through a beautifully designed interior space. The camera moves forward at eye level, passing through rooms with elegant furniture and decor. Soft natural light streams through large windows, creating a warm and inviting atmosphere. High-end real estate showcase with attention to materials and finishes.',
    videoType: 'interior',
    cameraMovement: 'forward dolly',
    visualStyle: 'interior design showcase, warm tones',
    lighting: 'soft natural light through windows',
    mood: 'welcoming, elegant, spacious',
    duration: 5,
  },
  construcao: {
    text: 'Dynamic time-lapse style video showing a building under construction. The camera slowly orbits around the construction site, capturing cranes, structure, and progress. Dramatic lighting with clouds moving in the background. Professional construction documentation feel with a sense of scale and achievement.',
    videoType: 'construcao',
    cameraMovement: 'slow orbit',
    visualStyle: 'construction documentary, dramatic',
    lighting: 'dramatic sky, natural daylight',
    mood: 'progress, scale, achievement',
    duration: 5,
  },
  unidade: {
    text: 'Elegant walkthrough of a residential unit. The camera enters through the front door and smoothly navigates through the living room, kitchen, bedrooms, and balcony. Each room is bathed in soft, flattering light. The movement is steady and professional, showcasing the layout and flow of the space. Luxury real estate tour aesthetic.',
    videoType: 'unidade',
    cameraMovement: 'walkthrough dolly',
    visualStyle: 'real estate tour, premium finish',
    lighting: 'bright, soft, flattering',
    mood: 'home, comfort, luxury',
    duration: 5,
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
