'use client';

import { PipelinePhase } from '@/lib/types/pipeline';

interface Props {
  phase: PipelinePhase;
}

const PHASES: { key: PipelinePhase; label: string }[] = [
  { key: 'select_type', label: 'Tipo' },
  { key: 'generate_images', label: 'Gerar Imagens' },
  { key: 'approve_images', label: 'Aprovar' },
  { key: 'generate_video', label: 'Gerar Video' },
  { key: 'completed', label: 'Resultado' },
];

export default function PipelineProgress({ phase }: Props) {
  const currentIndex = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="flex items-center gap-2 text-sm">
      {PHASES.map((p, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;

        return (
          <div key={p.key} className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isDone
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                    : 'bg-gray-800 text-gray-500'
              }`}
            >
              {isDone ? '✓ ' : ''}
              {p.label}
            </span>
            {i < PHASES.length - 1 && (
              <span className={isDone ? 'text-green-600' : 'text-gray-700'}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
