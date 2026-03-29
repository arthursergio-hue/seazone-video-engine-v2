'use client';

import { PipelineType, PIPELINE_TYPE_LABELS, PIPELINE_TYPE_DESCRIPTIONS } from '@/lib/types/pipeline';

interface Props {
  selected: PipelineType | null;
  onSelect: (type: PipelineType) => void;
  hasMultipleImages: boolean;
}

const PIPELINE_TYPES: { type: PipelineType; icon: string; stageCount: string }[] = [
  { type: 'construction', icon: '🏗', stageCount: '4 estagios' },
  { type: 'interior', icon: '🛋', stageCount: '2 estagios' },
  { type: 'drone', icon: '🎬', stageCount: 'multiplas imagens' },
];

export default function PipelineTypeSelector({ selected, onSelect, hasMultipleImages }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Tipo de Pipeline</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PIPELINE_TYPES.map(({ type, icon, stageCount }) => {
          const isSelected = selected === type;
          const isDroneDisabled = type === 'drone' && !hasMultipleImages;

          return (
            <button
              key={type}
              onClick={() => !isDroneDisabled && onSelect(type)}
              disabled={isDroneDisabled}
              className={`text-left p-4 rounded-lg border transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : isDroneDisabled
                    ? 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <span className="text-white font-medium">{PIPELINE_TYPE_LABELS[type]}</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">{PIPELINE_TYPE_DESCRIPTIONS[type]}</p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                {stageCount}
              </span>
              {isDroneDisabled && (
                <p className="text-yellow-500 text-xs mt-1">Requer multiplas imagens</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
