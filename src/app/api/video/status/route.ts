import { NextRequest, NextResponse } from 'next/server';
import { VideoStatusAgent } from '@/lib/agents/VideoStatusAgent';
import { VideoValidatorAgent } from '@/lib/agents/VideoValidatorAgent';
import { checkVideoStatus, isApiConfigured } from '@/lib/services/apiClient';
import { getJob } from '@/lib/services/videoService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const apiJobId = searchParams.get('apiJobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Try in-memory first (same serverless instance)
    const memoryJob = getJob(jobId);
    if (memoryJob) {
      const statusAgent = new VideoStatusAgent();
      const job = await statusAgent.check(jobId);

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
    }

    // Stateless fallback for serverless environments (job not in memory)
    // Client must pass apiJobId so we can check directly
    if (apiJobId) {
      // Demo mode
      if (apiJobId.startsWith('demo_')) {
        const createdAt = parseInt(apiJobId.split('_')[1] || '0');
        const elapsed = Date.now() - createdAt;

        let status = 'processing';
        let progress = 30;
        let message = 'Processando vídeo...';
        let resultUrl: string | undefined;

        if (elapsed < 4000) {
          progress = 30;
          message = 'Analisando imagem e gerando frames...';
        } else if (elapsed < 7000) {
          progress = 60;
          message = 'Renderizando cenas do vídeo...';
        } else if (elapsed < 10000) {
          progress = 90;
          message = 'Finalizando composição e validando...';
        } else {
          status = 'completed';
          progress = 100;
          message = 'Vídeo gerado com sucesso! (Modo Demo)';
          resultUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
        }

        return NextResponse.json({
          jobId,
          status,
          progress,
          resultUrl,
          apiJobId,
          logs: [{ timestamp: new Date().toISOString(), message, progress }],
        });
      }

      // Real API status check
      if (isApiConfigured()) {
        try {
          const apiStatus = await checkVideoStatus(apiJobId);
          return NextResponse.json({
            jobId,
            status: apiStatus.status === 'completed' ? 'completed'
              : apiStatus.status === 'failed' ? 'failed'
              : 'processing',
            progress: apiStatus.status === 'completed' ? 100 : 70,
            resultUrl: apiStatus.resultUrl,
            apiJobId,
            logs: [{ timestamp: new Date().toISOString(), message: `API: ${apiStatus.status}`, progress: 70 }],
          });
        } catch (err) {
          return NextResponse.json({
            jobId,
            status: 'processing',
            progress: 70,
            apiJobId,
            logs: [{ timestamp: new Date().toISOString(), message: 'Verificando status...', progress: 70 }],
          });
        }
      }
    }

    // No memory, no apiJobId — cannot determine status
    return NextResponse.json({
      error: `Job ${jobId} not found in memory. Serverless instance may have restarted. Pass apiJobId parameter for stateless polling.`,
    }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
