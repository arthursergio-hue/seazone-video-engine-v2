'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import {
  ImageCategory,
  CategoryImages,
  ProjectImages,
  VideoProject,
  createEmptyProjectImages,
  getTotalImageCount,
  getAllImagesFromCategory,
} from '@/lib/types';

export default function UploadPage() {
  const router = useRouter();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [categoryImages, setCategoryImages] = useState<ProjectImages>(createEmptyProjectImages());

  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      const p = JSON.parse(stored) as VideoProject;
      setProject(p);

      // Migrate: if project has categoryImages, use them; otherwise rebuild from flat images array
      if (p.categoryImages) {
        setCategoryImages(p.categoryImages);
      } else if (p.images && p.images.length > 0) {
        const migrated = createEmptyProjectImages();
        for (const img of p.images) {
          const cat = img.category;
          if (!migrated[cat].primaryImage) {
            migrated[cat].primaryImage = { ...img, isPrimary: true };
          } else {
            migrated[cat].referenceImages.push(img);
          }
        }
        setCategoryImages(migrated);
      }
    }
  }, []);

  function handleImagesChange(category: ImageCategory, images: CategoryImages) {
    const updated = { ...categoryImages, [category]: images };
    setCategoryImages(updated);

    if (project) {
      // Rebuild flat images array for backward compatibility
      const allImages = (Object.keys(updated) as ImageCategory[]).flatMap(
        (key) => getAllImagesFromCategory(updated[key])
      );
      const updatedProject: VideoProject = {
        ...project,
        images: allImages,
        categoryImages: updated,
      };
      setProject(updatedProject);
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

  const totalCount = getTotalImageCount(categoryImages);

  // Check if construction has no images but facade does
  const hasConstructionImages = getAllImagesFromCategory(categoryImages.construcao).length > 0;
  const hasFacadeImages = getAllImagesFromCategory(categoryImages.fachada).length > 0;
  const willUseConstructionFromFacade = !hasConstructionImages && hasFacadeImages;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload de Imagens</h1>
        <p className="text-gray-400 mt-1">
          Projeto: <span className="text-white">{project.name}</span>
        </p>
      </div>

      <ImageUploader
        categoryImages={categoryImages}
        onImagesChange={handleImagesChange}
      />

      {/* Summary */}
      {totalCount > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <h3 className="text-white font-medium">Resumo ({totalCount} imagens total)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(categoryImages) as ImageCategory[]).map((cat) => {
              const count = getAllImagesFromCategory(categoryImages[cat]).length;
              return (
                <div key={cat} className="bg-gray-800 rounded p-2 text-center">
                  <p className="text-white font-medium text-sm capitalize">{cat}</p>
                  <p className={`text-lg font-bold ${count > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          {willUseConstructionFromFacade && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm">
              <p className="text-yellow-400 font-medium">Modo: Construção a partir da Fachada</p>
              <p className="text-yellow-500/80 mt-1">
                Nenhuma imagem de construção foi enviada. O sistema usará a fachada para gerar
                uma simulação visual da evolução construtiva do prédio.
              </p>
            </div>
          )}

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
