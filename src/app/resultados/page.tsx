'use client';

import { useState, useEffect } from 'react';
import JobTracker from '@/components/JobTracker';
import { VideoJob } from '@/lib/types';

interface JobResult extends VideoJob {
  validation?: {
    valid: boolean;
    checks: { name: string; passed: boolean; message: string }[];
  };
}

export default function ResultadosPage() {
  const [result, setResult] = useState<JobResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastJobResult');
    if (stored) {
      setResult(JSON.parse(stored));
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
            className="w-full"
            style={{ maxHeight: '70vh' }}
          />
          <div className="p-4 flex justify-between items-center">
            <span className="text-green-400 text-sm font-medium">Vídeo gerado com sucesso</span>
            <a
              href={result.resultUrl}
              download
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
            {result.validation.checks?.map((check: { name: string; passed: boolean; message: string }, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={check.passed ? 'text-green-400' : 'text-red-400'}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">{check.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <JobTracker job={result as VideoJob} />
    </div>
  );
}
