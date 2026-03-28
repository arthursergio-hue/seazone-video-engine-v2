'use client';

import { VideoJob } from '@/lib/types';

interface Props {
  job: VideoJob;
}

export default function JobTracker({ job }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      <h3 className="text-white font-medium">Rastreamento do Job</h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Job ID</span>
          <p className="text-gray-300 font-mono">{job.id}</p>
        </div>
        <div>
          <span className="text-gray-500">API Job ID</span>
          <p className="text-gray-300 font-mono">{job.apiJobId || '—'}</p>
        </div>
        <div>
          <span className="text-gray-500">Tipo</span>
          <p className="text-gray-300">{job.videoType}</p>
        </div>
        <div>
          <span className="text-gray-500">Status</span>
          <p className="text-gray-300">{job.status}</p>
        </div>
        <div>
          <span className="text-gray-500">Formato</span>
          <p className="text-gray-300">{job.aspectRatio}</p>
        </div>
        <div>
          <span className="text-gray-500">Duração</span>
          <p className="text-gray-300">{job.prompt.duration}s</p>
        </div>
      </div>

      <div>
        <span className="text-gray-500 text-sm">Prompt usado</span>
        <p className="text-gray-400 text-sm mt-1 bg-gray-950 p-3 rounded font-mono">
          {job.prompt.text}
        </p>
      </div>

      <div>
        <span className="text-gray-500 text-sm">Parâmetros</span>
        <div className="mt-1 bg-gray-950 p-3 rounded font-mono text-xs text-gray-400">
          {Object.entries(job.parameters).map(([key, value]) => (
            <div key={key}>
              {key}: {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
