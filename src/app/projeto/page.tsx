'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEmptyProjectImages } from '@/lib/types';

export default function ProjetoPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleCreate() {
    if (!name.trim()) return;

    const project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      images: [],
      categoryImages: createEmptyProjectImages(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('currentProject', JSON.stringify(project));
    router.push('/upload');
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Novo Projeto</h1>
      <p className="text-gray-400">Configure o empreendimento para geração de vídeos.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome do Empreendimento</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Residencial Vista Mar"
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes do empreendimento..."
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Criar Projeto e Continuar
        </button>
      </div>
    </div>
  );
}
