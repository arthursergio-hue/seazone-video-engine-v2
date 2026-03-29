'use client';

import { PipelineStage, StageStatus } from '@/lib/types/pipeline';

interface Props {
  stage: PipelineStage;
  onApprove: (stageId: string) => void;
  onRegenerate: (stageId: string) => void;
}

const STATUS_STYLES: Record<StageStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Pendente' },
  generating: { bg: 'bg-blue-600', text: 'text-blue-100', label: 'Gerando...' },
  generated: { bg: 'bg-yellow-600', text: 'text-yellow-100', label: 'Aguardando aprovacao' },
  approved: { bg: 'bg-green-600', text: 'text-green-100', label: 'Aprovado' },
  failed: { bg: 'bg-red-600', text: 'text-red-100', label: 'Falhou' },
};

export default function StageCard({ stage, onApprove, onRegenerate }: Props) {
  const style = STATUS_STYLES[stage.status];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Image preview */}
      <div className="aspect-video bg-gray-800 relative">
        {stage.imageUrl ? (
          <img
            src={stage.imageUrl}
            alt={stage.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            {stage.status === 'generating' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Gerando...</span>
              </div>
            ) : (
              <span className="text-sm">Sem imagem</span>
            )}
          </div>
        )}

        {/* Stage order badge */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Estagio {stage.order}
        </div>

        {/* Original badge */}
        {stage.isOriginal && (
          <div className="absolute top-2 right-2 bg-blue-600/80 text-white text-xs px-2 py-1 rounded">
            Original
          </div>
        )}

        {/* Version badge */}
        {!stage.isOriginal && stage.version > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-gray-300 text-xs px-2 py-1 rounded">
            v{stage.version}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-medium">{stage.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>
        <p className="text-gray-500 text-xs">{stage.description}</p>

        {/* Actions */}
        {!stage.isOriginal && (
          <div className="flex gap-2 pt-1">
            {stage.status === 'generated' && (
              <button
                onClick={() => onApprove(stage.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded transition"
              >
                Aprovar
              </button>
            )}
            {(stage.status === 'generated' || stage.status === 'approved' || stage.status === 'failed') && (
              <button
                onClick={() => onRegenerate(stage.id)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded transition"
              >
                Regenerar
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {stage.status === 'failed' && stage.error && (
          <p className="text-red-400 text-xs">{stage.error}</p>
        )}
      </div>
    </div>
  );
}
