'use client';

import { useState, useEffect } from 'react';
import { loadAllImages } from '@/lib/storage';

interface RefImage {
  id: string;
  url: string;
  filename: string;
}

interface JobResult {
  jobId?: string;
  apiJobId?: string;
  status?: string;
  resultUrl?: string;
  // Context
  provider?: string;
  providerName?: string;
  videoType?: string;
  aspectRatio?: string;
  constructionFromFacade?: boolean;
  presetId?: string;
  presetName?: string;
  targetDuration?: number;
  prompt?: string | { text?: string; duration?: number };
  strategy?: { videoType?: string; approach?: string; preset?: string; constructionFromFacade?: boolean };
  // Images
  selectedImage?: { id: string; url: string; filename: string; category: string } | null;
  referenceImageCount?: number;
  referenceImages?: RefImage[];
  // Project
  projectName?: string;
  projectId?: string;
  completedAt?: string;
  // Validation
  validation?: {
    valid: boolean;
    checks: { name: string; passed: boolean; message: string }[];
    warnings?: string[];
  };
  logs?: { timestamp: string; message: string; progress: number }[];
}

export default function ResultadosPage() {
  const [result, setResult] = useState<JobResult | null>(null);
  const [imageDataMap, setImageDataMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem('lastJobResult');
      if (!stored) return;

      try {
        const data = JSON.parse(stored) as JobResult;
        setResult(data);

        // Load image previews from IndexedDB
        const ids: string[] = [];
        if (data.selectedImage?.id) ids.push(data.selectedImage.id);
        if (data.referenceImages) {
          for (const img of data.referenceImages) {
            if (img.id) ids.push(img.id);
          }
        }
        if (ids.length > 0) {
          const map = await loadAllImages(ids);
          setImageDataMap(map);
        }
      } catch {
        setResult(null);
      }
    }
    init();
  }, []);

  function getDisplayUrl(img: { id: string; url: string }): string {
    const fromDb = imageDataMap[img.id];
    if (fromDb && fromDb.startsWith('data:')) return fromDb;
    if (img.url && img.url.startsWith('http')) return img.url;
    return '';
  }

  const promptText = typeof result?.prompt === 'string'
    ? result.prompt
    : result?.prompt?.text || '';

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nenhum resultado disponível ainda.</p>
        <p className="text-gray-500 text-sm mt-2">Gere um vídeo primeiro para ver os resultados aqui.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resultado</h1>
        {result.projectName && (
          <p className="text-gray-400 mt-1">Projeto: <span className="text-white">{result.projectName}</span></p>
        )}
      </div>

      {/* Video player */}
      {result.resultUrl && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <video
            src={result.resultUrl}
            controls
            autoPlay
            className="w-full"
            style={{ maxHeight: '70vh' }}
          />
          <div className="p-4 flex justify-between items-center">
            <span className="text-green-400 text-sm font-medium">
              Vídeo gerado com sucesso
              {result.apiJobId?.startsWith('demo_') && ' (Demo)'}
            </span>
            <a
              href={result.resultUrl}
              download={`video_${result.videoType || 'seazone'}.mp4`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              Download
            </a>
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-gray-900 rounded-lg p-6 space-y-4">
        <h3 className="text-white font-medium">Resumo da Geração</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {result.providerName && (
            <div>
              <span className="text-gray-500 block">Motor de IA</span>
              <p className="text-white font-medium">{result.providerName}</p>
            </div>
          )}
          {result.presetName && (
            <div>
              <span className="text-gray-500 block">Preset</span>
              <p className="text-white font-medium">{result.presetName}</p>
            </div>
          )}
          {result.videoType && (
            <div>
              <span className="text-gray-500 block">Tipo de Vídeo</span>
              <p className="text-white capitalize">{result.videoType}</p>
            </div>
          )}
          {result.aspectRatio && (
            <div>
              <span className="text-gray-500 block">Formato</span>
              <p className="text-white">{result.aspectRatio}</p>
            </div>
          )}
          {result.targetDuration && (
            <div>
              <span className="text-gray-500 block">Duração Alvo</span>
              <p className="text-white">{result.targetDuration}s</p>
            </div>
          )}
          {result.completedAt && (
            <div>
              <span className="text-gray-500 block">Gerado em</span>
              <p className="text-white">{new Date(result.completedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        {result.constructionFromFacade && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded p-2 text-xs text-yellow-400">
            Modo: Construção a partir da Fachada (simulação visual)
          </div>
        )}

        {result.strategy?.approach && (
          <div>
            <span className="text-gray-500 text-sm block">Estratégia</span>
            <p className="text-gray-300 text-sm">{result.strategy.approach}</p>
          </div>
        )}
      </div>

      {/* Images used */}
      {(result.selectedImage || (result.referenceImages && result.referenceImages.length > 0)) && (
        <div className="bg-gray-900 rounded-lg p-6 space-y-3">
          <h3 className="text-white font-medium">
            Imagens Utilizadas
            {result.referenceImages && result.referenceImages.length > 0 && (
              <span className="text-gray-500 text-sm ml-2">
                ({1 + result.referenceImages.length} total)
              </span>
            )}
          </h3>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Primary image */}
            {result.selectedImage && (
              <div className="flex-shrink-0">
                <div className="relative rounded-lg overflow-hidden border-2 border-yellow-500">
                  {getDisplayUrl(result.selectedImage) ? (
                    <img src={getDisplayUrl(result.selectedImage)} alt={result.selectedImage.filename} className="w-28 h-28 object-cover" />
                  ) : (
                    <div className="w-28 h-28 bg-gray-800 flex items-center justify-center text-gray-600 text-xs">Imagem</div>
                  )}
                  <span className="absolute top-1 left-1 bg-yellow-500 text-black text-[9px] font-bold px-1 py-0.5 rounded">PRINCIPAL</span>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-gray-300 px-1 py-0.5 text-center">
                    {result.selectedImage.category}
                  </span>
                </div>
                <p className="text-gray-600 text-[10px] mt-1 truncate w-28">{result.selectedImage.filename}</p>
              </div>
            )}

            {/* Reference images */}
            {result.referenceImages?.map((img) => (
              <div key={img.id} className="flex-shrink-0">
                <div className="relative rounded-lg overflow-hidden border border-gray-700">
                  {getDisplayUrl(img) ? (
                    <img src={getDisplayUrl(img)} alt={img.filename} className="w-28 h-28 object-cover" />
                  ) : (
                    <div className="w-28 h-28 bg-gray-800 flex items-center justify-center text-gray-600 text-xs">Ref</div>
                  )}
                  <span className="absolute top-1 left-1 bg-gray-700 text-gray-300 text-[9px] px-1 py-0.5 rounded">REF</span>
                </div>
                <p className="text-gray-600 text-[10px] mt-1 truncate w-28">{img.filename}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt */}
      {promptText && (
        <div className="bg-gray-900 rounded-lg p-6 space-y-2">
          <h3 className="text-white font-medium">Prompt Utilizado</h3>
          <p className="text-gray-400 text-sm leading-relaxed bg-gray-950 p-4 rounded font-mono break-words whitespace-pre-wrap">
            {promptText}
          </p>
        </div>
      )}

      {/* Validation */}
      {result.validation && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-medium mb-3">Validação</h3>
          <div className="space-y-2">
            {result.validation.checks?.map((check, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={check.passed ? 'text-green-400' : 'text-red-400'}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">{check.message}</span>
              </div>
            ))}
          </div>
          {result.validation.warnings && result.validation.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-yellow-500 text-xs font-medium mb-1">Avisos:</p>
              {result.validation.warnings.map((w, i) => (
                <p key={i} className="text-yellow-500/70 text-xs">- {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Technical details */}
      <div className="bg-gray-900 rounded-lg p-6 space-y-3">
        <h3 className="text-white font-medium">Detalhes Técnicos</h3>
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          {result.jobId && (
            <div>
              <span className="text-gray-600">Job ID</span>
              <p className="text-gray-400 break-all">{result.jobId}</p>
            </div>
          )}
          {result.apiJobId && (
            <div>
              <span className="text-gray-600">API Job ID</span>
              <p className="text-gray-400 break-all">{result.apiJobId}</p>
            </div>
          )}
          {result.provider && (
            <div>
              <span className="text-gray-600">Provider</span>
              <p className="text-gray-400">{result.provider}</p>
            </div>
          )}
          {result.presetId && (
            <div>
              <span className="text-gray-600">Preset ID</span>
              <p className="text-gray-400">{result.presetId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
