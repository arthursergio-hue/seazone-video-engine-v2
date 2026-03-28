'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoTypeSelector from '@/components/VideoTypeSelector';
import ProgressTracker from '@/components/ProgressTracker';
import { VideoType, AspectRatio, UploadedImage, VideoProject, VideoLog, VideoStatus } from '@/lib/types';

export default function GerarPage() {
  const router = useRouter();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [videoType, setVideoType] = useState<VideoType>('fachada');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<VideoLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      const p = JSON.parse(stored) as VideoProject;
      setProject(p);
      if (p.images.length > 0) setSelectedImage(p.images[0]);
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/video/status?jobId=${id}`);
      const data = await res.json();

      setStatus(data.status);
      setProgress(data.progress);
      setLogs(data.logs || []);

      if (data.status === 'completed') {
        localStorage.setItem('lastJobResult', JSON.stringify(data));
        setGenerating(false);
      } else if (data.status === 'failed') {
        setGenerating(false);
      } else {
        setTimeout(() => pollStatus(id), 3000);
      }
    } catch {
      setTimeout(() => pollStatus(id), 5000);
    }
  }, []);

  async function handleGenerate() {
    if (!project || !selectedImage) return;

    setGenerating(true);
    setStatus('pending');
    setProgress(0);
    setLogs([]);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl: selectedImage.url,
          imageCategory: selectedImage.category,
          videoType,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('failed');
        setLogs([{ timestamp: new Date().toISOString(), message: data.error, progress: 0 }]);
        setGenerating(false);
        return;
      }

      setJobId(data.jobId);
      setStatus(data.status);
      setProgress(data.progress);
      setLogs(data.logs || []);

      pollStatus(data.jobId);
    } catch (error) {
      setStatus('failed');
      setGenerating(false);
    }
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nenhum projeto ativo.</p>
        <button onClick={() => router.push('/projeto')} className="mt-4 text-blue-400 hover:underline">
          Criar um projeto primeiro
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gerar Vídeo</h1>
        <p className="text-gray-400 mt-1">
          Projeto: <span className="text-white">{project.name}</span>
        </p>
      </div>

      {/* Image selection */}
      {project.images.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-3">Selecione a imagem base</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {project.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage?.id === img.id ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <img src={img.url} alt={img.filename} className="w-24 h-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <VideoTypeSelector
        selectedType={videoType}
        selectedRatio={aspectRatio}
        onTypeChange={setVideoType}
        onRatioChange={setAspectRatio}
      />

      <button
        onClick={handleGenerate}
        disabled={generating || !selectedImage}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {generating ? 'Gerando...' : 'Gerar Vídeo'}
      </button>

      {(generating || status !== 'pending') && (
        <ProgressTracker status={status} progress={progress} logs={logs} />
      )}

      {status === 'completed' && (
        <button
          onClick={() => router.push('/resultados')}
          className="w-full bg-green-600 text-white py-2.5 rounded font-medium hover:bg-green-700 transition"
        >
          Ver Resultado
        </button>
      )}
    </div>
  );
}
