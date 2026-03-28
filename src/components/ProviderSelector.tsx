'use client';

import { useState, useEffect } from 'react';

export interface ProviderInfo {
  id: string;
  name: string;
  model: string;
  available: boolean;
  description: string;
}

interface Props {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

export default function ProviderSelector({ selectedProvider, onProviderChange }: Props) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/providers');
        const data = await res.json();
        setProviders(data.providers || []);
        if (!selectedProvider && data.defaultProvider) {
          onProviderChange(data.defaultProvider);
        }
      } catch {
        setProviders([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-32" />
      </div>
    );
  }

  const available = providers.filter(p => p.available);
  const unavailable = providers.filter(p => !p.available);

  return (
    <div className="space-y-2">
      <h3 className="text-white font-medium text-sm">Motor de IA</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {available.map((p) => (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={`text-left px-3 py-2.5 rounded-lg border transition ${
              selectedProvider === p.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium text-sm ${
                selectedProvider === p.id ? 'text-blue-400' : 'text-white'
              }`}>
                {p.name}
              </span>
              {selectedProvider === p.id && (
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
              )}
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>
          </button>
        ))}
      </div>
      {unavailable.length > 0 && (
        <div className="mt-2">
          <p className="text-gray-600 text-xs mb-1">Indisponíveis (falta API key):</p>
          <div className="flex flex-wrap gap-1">
            {unavailable.map((p) => (
              <span key={p.id} className="text-xs bg-gray-900 text-gray-600 px-2 py-1 rounded border border-gray-800">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
