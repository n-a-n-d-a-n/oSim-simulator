import React, { useState, useEffect } from 'react';
import type { MemoryPresetItem } from '../../types/memory';
import { fetchMemoryPresets } from '../../services/memoryApi';
import { Sparkles, BookOpen } from 'lucide-react';

interface MemoryPresetSelectorProps {
  onSelectPreset: (preset: MemoryPresetItem) => void;
  selectedPresetId?: string | null;
}

export const MemoryPresetSelector: React.FC<MemoryPresetSelectorProps> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  const [presets, setPresets] = useState<MemoryPresetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMemoryPresets()
      .then((data) => {
        setPresets(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load memory presets:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="p-3 bg-slate-900/40 rounded-lg text-slate-400 text-xs animate-pulse">
        Loading educational workloads...
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          Educational Workload Presets
        </h3>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Presets A - G
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                isSelected
                  ? 'bg-violet-500/20 border-violet-500 text-slate-100 shadow-md shadow-violet-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-slate-200 truncate">{preset.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-violet-300 border border-slate-700 font-mono flex-shrink-0">
                  {preset.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-1.5 leading-snug">
                {preset.description}
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                <span>Mem: {preset.memory_size}u</span>
                <span className="text-cyan-400">{preset.recommended_algorithm}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
