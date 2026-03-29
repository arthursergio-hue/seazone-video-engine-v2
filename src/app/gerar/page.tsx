'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  VideoProject,
  VideoLog,
  VideoStatus,
  ImageCategory,
  ProjectImages,
  createEmptyProjectImages,
  getAllImagesFromCategory,
  UploadedImage,
} from '@/lib/types';
import { Pipeline, PipelineType, PipelinePhase } from '@/lib/types/pipeline';
import { createPipelineStages, createDroneStages } from '@/lib/prompts/imagePrompts';
import { loadAllImages, getImageData } from '@/lib/storage';
import PipelineTypeSelector from '@/components/pipeline/PipelineTypeSelector';
import PipelineView from '@/components/pipeline/PipelineView';
import PipelineProgress from '@/components/pipeline/PipelineProgress';
import ProviderSelector from '@/components/ProviderSelector';
import ProgressTracker from '@/components/ProgressTracker';

function compressImage(base64: string, maxWidth = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export default function GerarPage() {
  const router = useRouter();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [categoryImages, setCategoryImages] = useState<ProjectImages>(createEmptyProjectImages());
  const [imageDataMap, setImageDataMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Pipeline state
  const [pipelineType, setPipelineType] = useState<PipelineType | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);

  // Video generation state
  const [provider, setProvider] = useState<string>('fal_kling');
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('pending');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoLogs, setVideoLogs] = useState<VideoLog[]>([]);
  const pollStartRef = { current: 0 };

  // Derived
  const hasMultipleImages = project ? (project.images?.length || 0) > 1 : false;
  const allApproved = pipeline?.stages.every((s) => s.status === 'approved') || false;

  // Load project
  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem('currentProject');
      if (!stored) {
        setLoading(false);
        return;
      }

      const p = JSON.parse(stored) as VideoProject;
      setProject(p);

      const catImgs = p.categoryImages || createEmptyProjectImages();
      setCategoryImages(catImgs);

      const allIds = (p.images || []).map((img) => img.id);
      if (allIds.length > 0) {
        const data = await loadAllImages(allIds);
        setImageDataMap(data);
      }

      // Load existing pipeline if any
      const savedPipeline = localStorage.getItem('currentPipeline');
      if (savedPipeline) {
        try {
          const pl = JSON.parse(savedPipeline) as Pipeline;
          setPipeline(pl);
          setPipelineType(pl.type);
        } catch {
          // ignore
        }
      }

      setLoading(false);
    }
    init();
  }, []);

  // Resolve image URL (prefer FAL public URL, fallback to upload)
  const resolveImageUrl = useCallback(
    async (img: UploadedImage): Promise<string | null> => {
      if (img.url && img.url.startsWith('http')) return img.url;

      const base64Data = imageDataMap[img.id] || (await getImageData(img.id));
      if (!base64Data) return null;

      try {
        const compressed = await compressImage(base64Data, 1024, 0.85);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressed, filename: img.filename, category: img.category }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url && uploadData.url.startsWith('http')) {
          return uploadData.url;
        }
      } catch {
        // fallback
      }
      return base64Data;
    },
    [imageDataMap]
  );

  // Select pipeline type and create pipeline
  const handleTypeSelect = useCallback(
    async (type: PipelineType) => {
      setPipelineType(type);

      if (!project) return;

      if (type === 'drone') {
        // Drone: use all uploaded images as takes
        const allImages = project.images || [];
        const imageUrls: string[] = [];
        for (const img of allImages) {
          const url = await resolveImageUrl(img);
          if (url) imageUrls.push(url);
        }
        const stages = createDroneStages(imageUrls);
        const pl: Pipeline = {
          id: `pipeline_${Date.now()}`,
          type,
          projectId: project.id,
          sourceImageUrl: imageUrls[0] || '',
          stages,
          phase: 'approve_images', // Drone stages are all original/approved
          videoStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPipeline(pl);
        localStorage.setItem('currentPipeline', JSON.stringify(pl));
        return;
      }

      // Construction or Interior: find the primary image for that type
      const category: ImageCategory = type === 'construction' ? 'fachada' : 'interior';
      const primaryImg = categoryImages[category]?.primaryImage;

      if (!primaryImg) {
        return;
      }

      const sourceUrl = await resolveImageUrl(primaryImg);
      if (!sourceUrl) return;

      const stages = createPipelineStages(type, sourceUrl);
      const pl: Pipeline = {
        id: `pipeline_${Date.now()}`,
        type,
        projectId: project.id,
        sourceImageUrl: sourceUrl,
        stages,
        phase: 'select_type',
        videoStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPipeline(pl);
      localStorage.setItem('currentPipeline', JSON.stringify(pl));
    },
    [project, categoryImages, resolveImageUrl]
  );

  // Update pipeline (from PipelineView)
  const handlePipelineUpdate = useCallback((updated: Pipeline) => {
    setPipeline(updated);
    localStorage.setItem('currentPipeline', JSON.stringify(updated));
  }, []);

  // Poll video status
  const pollVideoStatus = useCallback(
    async (jobId: string, apiJobId: string) => {
      if (pollStartRef.current === 0) pollStartRef.current = Date.now();

      try {
        let url = `/api/video/status?jobId=${jobId}`;
        if (apiJobId) url += `&apiJobId=${encodeURIComponent(apiJobId)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'completed') {
          setVideoStatus('completed');
          setVideoProgress(100);
          setVideoLogs((prev) => [
            ...prev,
            { timestamp: new Date().toISOString(), message: 'Video gerado com sucesso!', progress: 100 },
          ]);
          setVideoGenerating(false);

          // Update pipeline
          if (pipeline) {
            const updated = {
              ...pipeline,
              videoStatus: 'completed' as const,
              videoUrl: data.resultUrl,
              phase: 'completed' as PipelinePhase,
              updatedAt: new Date().toISOString(),
            };
            setPipeline(updated);
            localStorage.setItem('currentPipeline', JSON.stringify(updated));

            // Save result for resultados page
            localStorage.setItem(
              'lastJobResult',
              JSON.stringify({
                ...data,
                provider,
                providerName: provider,
                videoType: pipeline.type,
                aspectRatio,
                pipelineType: pipeline.type,
                pipelineStages: pipeline.stages,
                projectName: project?.name || '',
                projectId: project?.id || '',
                prompt: pipeline.videoPrompt,
                completedAt: new Date().toISOString(),
              })
            );
          }
        } else if (data.status === 'failed') {
          setVideoStatus('failed');
          setVideoLogs((prev) => [
            ...prev,
            { timestamp: new Date().toISOString(), message: data.error || 'Falha na geracao', progress: 0 },
          ]);
          setVideoGenerating(false);

          if (pipeline) {
            const updated = { ...pipeline, videoStatus: 'failed' as const, updatedAt: new Date().toISOString() };
            setPipeline(updated);
            localStorage.setItem('currentPipeline', JSON.stringify(updated));
          }
        } else {
          const elapsed = Date.now() - pollStartRef.current;
          const maxTime = 5 * 60 * 1000;
          const smoothProgress = Math.round(Math.min(95, 70 + (25 * elapsed) / maxTime));
          setVideoStatus('processing');
          setVideoProgress(smoothProgress);
          setTimeout(() => pollVideoStatus(jobId, apiJobId), 4000);
        }
      } catch {
        setTimeout(() => pollVideoStatus(jobId, apiJobId), 5000);
      }
    },
    [pipeline, provider, aspectRatio, project]
  );

  // Generate video from approved stages
  const handleGenerateVideo = useCallback(async () => {
    if (!pipeline || !allApproved) return;

    setVideoGenerating(true);
    setVideoStatus('pending');
    setVideoProgress(0);
    setVideoLogs([]);
    pollStartRef.current = 0;

    const updated = {
      ...pipeline,
      phase: 'generate_video' as PipelinePhase,
      videoStatus: 'generating' as const,
      videoProvider: provider,
      videoAspectRatio: aspectRatio,
      updatedAt: new Date().toISOString(),
    };
    setPipeline(updated);
    localStorage.setItem('currentPipeline', JSON.stringify(updated));

    try {
      const stages = pipeline.stages
        .filter((s) => s.imageUrl)
        .map((s) => ({ order: s.order, imageUrl: s.imageUrl! }));

      const res = await fetch('/api/pipeline/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stages,
          pipelineType: pipeline.type,
          provider,
          aspectRatio,
          projectName: project?.name,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const updated2 = {
        ...updated,
        videoJobId: data.jobId,
        videoApiJobId: data.apiJobId,
        videoPrompt: data.prompt,
        updatedAt: new Date().toISOString(),
      };
      setPipeline(updated2);
      localStorage.setItem('currentPipeline', JSON.stringify(updated2));

      setVideoLogs([
        { timestamp: new Date().toISOString(), message: `Gerando video (${provider})...`, progress: 10 },
      ]);

      pollVideoStatus(data.jobId, data.apiJobId);
    } catch (err) {
      setVideoStatus('failed');
      setVideoLogs([
        {
          timestamp: new Date().toISOString(),
          message: err instanceof Error ? err.message : 'Erro ao gerar video',
          progress: 0,
        },
      ]);
      setVideoGenerating(false);
    }
  }, [pipeline, allApproved, provider, aspectRatio, project, pollVideoStatus]);

  // Get source image display URL
  const getSourceImagePreview = (): string | null => {
    if (!pipeline?.sourceImageUrl) return null;
    if (pipeline.sourceImageUrl.startsWith('http')) return pipeline.sourceImageUrl;
    if (pipeline.sourceImageUrl.startsWith('data:')) return pipeline.sourceImageUrl;
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 mt-3">Carregando projeto...</p>
      </div>
    );
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

  const currentPhase: PipelinePhase = pipeline?.phase || 'select_type';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline de Geracao</h1>
        <p className="text-gray-400 mt-1">
          Projeto: <span className="text-white">{project.name}</span>
        </p>
      </div>

      {/* Pipeline progress bar */}
      <PipelineProgress phase={currentPhase} />

      {/* Step 1: Select pipeline type */}
      <PipelineTypeSelector
        selected={pipelineType}
        onSelect={handleTypeSelect}
        hasMultipleImages={hasMultipleImages}
      />

      {/* Source image preview */}
      {pipeline && getSourceImagePreview() && pipelineType !== 'drone' && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-white text-sm font-medium mb-2">Imagem de Origem</h3>
          <img
            src={getSourceImagePreview()!}
            alt="Imagem de origem"
            className="max-h-48 rounded-lg object-contain"
          />
        </div>
      )}

      {/* No primary image warning */}
      {pipelineType && !pipeline && pipelineType !== 'drone' && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm">
          <p className="text-yellow-400">
            Nenhuma imagem primaria encontrada para a categoria{' '}
            <strong>{pipelineType === 'construction' ? 'fachada' : 'interior'}</strong>.
          </p>
          <button
            onClick={() => router.push('/upload')}
            className="text-yellow-300 underline mt-1 text-xs"
          >
            Ir para upload
          </button>
        </div>
      )}

      {/* Step 2 & 3: Generate and approve images */}
      {pipeline && pipeline.stages.length > 0 && (
        <PipelineView pipeline={pipeline} onPipelineUpdate={handlePipelineUpdate} />
      )}

      {/* Step 4: Video generation (only when all approved) */}
      {allApproved && pipeline && (
        <div className="space-y-4 border-t border-gray-800 pt-6">
          <h2 className="text-lg font-semibold text-white">Gerar Video</h2>
          <p className="text-gray-400 text-sm">
            Todas as imagens foram aprovadas. Configure e gere o video final.
          </p>

          <ProviderSelector selectedProvider={provider} onProviderChange={setProvider} />

          {/* Aspect ratio */}
          <div>
            <h3 className="text-white text-sm font-medium mb-2">Formato</h3>
            <div className="flex gap-2">
              {(['9:16', '4:5', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded text-sm transition ${
                    aspectRatio === ratio
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {ratio}
                  <span className="text-xs text-gray-500 ml-1">
                    {ratio === '9:16' ? 'Reels' : ratio === '4:5' ? 'Feed' : 'YouTube'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateVideo}
            disabled={videoGenerating || !allApproved}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {videoGenerating ? 'Gerando video...' : 'Gerar Video Final'}
          </button>

          {(videoGenerating || videoStatus !== 'pending') && (
            <ProgressTracker status={videoStatus} progress={videoProgress} logs={videoLogs} />
          )}

          {videoStatus === 'completed' && (
            <button
              onClick={() => router.push('/resultados')}
              className="w-full bg-green-600 text-white py-2.5 rounded font-medium hover:bg-green-700 transition"
            >
              Ver Resultado
            </button>
          )}
        </div>
      )}

      {/* Reset pipeline */}
      {pipeline && (
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => {
              setPipeline(null);
              setPipelineType(null);
              setVideoGenerating(false);
              setVideoStatus('pending');
              setVideoProgress(0);
              setVideoLogs([]);
              localStorage.removeItem('currentPipeline');
            }}
            className="text-gray-500 text-xs hover:text-gray-300 transition"
          >
            Resetar pipeline
          </button>
        </div>
      )}
    </div>
  );
}
