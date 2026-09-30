import React from 'react';
import type { DeadlockPresetItem } from '../../types/deadlock';
import { Layers, HelpCircle, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  presets: DeadlockPresetItem[];
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  activeMode: 'BANKER_AVOIDANCE' | 'DEADLOCK_DETECTION';
  onChangeMode: (mode: 'BANKER_AVOIDANCE' | 'DEADLOCK_DETECTION') => void;
}

export const DeadlockPresetSelector: React.FC<Props> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  activeMode,
  onChangeMode,
}) => {
  const currentPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262922] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            SCENARIO PRESETS & SUBSYSTEM MODE
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-[#0E100C] p-1 border border-[#262922] rounded-[3px]">
          <button
            type="button"
            onClick={() => onChangeMode('BANKER_AVOIDANCE')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-[2px] transition-colors flex items-center gap-1.5 ${
              activeMode === 'BANKER_AVOIDANCE'
                ? 'bg-[#39FF6A] text-[#0A0D08]'
                : 'text-[#83887E] hover:text-[#E8F5E9]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            BANKER'S AVOIDANCE
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('DEADLOCK_DETECTION')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-[2px] transition-colors flex items-center gap-1.5 ${
              activeMode === 'DEADLOCK_DETECTION'
                ? 'bg-[#39FF6A] text-[#0A0D08]'
                : 'text-[#83887E] hover:text-[#E8F5E9]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            DEADLOCK DETECTION
          </button>
        </div>
      </div>

      {/* Preset selection grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          const isBanker = preset.category === 'BANKER_AVOIDANCE';
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`p-2.5 text-left border rounded-[3px] transition-all space-y-1 ${
                isSelected
                  ? 'border-[#39FF6A] bg-[#162114] text-[#E8F5E9]'
                  : 'border-[#262922] bg-[#0E100C] text-[#83887E] hover:border-[#39FF6A]/40 hover:text-[#E8F5E9]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="truncate">{preset.name}</span>
                <span
                  className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                    isBanker ? 'bg-[#1e3a1e] text-[#39FF6A]' : 'bg-[#3a201e] text-[#E89E39]'
                  }`}
                >
                  {isBanker ? 'BANKER' : 'DETECT'}
                </span>
              </div>
              <p className="text-[10px] text-[#83887E] line-clamp-2 leading-tight">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Pedagogical notes for current preset */}
      {currentPreset && (
        <div className="p-3 bg-[#0E100C] border border-[#262922] rounded-[3px] flex items-start gap-2.5 text-[11px] text-[#83887E]">
          <HelpCircle className="w-4 h-4 text-[#39FF6A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#E8F5E9]">Pedagogical Concept:</span>
            <p className="leading-relaxed text-[#A4AAA0]">{currentPreset.pedagogical_notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
