'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoTypeSelector from '@/components/VideoTypeSelector';
import ProgressTracker from '@/components/ProgressTracker';
import {
  VideoType,
  AspectRatio,
  UploadedImage,
  VideoProject,
  VideoLog,
  VideoStatus,
  ImageCategory,
  ProjectImages,
  createEmptyProjectImages,
  getAllImagesFromCategory,
} from '@/lib/types';
import { officialPresets, VideoPreset } from '@/lib/prompts/templates';

function getPresetId(videoType: VideoType, constructionFromFacade: boolean): VideoPreset {
  if (videoType === 'construcao' && constructionFromFacade) return 'construction_from_facade';
  const mapping: Record<VideoType, VideoPreset> = {
    fachada: 'video_fachada_marca',
    interior: 'video_rooftop_unidade',
    construcao: 'video_localizacao_contexto',
    unidade: 'video_rooftop_unidade',
  };
  return mapping[videoType];
}

export default function GerarPage() {
  const router = useRouter();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [categoryImages, setCategoryImages] = useState<ProjectImages>(createEmptyProjectImages());
  const [videoType, setVideoType] = useState<VideoType>('fachada');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<VideoLog[]>([]);

  // Derived state
  const constructionHasImages = getAllImagesFromCategory(categoryImages.construcao).length > 0;
  const facadeHasImages = getAllImagesFromCategory(categoryImages.fachada).length > 0;
  const isConstructionFromFacade = videoType === 'construcao' && !constructionHasImages && facadeHasImages;

  const activePresetId = getPresetId(videoType, isConstructionFromFacade);
  const activePreset = officialPresets[activePresetId];

  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      const p = JSON.parse(stored) as VideoProject;
      setProject(p);

      const catImgs = p.categoryImages || createEmptyProjectImages();
      setCategoryImages(catImgs);

      // Auto-select first available image
      if (p.images && p.images.length > 0) {
        setSelectedImage(p.images[0]);
      }
    }
  }, []);

  // When videoType changes, auto-select best image for that type
  useEffect(() => {
    if (!project) return;

    const relevantCategory: ImageCategory = videoType === 'unidade' ? 'interior' : videoType;
    let bestImage: UploadedImage | null = null;

    if (isConstructionFromFacade) {
      // Use facade primary for construction
      bestImage = categoryImages.fachada.primaryImage;
    } else {
      bestImage = categoryImages[relevantCategory]?.primaryImage || null;
    }

    // Fallback: any image
    if (!bestImage && project.images.length > 0) {
      bestImage = project.images[0];
    }

    setSelectedImage(bestImage);
  }, [videoType, project, categoryImages, isConstructionFromFacade]);

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

    // Gather reference images for the selected category
    const relevantCategory: ImageCategory = isConstructionFromFacade
      ? 'fachada'
      : (videoType === 'unidade' ? 'interior' : videoType);
    const catData = categoryImages[relevantCategory];
    const referenceUrls = catData
      ? catData.referenceImages.map(img => img.url)
      : [];

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl: selectedImage.url,
          referenceImageUrls: referenceUrls,
          imageCategory: isConstructionFromFacade ? 'fachada' : relevantCategory,
          videoType,
          aspectRatio,
          constructionFromFacade: isConstructionFromFacade,
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
    } catch {
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

      {/* Preset info */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Preset: {activePreset.name}</h3>
          <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
            ~{activePreset.targetDuration}s
          </span>
        </div>
        <p className="text-gray-400 text-sm">{activePreset.narrativeObjective}</p>
        <p className="text-gray-500 text-xs">Tom: {activePreset.tone}</p>
        {activePreset.scenes.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-500 text-xs font-medium mb-1">Cenas ({activePreset.scenes.length}):</p>
            <div className="flex flex-wrap gap-1">
              {activePreset.scenes.map((scene, i) => (
                <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                  {scene.name} ({scene.duration}s)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Construction from facade notice */}
      {isConstructionFromFacade && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm">
          <p className="text-yellow-400 font-medium">Modo: Construção a partir da Fachada</p>
          <p className="text-yellow-500/80 mt-1">
            Simulação visual da evolução construtiva baseada na imagem da fachada.
            Não é documentação real da obra.
          </p>
        </div>
      )}

      {/* Image selection by category */}
      {project.images.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-3">
            Imagem base
            {selectedImage && (
              <span className="text-gray-500 text-sm ml-2">({selectedImage.category})</span>
            )}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {project.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition relative ${
                  selectedImage?.id === img.id ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <img src={img.url} alt={img.filename} className="w-24 h-24 object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-gray-300 px-1 py-0.5 text-center">
                  {img.category}
                </span>
              </button>
            ))}
          </div>
          {selectedImage && categoryImages[isConstructionFromFacade ? 'fachada' : (videoType === 'unidade' ? 'interior' : videoType)]?.referenceImages.length > 0 && (
            <p className="text-gray-500 text-xs mt-2">
              + {categoryImages[isConstructionFromFacade ? 'fachada' : (videoType === 'unidade' ? 'interior' : videoType)].referenceImages.length} imagem(ns) de referência serão usadas
            </p>
          )}
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
        {generating ? 'Gerando...' : `Gerar Vídeo — ${activePreset.name}`}
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
