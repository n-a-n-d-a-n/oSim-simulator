import React, { useEffect, useState } from 'react';
import type { VirtualMemoryPresetItem } from '../../types/virtualMemory';
import { fetchVirtualMemoryPresets } from '../../services/virtualMemoryApi';
import { BookOpen } from 'lucide-react';

interface Props {
  onSelectPreset: (preset: VirtualMemoryPresetItem) => void;
  selectedPresetId: string | null;
}

export const VirtualMemoryPresetSelector: React.FC<Props> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  const [presets, setPresets] = useState<VirtualMemoryPresetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchVirtualMemoryPresets()
      .then((data) => {
        setPresets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load VM presets:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-3 bg-[#11130E] border border-[#262922] rounded-[3px] text-xs text-[#83887E]">
        LOADING EDUCATIONAL PRESETS...
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#DCDCAA]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            EDUCATIONAL PRESET WORKLOADS
          </span>
        </div>
        <span className="text-[10px] text-[#83887E]">[SELECT BENCHMARK]</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-2.5 rounded-[3px] border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#181C14] border-[#39FF6A] shadow-[0_0_10px_rgba(57,255,106,0.15)] text-[#E8F5E9]'
                  : 'bg-[#0E100C] border-[#262922] hover:border-[#383D33] text-[#83887E] hover:text-[#E8F5E9]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-[#DCDCAA] truncate">
                  {preset.name}
                </span>
                <span className="text-[10px] uppercase px-1 py-0.2 rounded-[2px] bg-[#161912] border border-[#262922] text-[#39FF6A]">
                  {preset.recommended_algorithm}
                </span>
              </div>
              <p className="text-[11px] text-[#83887E] line-clamp-2 leading-tight mb-2">
                {preset.description}
              </p>
              <div className="flex items-center justify-between text-[10px] text-[#83887E] pt-1 border-t border-[#1C2018]">
                <span>FRAMES: {preset.frame_count}</span>
                <span>PAGES: {preset.virtual_page_count}</span>
                <span className="uppercase text-[#4EC9B0]">
                  {preset.input_mode === 'PAGE_REFERENCE' ? 'PAGES' : 'HEX ADDR'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
