'use client';

import { VideoLog, VideoStatus } from '@/lib/types';

interface Props {
  status: VideoStatus;
  progress: number;
  logs: VideoLog[];
}

const PIPELINE_STEPS = [
  { key: 'upload', label: 'Enviando imagem', minProgress: 0 },
  { key: 'prepare', label: 'Preparando geração', minProgress: 10 },
  { key: 'prompt', label: 'Gerando prompt com preset oficial', minProgress: 30 },
  { key: 'send', label: 'Enviando para a IA', minProgress: 50 },
  { key: 'generate', label: 'Gerando vídeo', minProgress: 70 },
  { key: 'complete', label: 'Finalizado', minProgress: 100 },
];

export default function ProgressTracker({ status, progress, logs }: Props) {
  const isError = status === 'failed';
  const isComplete = status === 'completed';

  // Find current step
  const currentStepIdx = PIPELINE_STEPS.findIndex((s, i) => {
    const next = PIPELINE_STEPS[i + 1];
    return !next || progress < next.minProgress;
  });

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Progresso</h3>
        <span
          className={`text-sm px-2 py-1 rounded ${
            isError
              ? 'bg-red-900/50 text-red-400'
              : isComplete
                ? 'bg-green-900/50 text-green-400'
                : 'bg-blue-900/50 text-blue-400'
          }`}
        >
          {isError ? 'Erro' : isComplete ? 'Finalizado' : `${progress}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
            isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pipeline steps */}
      <div className="space-y-1">
        {PIPELINE_STEPS.map((step, i) => {
          const isDone = progress > step.minProgress || (step.minProgress === 100 && isComplete);
          const isCurrent = i === currentStepIdx && !isComplete && !isError;
          const isPending = !isDone && !isCurrent;

          if (step.key === 'complete' && !isComplete) return null;

          return (
            <div key={step.key} className="flex items-center gap-2 text-sm">
              {isDone ? (
                <span className="text-green-400 w-5 text-center">✓</span>
              ) : isCurrent ? (
                <span className="w-5 text-center">
                  <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </span>
              ) : (
                <span className="text-gray-700 w-5 text-center">○</span>
              )}
              <span className={
                isDone ? 'text-gray-500' : isCurrent ? 'text-white' : 'text-gray-700'
              }>
                {step.label}
              </span>
              {isCurrent && step.key === 'generate' && progress > 70 && (
                <span className="text-blue-400 text-xs ml-auto">{progress}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error details */}
      {isError && logs.length > 0 && (
        <div className="bg-red-950/50 border border-red-900 rounded p-3 text-sm text-red-400">
          {logs[logs.length - 1]?.message || 'Erro desconhecido'}
        </div>
      )}
    </div>
  );
}
