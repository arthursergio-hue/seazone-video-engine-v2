import { NextRequest, NextResponse } from 'next/server';
import { VideoStrategistAgent } from '@/lib/agents/VideoStrategistAgent';
import { PromptBuilderAgent } from '@/lib/agents/PromptBuilderAgent';
import { VideoGenerationAgent } from '@/lib/agents/VideoGenerationAgent';
import { GenerationRequest } from '@/lib/types';
import { getDefaultProvider, getAvailableProviders, VideoProvider } from '@/lib/services/apiClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      imageUrl,
      referenceImageUrls,
      imageCategory,
      videoType,
      aspectRatio,
      constructionFromFacade,
      provider: requestedProvider,
    } = body as GenerationRequest & { provider?: VideoProvider };

    if (!projectId || !imageUrl || !videoType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve provider
    const availableProviders = getAvailableProviders();
    let provider = requestedProvider || getDefaultProvider();
    const providerInfo = availableProviders.find(p => p.id === provider);
    if (!providerInfo?.available) {
      provider = getDefaultProvider();
    }

    const demoMode = provider === 'demo';

    // Agent 1: Strategist
    const strategist = new VideoStrategistAgent();
    const strategy = strategist.analyze(imageCategory, videoType, {
      constructionFromFacade,
      hasReferenceImages: (referenceImageUrls?.length || 0) > 0,
    });

    // Agent 2: Prompt Builder
    const promptBuilder = new PromptBuilderAgent();
    const { formattedPrompt } = promptBuilder.build(strategy.videoType, {
      preset: strategy.preset,
      constructionFromFacade: strategy.constructionFromFacade,
    });

    // Agent 3: Generation
    const generator = new VideoGenerationAgent();
    const job = await generator.generate({
      projectId,
      imageUrl,
      referenceImageUrls: referenceImageUrls?.slice(0, 3),
      videoType: strategy.videoType,
      aspectRatio: aspectRatio || '9:16',
      constructionFromFacade: strategy.constructionFromFacade,
      provider,
    });

    return NextResponse.json({
      jobId: job.id,
      apiJobId: job.apiJobId,
      status: job.status,
      progress: job.progress,
      demoMode,
      provider,
      providerName: providerInfo?.name || provider,
      strategy: {
        videoType: strategy.videoType,
        approach: strategy.approach,
        preset: strategy.preset.id,
        constructionFromFacade: strategy.constructionFromFacade,
      },
      prompt: formattedPrompt,
      logs: job.logs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[generate] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
