'use client';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job: any;
}

export default function JobTracker({ job }: Props) {
  const id = job.id || job.jobId || '—';
  const apiId = job.apiJobId || '—';
  const videoType = job.videoType || '—';
  const status = job.status || '—';
  const aspectRatio = job.aspectRatio || '—';

  const promptText = typeof job.prompt === 'string'
    ? job.prompt
    : job.prompt?.text || '—';
  const duration = typeof job.prompt === 'object' && job.prompt?.duration
    ? `${job.prompt.duration}s`
    : '—';

  const parameters: Record<string, string> = job.parameters || {};

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      <h3 className="text-white font-medium">Rastreamento do Job</h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Job ID</span>
          <p className="text-gray-300 font-mono text-xs break-all">{id}</p>
        </div>
        <div>
          <span className="text-gray-500">API Job ID</span>
          <p className="text-gray-300 font-mono text-xs break-all">{apiId}</p>
        </div>
        <div>
          <span className="text-gray-500">Tipo</span>
          <p className="text-gray-300">{videoType}</p>
        </div>
        <div>
          <span className="text-gray-500">Status</span>
          <p className="text-gray-300">{status}</p>
        </div>
        <div>
          <span className="text-gray-500">Formato</span>
          <p className="text-gray-300">{aspectRatio}</p>
        </div>
        <div>
          <span className="text-gray-500">Duração</span>
          <p className="text-gray-300">{duration}</p>
        </div>
      </div>

      {promptText && promptText !== '—' && (
        <div>
          <span className="text-gray-500 text-sm">Prompt usado</span>
          <p className="text-gray-400 text-sm mt-1 bg-gray-950 p-3 rounded font-mono break-words">
            {promptText}
          </p>
        </div>
      )}

      {Object.keys(parameters).length > 0 && (
        <div>
          <span className="text-gray-500 text-sm">Parâmetros</span>
          <div className="mt-1 bg-gray-950 p-3 rounded font-mono text-xs text-gray-400">
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key}>
                {key}: {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
