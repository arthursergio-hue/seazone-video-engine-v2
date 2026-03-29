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
  const isProcessing = status === 'processing';

  // For the processing phase, calculate a sub-progress (0-100%) within the 70-100 range
  const processingSubProgress = isProcessing
    ? Math.round(Math.min(100, Math.max(0, ((progress - 70) / 30) * 100)))
    : isComplete ? 100 : 0;

  // Deduplicate logs: remove repeated "Processando vídeo..." entries, keep only unique messages
  const uniqueLogs: VideoLog[] = [];
  const seenMessages = new Set<string>();
  for (const log of logs) {
    // Normalize: strip progress-varying parts for dedup
    const key = log.message.replace(/\d+%/, '').replace(/\.\.\.$/, '').trim();
    if (!seenMessages.has(key)) {
      seenMessages.add(key);
      uniqueLogs.push(log);
    }
  }

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

      {/* Main Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-400 text-sm text-right">{progress}%</p>

      {/* Processing sub-progress */}
      {isProcessing && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-400 text-sm font-medium">Gerando vídeo com IA</span>
            </div>
            <span className="text-blue-400 text-sm">{processingSubProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${processingSubProgress}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">
            {processingSubProgress < 30 ? 'Analisando imagem e preparando frames...' :
             processingSubProgress < 60 ? 'Renderizando cenas do vídeo...' :
             processingSubProgress < 90 ? 'Finalizando composição...' :
             'Quase pronto...'}
          </p>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-950 rounded p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
        {uniqueLogs.map((log, i) => (
          <div key={i} className="text-gray-400">
            <span className="text-gray-600">[{log.progress}%]</span> {log.message}
          </div>
        ))}
        {isProcessing && (
          <div className="text-blue-400">
            <span className="text-gray-600">[{progress}%]</span> Gerando vídeo... ({processingSubProgress}%)
          </div>
        )}
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
