'use client';

import { useState, useRef } from 'react';
import { ImageCategory, UploadedImage } from '@/lib/types';

interface Props {
  onUpload: (image: UploadedImage) => void;
}

const categories: { value: ImageCategory; label: string }[] = [
  { value: 'fachada', label: 'Fachada' },
  { value: 'interior', label: 'Interior' },
  { value: 'construcao', label: 'Construção' },
  { value: 'drone', label: 'Drone' },
];

export default function ImageUploader({ onUpload }: Props) {
  const [category, setCategory] = useState<ImageCategory>('fachada');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        onUpload({ ...data, category });
      }
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex gap-2">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              category === c.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ? (
          <p className="text-gray-400">Enviando...</p>
        ) : (
          <div>
            <p className="text-gray-300 text-lg">Arraste uma imagem ou clique para selecionar</p>
            <p className="text-gray-500 text-sm mt-2">
              Categoria: <span className="text-blue-400">{category}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
