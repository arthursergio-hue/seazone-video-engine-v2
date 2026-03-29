import { NextRequest, NextResponse } from 'next/server';
import { generateVideo, getDefaultProvider, VideoProvider } from '@/lib/services/apiClient';
import { buildPipelineVideoPrompt } from '@/lib/prompts/imagePrompts';
import { PipelineType } from '@/lib/types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stages,
      pipelineType,
      provider: requestedProvider,
      aspectRatio,
      projectName,
    } = body as {
      stages: Array<{ order: number; imageUrl: string }>;
      pipelineType: PipelineType;
      provider?: string;
      aspectRatio?: string;
      projectName?: string;
    };

    if (!stages || stages.length === 0) {
      return NextResponse.json(
        { error: 'stages array is required' },
        { status: 400 }
      );
    }

    if (!pipelineType) {
      return NextResponse.json(
        { error: 'pipelineType is required' },
        { status: 400 }
      );
    }

    // Sort stages by chronological order (highest order = earliest in time)
    const sortedStages = [...stages].sort((a, b) => b.order - a.order);

    // First chronological image (earliest stage) is the primary image for video
    const primaryImage = sortedStages[0];
    const referenceImages = sortedStages.slice(1);

    // Build the video prompt
    const prompt = buildPipelineVideoPrompt(pipelineType, projectName);

    // Resolve provider
    const provider = (requestedProvider || getDefaultProvider()) as VideoProvider;
    const ratio = aspectRatio || '9:16';

    console.log(`[Pipeline] Generating video from ${stages.length} stages`);
    console.log(`[Pipeline] Type: ${pipelineType}, Provider: ${provider}`);
    console.log(`[Pipeline] Primary image (stage ${primaryImage.order}): ${primaryImage.imageUrl.substring(0, 60)}...`);
    console.log(`[Pipeline] Reference images: ${referenceImages.length}`);

    // Add reference image info to prompt
    let finalPrompt = prompt;
    if (referenceImages.length > 0) {
      finalPrompt += ` IMPORTANT: ${stages.length} sequential images are provided representing the chronological progression. The video must smoothly transition through each stage in order.`;
    }

    const result = await generateVideo(provider, {
      prompt: finalPrompt,
      imageUrl: primaryImage.imageUrl,
      aspectRatio: ratio,
      duration: 10,
    });

    console.log(`[Pipeline] Video generation submitted. TaskId: ${result.taskId}`);

    return NextResponse.json({
      jobId: `pipeline_${Date.now()}`,
      apiJobId: result.taskId,
      provider: result.provider,
      status: 'processing',
      prompt: finalPrompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Pipeline] Generate video error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
