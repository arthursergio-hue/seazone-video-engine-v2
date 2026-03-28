'use client';

import { useState, useEffect } from 'react';
import JobTracker from '@/components/JobTracker';

interface JobResult {
  jobId?: string;
  id?: string;
  status?: string;
  progress?: number;
  resultUrl?: string;
  apiJobId?: string;
  videoType?: string;
  aspectRatio?: string;
  prompt?: { text?: string; duration?: number } | string;
  parameters?: Record<string, string>;
  logs?: { timestamp: string; message: string; progress: number }[];
  validation?: {
    valid: boolean;
    checks: { name: string; passed: boolean; message: string }[];
    warnings?: string[];
  };
}

export default function ResultadosPage() {
  const [result, setResult] = useState<JobResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastJobResult');
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        setResult(null);
      }
    }
  }, []);

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
      <h1 className="text-2xl font-bold text-white">Resultado</h1>

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
                <p key={i} className="text-yellow-500/70 text-xs">• {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {result.logs && result.logs.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-medium mb-3">Logs</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {result.logs.map((log, i) => (
              <div key={i} className="text-xs font-mono">
                <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-gray-400 ml-2">{log.message}</span>
                <span className="text-blue-400 ml-2">{log.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <JobTracker job={result} />
    </div>
  );
}
