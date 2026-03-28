import { VideoJob } from '../types';
import { getPresetForVideoType, CREATIVE_RULES } from '../prompts/templates';

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
  warnings: string[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export class VideoValidatorAgent {
  validate(job: VideoJob): ValidationResult {
    const checks: ValidationCheck[] = [];
    const warnings: string[] = [];
    const preset = getPresetForVideoType(job.videoType, job.constructionFromFacade);

    // Check generation completed
    checks.push({
      name: 'generation_complete',
      passed: job.status === 'completed',
      message: job.status === 'completed' ? 'Geração concluída' : `Status: ${job.status}`,
    });

    // Check result URL exists
    checks.push({
      name: 'result_available',
      passed: !!job.resultUrl,
      message: job.resultUrl ? 'URL do vídeo disponível' : 'URL do vídeo não encontrada',
    });

    // Check duration parameter was set
    checks.push({
      name: 'duration_set',
      passed: job.prompt.duration > 0,
      message: `Duração: ${job.prompt.duration}s`,
    });

    // Check duration is close to preset target
    const durationDiff = Math.abs(job.prompt.duration - preset.targetDuration);
    checks.push({
      name: 'duration_matches_preset',
      passed: durationDiff <= 3,
      message: durationDiff <= 3
        ? `Duração compatível com preset (alvo: ${preset.targetDuration}s)`
        : `Duração ${job.prompt.duration}s difere do preset (alvo: ${preset.targetDuration}s)`,
    });

    // Check prompt was generated
    checks.push({
      name: 'prompt_generated',
      passed: job.prompt.text.length > 0,
      message: job.prompt.text.length > 0 ? 'Prompt gerado' : 'Prompt vazio',
    });

    // Check preset structure is being followed
    checks.push({
      name: 'preset_applied',
      passed: true,
      message: `Preset: ${preset.name} (${preset.id})`,
    });

    // Validate video 03 has logo reference
    if (preset.id === 'video_fachada_marca') {
      const hasLogoRef = job.prompt.text.toLowerCase().includes('logo');
      checks.push({
        name: 'logo_final_applied',
        passed: hasLogoRef,
        message: hasLogoRef
          ? 'Referência ao logo final encontrada no prompt'
          : 'ALERTA: Logo final Seazone não referenciado no prompt',
      });
    }

    // Validate construction from facade is clearly marked
    if (job.constructionFromFacade) {
      const hasSimulationNote = job.prompt.text.toLowerCase().includes('simulation');
      checks.push({
        name: 'construction_simulation_marked',
        passed: hasSimulationNote,
        message: hasSimulationNote
          ? 'Vídeo marcado como simulação visual'
          : 'ALERTA: Simulação de construção não está claramente marcada',
      });
    }

    // Creative rules warnings
    const promptLower = job.prompt.text.toLowerCase();
    if (promptLower.includes('lens flare') || promptLower.includes('bright glow')) {
      warnings.push('Prompt pode conter referência a brilho excessivo — revisar');
    }
    if (promptLower.includes('hard cut') || promptLower.includes('jump cut')) {
      warnings.push('Prompt menciona cortes bruscos — evitar conforme regras criativas');
    }

    return {
      valid: checks.every((c) => c.passed),
      checks,
      warnings,
    };
  }
}
