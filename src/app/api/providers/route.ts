import { NextResponse } from 'next/server';
import { getAvailableProviders, getDefaultProvider } from '@/lib/services/apiClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const providers = getAvailableProviders();
  const defaultProvider = getDefaultProvider();

  return NextResponse.json({
    providers,
    defaultProvider,
  });
}
