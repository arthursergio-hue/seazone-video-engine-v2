'use client';

import { VideoLog, VideoStatus } from '@/lib/types';

interface Props {
  status: VideoStatus;
  progress: number;
  logs: VideoLog[];
}

const statusLabels: Record<VideoStatus, string> = {
  pending: 'Aguardando',
  preparing: 'Preparando imagens',
  generating_prompt: 'Gerando prompt',
  sending_to_api: 'Enviando para API',
  processing: 'Processando vídeo',
  validating: 'Validando resultado',
  completed: 'Finalizado',
  failed: 'Erro',
};

export default function ProgressTracker({ status, progress, logs }: Props) {
  const isError = status === 'failed';
  const isComplete = status === 'completed';

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
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
          {statusLabels[status]}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-400 text-sm text-right">{progress}%</p>

      {/* Logs */}
      <div className="bg-gray-950 rounded p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-400">
            <span className="text-gray-600">[{log.progress}%]</span> {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
