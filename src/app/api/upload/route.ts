import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { image, filename, category } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // If FAL_KEY is configured, upload to FAL storage for a public URL
    const falKey = process.env.FAL_KEY;
    if (falKey && image.startsWith('data:')) {
      try {
        fal.config({ credentials: falKey });

        // Convert base64 data URL to a Blob
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mimeType });
        const file = new File([blob], filename || 'image.jpg', { type: mimeType });

        // Upload to FAL storage
        const url = await fal.storage.upload(file);

        return NextResponse.json({
          url,
          filename: filename || 'image.jpg',
          category: category || 'fachada',
        });
      } catch (err) {
        console.error('[upload] FAL storage error:', err);
        // Fallback: return the base64 as-is (will work for small images)
        return NextResponse.json({
          url: image,
          filename: filename || 'image.jpg',
          category: category || 'fachada',
        });
      }
    }

    // No FAL key or not base64 — return as-is
    return NextResponse.json({
      url: image,
      filename: filename || 'image.jpg',
      category: category || 'fachada',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
