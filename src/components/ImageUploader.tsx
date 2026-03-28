'use client';

import { useState, useRef } from 'react';
import { ImageCategory, UploadedImage, CategoryImages } from '@/lib/types';

interface Props {
  categoryImages: Record<ImageCategory, CategoryImages>;
  onImagesChange: (category: ImageCategory, images: CategoryImages) => void;
}

const categories: { value: ImageCategory; label: string; icon: string; description: string }[] = [
  { value: 'fachada', label: 'Fachada', icon: '🏢', description: 'Exterior do edifício' },
  { value: 'interior', label: 'Interior', icon: '🏠', description: 'Ambientes internos' },
  { value: 'construcao', label: 'Construção', icon: '🏗️', description: 'Evolução da obra' },
  { value: 'drone', label: 'Drone', icon: '📷', description: 'Vistas aéreas' },
];

function getCategoryCount(cat: CategoryImages): number {
  let count = 0;
  if (cat.primaryImage) count++;
  count += cat.referenceImages.length;
  return count;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ categoryImages, onImagesChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<ImageCategory>('fachada');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentCat = categoryImages[activeCategory];
  const currentCount = getCategoryCount(currentCat);

  async function handleFiles(files: FileList) {
    if (files.length === 0) return;

    setUploading(true);
    setUploadSuccess(false);
    const category = activeCategory;
    const catData: CategoryImages = {
      primaryImage: categoryImages[category].primaryImage
        ? { ...categoryImages[category].primaryImage! }
        : null,
      referenceImages: [...categoryImages[category].referenceImages],
    };

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    for (const file of imageFiles) {
      try {
        const base64Url = await fileToBase64(file);
        const img: UploadedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: base64Url,
          category,
          filename: file.name,
        };

        if (!catData.primaryImage) {
          catData.primaryImage = { ...img, isPrimary: true };
        } else {
          catData.referenceImages = [...catData.referenceImages, img];
        }
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    onImagesChange(category, catData);
    setUploading(false);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2000);

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }

  function handleRemoveImage(imageId: string) {
    const catData: CategoryImages = {
      primaryImage: categoryImages[activeCategory].primaryImage
        ? { ...categoryImages[activeCategory].primaryImage! }
        : null,
      referenceImages: [...categoryImages[activeCategory].referenceImages],
    };

    if (catData.primaryImage?.id === imageId) {
      if (catData.referenceImages.length > 0) {
        catData.primaryImage = { ...catData.referenceImages[0], isPrimary: true };
        catData.referenceImages = catData.referenceImages.slice(1);
      } else {
        catData.primaryImage = null;
      }
    } else {
      catData.referenceImages = catData.referenceImages.filter(img => img.id !== imageId);
    }

    onImagesChange(activeCategory, catData);
  }

  function handleSetPrimary(imageId: string) {
    const catData: CategoryImages = {
      primaryImage: categoryImages[activeCategory].primaryImage
        ? { ...categoryImages[activeCategory].primaryImage! }
        : null,
      referenceImages: [...categoryImages[activeCategory].referenceImages],
    };

    const targetRef = catData.referenceImages.find(img => img.id === imageId);
    if (!targetRef) return;

    const oldPrimary = catData.primaryImage;
    catData.primaryImage = { ...targetRef, isPrimary: true };
    catData.referenceImages = catData.referenceImages.filter(img => img.id !== imageId);
    if (oldPrimary) {
      catData.referenceImages = [{ ...oldPrimary, isPrimary: false }, ...catData.referenceImages];
    }

    onImagesChange(activeCategory, catData);
  }

  const allImages: UploadedImage[] = [];
  if (currentCat.primaryImage) allImages.push(currentCat.primaryImage);
  allImages.push(...currentCat.referenceImages);

  return (
    <div className="space-y-5">
      {/* Category tabs with counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map((c) => {
          const count = getCategoryCount(categoryImages[c.value]);
          return (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`relative px-4 py-3 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1 ${
                activeCategory === c.value
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{c.icon}</span>
              <span>{c.label}</span>
              <span className="text-xs opacity-70">{c.description}</span>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Drop zone - accepts multiple */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          uploadSuccess
            ? 'border-green-500 bg-green-500/10'
            : dragOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Processando imagens...</p>
          </div>
        ) : uploadSuccess ? (
          <div>
            <p className="text-green-400 text-lg font-medium">Imagens adicionadas com sucesso!</p>
            <p className="text-green-500/70 text-sm mt-1">Clique ou arraste para adicionar mais</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-300 text-lg">Arraste imagens ou clique para selecionar</p>
            <p className="text-gray-500 text-sm mt-2">
              Categoria: <span className="text-blue-400 font-medium">{categories.find(c => c.value === activeCategory)?.label}</span>
              {' '}&middot;{' '}
              <span className="text-gray-400">Aceita múltiplos arquivos</span>
            </p>
            {currentCount > 0 && (
              <p className="text-gray-500 text-sm mt-1">
                {currentCount} imagem(ns) nesta categoria
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preview grid for active category */}
      {allImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-medium">
            {categories.find(c => c.value === activeCategory)?.label} ({allImages.length} imagem{allImages.length !== 1 ? 'ns' : ''})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allImages.map((img) => (
              <div
                key={img.id}
                className={`relative group bg-gray-900 rounded-lg overflow-hidden border-2 transition ${
                  img.isPrimary || img.id === currentCat.primaryImage?.id
                    ? 'border-yellow-500'
                    : 'border-transparent'
                }`}
              >
                <img src={img.url} alt={img.filename} className="w-full h-32 object-cover" />

                {/* Primary badge */}
                {(img.isPrimary || img.id === currentCat.primaryImage?.id) && (
                  <span className="absolute top-1 left-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                    PRINCIPAL
                  </span>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  {!(img.isPrimary || img.id === currentCat.primaryImage?.id) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(img.id); }}
                      className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-medium hover:bg-yellow-400"
                      title="Definir como principal"
                    >
                      Principal
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                    className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium hover:bg-red-500"
                    title="Remover"
                  >
                    Remover
                  </button>
                </div>

                <div className="p-2">
                  <p className="text-gray-500 text-xs truncate">{img.filename}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
