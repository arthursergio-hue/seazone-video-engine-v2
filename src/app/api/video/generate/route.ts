import { NextRequest, NextResponse } from 'next/server';
import { VideoStrategistAgent } from '@/lib/agents/VideoStrategistAgent';
import { PromptBuilderAgent } from '@/lib/agents/PromptBuilderAgent';
import { VideoGenerationAgent } from '@/lib/agents/VideoGenerationAgent';
import { GenerationRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { projectId, imageUrl, imageCategory, videoType, aspectRatio } = body;

    if (!projectId || !imageUrl || !videoType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Agent 1: Strategist
    const strategist = new VideoStrategistAgent();
    const strategy = strategist.analyze(imageCategory, videoType);

    // Agent 2: Prompt Builder
    const promptBuilder = new PromptBuilderAgent();
    const { formattedPrompt } = promptBuilder.build(strategy.videoType);

    // Agent 3: Generation
    const generator = new VideoGenerationAgent();
    const job = await generator.generate({
      projectId,
      imageUrl,
      videoType: strategy.videoType,
      aspectRatio: aspectRatio || '9:16',
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      strategy: {
        videoType: strategy.videoType,
        approach: strategy.approach,
      },
      prompt: formattedPrompt,
      logs: job.logs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
