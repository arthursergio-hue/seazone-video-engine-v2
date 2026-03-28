import { VideoJob } from '../types';

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export class VideoValidatorAgent {
  validate(job: VideoJob): ValidationResult {
    const checks: ValidationCheck[] = [];

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

    // Check prompt was generated
    checks.push({
      name: 'prompt_generated',
      passed: job.prompt.text.length > 0,
      message: job.prompt.text.length > 0 ? 'Prompt gerado' : 'Prompt vazio',
    });

    return {
      valid: checks.every((c) => c.passed),
      checks,
    };
  }
}
