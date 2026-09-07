import React, { useState, useEffect } from 'react';
import type { MemoryPresetItem } from '../../types/memory';
import { fetchMemoryPresets } from '../../services/memoryApi';

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
      <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-3 text-[#888888] text-xs font-mono">
        &gt; FETCHING MEMORY ROM WORKLOADS...
      </div>
    );
  }

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            ROM_MEMORY_WORKLOAD_BANKS ({presets.length})
          </h3>
        </div>
        <span className="text-[10px] text-[#888888]">CANONICAL PARTITION PRESETS A - G</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-2.5 rounded-[2px] border transition-colors text-xs cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#161813] border-[#39FF6A] text-[#E8F5E9]'
                  : 'bg-[#0A0A0A] border-[#2A2A26] hover:border-[#888888] text-[#888888]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`font-semibold truncate ${isSelected ? 'text-[#39FF6A]' : 'text-[#E8F5E9]'}`}>
                  [{preset.name}]
                </span>
                <span className="text-[10px] text-[#888888] shrink-0 font-mono">
                  [{preset.category.toUpperCase()}]
                </span>
              </div>
              <p className="text-[11px] text-[#888888] line-clamp-2 mb-2 leading-snug">
                {preset.description}
              </p>
              <div className="flex items-center justify-between text-[10px] text-[#888888] pt-1.5 border-t border-[#2A2A26]">
                <span>CAP: {preset.memory_size}U</span>
                <span className={isSelected ? 'text-[#39FF6A]' : 'text-[#DCDCAA]'}>
                  ALG: {preset.recommended_algorithm}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

