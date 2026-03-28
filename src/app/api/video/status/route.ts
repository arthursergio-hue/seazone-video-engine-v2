import { NextRequest, NextResponse } from 'next/server';
import { VideoStatusAgent } from '@/lib/agents/VideoStatusAgent';
import { VideoValidatorAgent } from '@/lib/agents/VideoValidatorAgent';

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Agent 4: Status check
    const statusAgent = new VideoStatusAgent();
    const job = await statusAgent.check(jobId);

    // Agent 5: Validate if completed
    let validation = null;
    if (job.status === 'completed') {
      const validator = new VideoValidatorAgent();
      validation = validator.validate(job);
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      resultUrl: job.resultUrl,
      logs: job.logs,
      prompt: job.prompt,
      parameters: job.parameters,
      apiJobId: job.apiJobId,
      validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
