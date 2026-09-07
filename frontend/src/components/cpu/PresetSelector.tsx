import React, { useEffect, useState } from 'react';
import type { PresetItem } from '../../types/cpu';
import { fetchWorkloadPresets } from '../../services/cpuApi';
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface PresetSelectorProps {
  onSelectPreset: (preset: PresetItem) => void;
  selectedPresetId: string | null;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPresets() {
      try {
        setLoading(true);
        const data = await fetchWorkloadPresets();
        if (isMounted) {
          setPresets(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load presets');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPresets();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
          Canonical Textbook Presets
        </h3>
      </div>

      {loading && (
        <div className="text-xs text-slate-400 py-2 animate-pulse">
          Fetching presets from backend...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-2.5 rounded-lg border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500/70 shadow-indigo-500/10 shadow-sm'
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-xs text-slate-200">{preset.name}</span>
                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 mb-2">
                {preset.description}
              </p>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className="text-[10px] bg-slate-800 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                  {preset.recommended_algorithm}
                </span>
                <span className="text-[10px] text-slate-400">
                  {preset.processes.length} processes
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
