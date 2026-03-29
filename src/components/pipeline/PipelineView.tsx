'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pipeline, PipelineStage } from '@/lib/types/pipeline';
import StageCard from './StageCard';

interface Props {
  pipeline: Pipeline;
  onPipelineUpdate: (pipeline: Pipeline) => void;
}

export default function PipelineView({ pipeline, onPipelineUpdate }: Props) {
  const [generatingStages, setGeneratingStages] = useState<Set<string>>(new Set());
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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

  // Poll status for a generating stage
  const pollStageStatus = useCallback(
    async (stageId: string, requestId: string) => {
      try {
        const res = await fetch(`/api/pipeline/image-status?requestId=${encodeURIComponent(requestId)}`);
        const data = await res.json();

        if (data.status === 'completed' && data.imageUrl) {
          // Update stage as generated
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

          // Check if all non-original stages are now generated or approved
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
          onPipelineUpdate(updated);
        } else {
          // Still processing, poll again
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
        // Mark as generating
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
          }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Store requestId and start polling
        const updated2 = { ...pipeline };
        updated2.stages = updated2.stages.map((s) =>
          s.id === stage.id ? { ...s, falRequestId: data.requestId } : s
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
    [pipeline, onPipelineUpdate, pollStageStatus]
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

      // Auto-generate the regenerated stage
      const updatedStage = updated.stages.find((s) => s.id === stageId)!;
      generateStageImage(updatedStage);
    },
    [pipeline, onPipelineUpdate, generateStageImage]
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
            />
          ))}
      </div>

      {/* Video order indicator */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
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
    </div>
  );
}
