'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pipeline, PipelineStage } from '@/lib/types/pipeline';
import { IMAGE_MODELS, ImageModelId, DEFAULT_IMAGE_MODEL } from '@/lib/imageModels';
import StageCard from './StageCard';

interface Props {
  pipeline: Pipeline;
  onPipelineUpdate: (pipeline: Pipeline) => void;
}

export default function PipelineView({ pipeline, onPipelineUpdate }: Props) {
  const [generatingStages, setGeneratingStages] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<ImageModelId>(DEFAULT_IMAGE_MODEL);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Track which FAL model was used for each requestId (for status polling)
  const modelMapRef = useRef<Map<string, string>>(new Map());

  const allApproved = pipeline.stages.every((s) => s.status === 'approved');
  const hasGenerating = pipeline.stages.some((s) => s.status === 'generating');
  const hasPending = pipeline.stages.some((s) => s.status === 'pending');
  const nonOriginalStages = pipeline.stages.filter((s) => !s.isOriginal);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((timer) => clearTimeout(timer));
      pollingRef.current.clear();
    };
  }, []);

  // Close lightbox on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll status for a generating stage
  const pollStageStatus = useCallback(
    async (stageId: string, requestId: string) => {
      try {
        const falModel = modelMapRef.current.get(requestId) || '';
        let url = `/api/pipeline/image-status?requestId=${encodeURIComponent(requestId)}`;
        if (falModel) url += `&model=${encodeURIComponent(falModel)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'completed' && data.imageUrl) {
          const updated = { ...pipeline };
          updated.stages = updated.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  status: 'generated' as const,
                  imageUrl: data.imageUrl,
                  generatedAt: new Date().toISOString(),
                }
              : s
          );
          updated.updatedAt = new Date().toISOString();

          const allDone = updated.stages.every(
            (s) => s.isOriginal || s.status === 'generated' || s.status === 'approved'
          );
          if (allDone) {
            updated.phase = 'approve_images';
          }

          setGeneratingStages((prev) => {
            const next = new Set(prev);
            next.delete(stageId);
            return next;
          });
          pollingRef.current.delete(stageId);
          modelMapRef.current.delete(requestId);
          onPipelineUpdate(updated);
        } else if (data.status === 'failed') {
          const updated = { ...pipeline };
          updated.stages = updated.stages.map((s) =>
            s.id === stageId
              ? { ...s, status: 'failed' as const, error: data.error || 'Falha na geracao' }
              : s
          );
          updated.updatedAt = new Date().toISOString();
          setGeneratingStages((prev) => {
            const next = new Set(prev);
            next.delete(stageId);
            return next;
          });
          pollingRef.current.delete(stageId);
          modelMapRef.current.delete(requestId);
          onPipelineUpdate(updated);
        } else {
          const timer = setTimeout(() => pollStageStatus(stageId, requestId), 4000);
          pollingRef.current.set(stageId, timer);
        }
      } catch (err) {
        console.error(`[PipelineView] Poll error for stage ${stageId}:`, err);
        const timer = setTimeout(() => pollStageStatus(stageId, requestId), 4000);
        pollingRef.current.set(stageId, timer);
      }
    },
    [pipeline, onPipelineUpdate]
  );

  // Generate a single stage image
  const generateStageImage = useCallback(
    async (stage: PipelineStage) => {
      try {
        const updated = { ...pipeline };
        updated.stages = updated.stages.map((s) =>
          s.id === stage.id ? { ...s, status: 'generating' as const, error: undefined } : s
        );
        updated.updatedAt = new Date().toISOString();
        onPipelineUpdate(updated);
        setGeneratingStages((prev) => new Set(prev).add(stage.id));

        const res = await fetch('/api/pipeline/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: pipeline.sourceImageUrl,
            prompt: stage.prompt,
            strength: stage.strength,
            stageOrder: stage.order,
            modelId: selectedModel,
          }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Track which FAL model this requestId uses
        if (data.model) {
          modelMapRef.current.set(data.requestId, data.model);
        }

        const updated2 = { ...pipeline };
        updated2.stages = updated2.stages.map((s) =>
          s.id === stage.id ? { ...s, falRequestId: data.requestId, falModel: data.model } : s
        );
        updated2.updatedAt = new Date().toISOString();
        onPipelineUpdate(updated2);

        pollStageStatus(stage.id, data.requestId);
      } catch (err) {
        console.error(`[PipelineView] Generate error for stage ${stage.id}:`, err);
        const updated = { ...pipeline };
        updated.stages = updated.stages.map((s) =>
          s.id === stage.id
            ? { ...s, status: 'failed' as const, error: err instanceof Error ? err.message : 'Erro desconhecido' }
            : s
        );
        updated.updatedAt = new Date().toISOString();
        setGeneratingStages((prev) => {
          const next = new Set(prev);
          next.delete(stage.id);
          return next;
        });
        onPipelineUpdate(updated);
      }
    },
    [pipeline, onPipelineUpdate, pollStageStatus, selectedModel]
  );

  // Generate all pending stages
  const handleGenerateAll = useCallback(() => {
    const pendingStages = pipeline.stages.filter((s) => s.status === 'pending');
    if (pendingStages.length === 0) return;

    const updated = { ...pipeline, phase: 'generate_images' as const };
    onPipelineUpdate(updated);

    pendingStages.forEach((stage) => {
      generateStageImage(stage);
    });
  }, [pipeline, onPipelineUpdate, generateStageImage]);

  // Approve a stage
  const handleApprove = useCallback(
    (stageId: string) => {
      const updated = { ...pipeline };
      updated.stages = updated.stages.map((s) =>
        s.id === stageId ? { ...s, status: 'approved' as const } : s
      );
      updated.updatedAt = new Date().toISOString();

      if (updated.stages.every((s) => s.status === 'approved')) {
        updated.phase = 'approve_images';
      }
      onPipelineUpdate(updated);
    },
    [pipeline, onPipelineUpdate]
  );

  // Regenerate a stage
  const handleRegenerate = useCallback(
    (stageId: string) => {
      const stage = pipeline.stages.find((s) => s.id === stageId);
      if (!stage) return;

      const updated = { ...pipeline };
      updated.stages = updated.stages.map((s) =>
        s.id === stageId
          ? { ...s, status: 'pending' as const, version: s.version + 1, imageUrl: undefined, error: undefined }
          : s
      );
      updated.updatedAt = new Date().toISOString();
      onPipelineUpdate(updated);

      const updatedStage = updated.stages.find((s) => s.id === stageId)!;
      generateStageImage(updatedStage);
    },
    [pipeline, onPipelineUpdate, generateStageImage]
  );

  // Update prompt for a stage
  const handlePromptChange = useCallback(
    (stageId: string, newPrompt: string) => {
      const updated = { ...pipeline };
      updated.stages = updated.stages.map((s) =>
        s.id === stageId ? { ...s, prompt: newPrompt } : s
      );
      updated.updatedAt = new Date().toISOString();
      onPipelineUpdate(updated);
    },
    [pipeline, onPipelineUpdate]
  );

  // Approve all generated stages
  const handleApproveAll = useCallback(() => {
    const updated = { ...pipeline };
    updated.stages = updated.stages.map((s) =>
      s.status === 'generated' ? { ...s, status: 'approved' as const } : s
    );
    updated.phase = 'approve_images';
    updated.updatedAt = new Date().toISOString();
    onPipelineUpdate(updated);
  }, [pipeline, onPipelineUpdate]);

  const allGenerated = nonOriginalStages.every(
    (s) => s.status === 'generated' || s.status === 'approved'
  );

  return (
    <div className="space-y-4">
      {/* Image Model Selector */}
      {nonOriginalStages.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-2">
          <h3 className="text-white text-sm font-medium">Motor de Geracao de Imagem</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {IMAGE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`text-left p-2 rounded border transition text-xs ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <span className="text-white font-medium block">{model.name}</span>
                <span className="text-gray-400 block mt-0.5">{model.description}</span>
                {model.supportsImageToImage && (
                  <span className="text-green-400 text-[10px] mt-1 inline-block">img2img</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Estagios ({pipeline.stages.filter((s) => s.status === 'approved').length}/
          {pipeline.stages.length} aprovados)
        </h2>
        <div className="flex gap-2">
          {hasPending && !hasGenerating && (
            <button
              onClick={handleGenerateAll}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition"
            >
              Gerar Imagens
            </button>
          )}
          {allGenerated && !allApproved && (
            <button
              onClick={handleApproveAll}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded transition"
            >
              Aprovar Todas
            </button>
          )}
        </div>
      </div>

      {/* Stage cards in video order (highest order first = earliest in timeline) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...pipeline.stages]
          .sort((a, b) => b.order - a.order)
          .map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onPromptChange={handlePromptChange}
              onImageClick={(url, name) => setLightbox({ url, name })}
            />
          ))}
      </div>

      {/* Video order indicator */}
      <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
        <span>Ordem do video:</span>
        {[...pipeline.stages]
          .sort((a, b) => b.order - a.order)
          .map((s, i) => (
            <span key={s.id} className="flex items-center gap-1">
              <span className="text-gray-400">{s.name}</span>
              {i < pipeline.stages.length - 1 && <span>→</span>}
            </span>
          ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300 transition"
            >
              Fechar (ESC)
            </button>
            <p className="absolute -top-10 left-0 text-white text-sm">{lightbox.name}</p>
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
