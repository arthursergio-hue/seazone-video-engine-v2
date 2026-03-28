'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import { UploadedImage, VideoProject } from '@/lib/types';

export default function UploadPage() {
  const router = useRouter();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      const p = JSON.parse(stored);
      setProject(p);
      setImages(p.images || []);
    }
  }, []);

  function handleUpload(image: UploadedImage) {
    const updated = [...images, image];
    setImages(updated);

    if (project) {
      const updatedProject = { ...project, images: updated };
      localStorage.setItem('currentProject', JSON.stringify(updatedProject));
    }
  }

  function handleContinue() {
    router.push('/gerar');
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nenhum projeto ativo.</p>
        <button
          onClick={() => router.push('/projeto')}
          className="mt-4 text-blue-400 hover:underline"
        >
          Criar um projeto primeiro
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload de Imagens</h1>
        <p className="text-gray-400 mt-1">
          Projeto: <span className="text-white">{project.name}</span>
        </p>
      </div>

      <ImageUploader onUpload={handleUpload} />

      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-medium">Imagens enviadas ({images.length})</h3>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="bg-gray-900 rounded-lg overflow-hidden">
                <img src={img.url} alt={img.filename} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                    {img.category}
                  </span>
                  <p className="text-gray-500 text-xs mt-1 truncate">{img.filename}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 transition"
          >
            Continuar para Geração
          </button>
        </div>
      )}
    </div>
  );
}
