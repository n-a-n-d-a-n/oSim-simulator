import React, { useEffect, useState } from 'react';
import type { PresetItem } from '../../types/cpu';
import { fetchWorkloadPresets } from '../../services/cpuApi';
import { AlertCircle } from 'lucide-react';

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
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            ROM_WORKLOAD_BANKS ({presets.length})
          </h3>
        </div>
        <span className="text-[10px] text-[#888888]">CANONICAL BENCHMARKS</span>
      </div>

      {loading && (
        <div className="text-xs text-[#888888] py-2">
          &gt; FETCHING ROM DATA BANKS...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35] p-2 rounded-[2px] mb-3">
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
              className={`text-left p-2.5 rounded-[2px] border transition-colors flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#161813] border-[#39FF6A] text-[#E8F5E9]'
                  : 'bg-[#0A0A0A] border-[#2A2A26] hover:border-[#888888] text-[#888888]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-bold ${isSelected ? 'text-[#39FF6A]' : 'text-[#E8F5E9]'}`}>
                  [{preset.name}]
                </span>
                {isSelected && (
                  <span className="text-[10px] text-[#39FF6A] border border-[#39FF6A] px-1 rounded-[2px]">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#888888] line-clamp-2 my-1.5">
                {preset.description}
              </p>
              <div className="flex items-center gap-2 text-[10px] mt-auto pt-1 border-t border-[#2A2A26]">
                <span className="text-[#DCDCAA]">
                  ALG: {preset.recommended_algorithm}
                </span>
                <span>&bull;</span>
                <span>{preset.processes.length} PROCS</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

