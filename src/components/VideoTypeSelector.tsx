'use client';

import { VideoType, AspectRatio } from '@/lib/types';

interface Props {
  selectedType: VideoType;
  selectedRatio: AspectRatio;
  onTypeChange: (type: VideoType) => void;
  onRatioChange: (ratio: AspectRatio) => void;
}

const videoTypes: { value: VideoType; label: string; description: string }[] = [
  { value: 'fachada', label: 'Fachada', description: 'Animação cinematográfica da fachada do empreendimento' },
  { value: 'interior', label: 'Interior', description: 'Tour pelos ambientes internos com movimento suave' },
  { value: 'construcao', label: 'Construção', description: 'Vídeo time-lapse da obra' },
  { value: 'unidade', label: 'Unidade', description: 'Walkthrough elegante por uma unidade específica' },
];

const ratios: { value: AspectRatio; label: string }[] = [
  { value: '9:16', label: '9:16 (Stories/Reels)' },
  { value: '4:5', label: '4:5 (Feed)' },
  { value: '16:9', label: '16:9 (YouTube)' },
];

export default function VideoTypeSelector({ selectedType, selectedRatio, onTypeChange, onRatioChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-medium mb-3">Tipo de Vídeo</h3>
        <div className="grid grid-cols-2 gap-3">
          {videoTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`p-4 rounded-lg text-left transition border ${
                selectedType === t.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <p className="text-white font-medium">{t.label}</p>
              <p className="text-gray-400 text-sm mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-medium mb-3">Formato</h3>
        <div className="flex gap-3">
          {ratios.map((r) => (
            <button
              key={r.value}
              onClick={() => onRatioChange(r.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                selectedRatio === r.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
