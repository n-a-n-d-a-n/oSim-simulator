import React from 'react';
import type { MemoryAlgorithmType } from '../../types/memory';
import { Play, RotateCcw } from 'lucide-react';

interface MemoryControlsProps {
  algorithm: MemoryAlgorithmType;
  setAlgorithm: (algo: MemoryAlgorithmType) => void;
  memorySize: number;
  setMemorySize: (size: number) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export const MemoryControls: React.FC<MemoryControlsProps> = ({
  algorithm,
  setAlgorithm,
  memorySize,
  setMemorySize,
  onRunSimulation,
  onReset,
  isLoading,
}) => {
  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2A2A26] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            MEMORY_ALLOCATOR_SETTINGS
          </h3>
        </div>
        <span className="text-[10px] text-[#888888]">[UNIT: 02]</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Algorithm Selector */}
        <div className="space-y-1">
          <label className="text-[11px] text-[#888888] uppercase block">
            ALLOCATION ALGORITHM
          </label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as MemoryAlgorithmType)}
            className="w-full bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2.5 py-1.5 text-xs text-[#E8F5E9] outline-none transition-colors"
          >
            <option value="FIRST_FIT" className="bg-[#0A0A0A]">First Fit (First suitable from 0)</option>
            <option value="BEST_FIT" className="bg-[#0A0A0A]">Best Fit (Smallest suitable block)</option>
            <option value="WORST_FIT" className="bg-[#0A0A0A]">Worst Fit (Largest suitable block)</option>
            <option value="NEXT_FIT" className="bg-[#0A0A0A]">Next Fit (Search from cursor)</option>
          </select>
        </div>

        {/* Total Memory Size */}
        <div className="space-y-1">
          <label className="text-[11px] text-[#888888] uppercase block">
            PHYSICAL MEMORY CAPACITY
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={50}
              max={10000}
              step={50}
              value={memorySize}
              onChange={(e) => setMemorySize(Math.max(50, Number(e.target.value) || 50))}
              className="w-full bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-1.5 text-xs font-mono text-[#E8F5E9] outline-none"
            />
            <span className="text-xs text-[#888888] font-mono">UNITS</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#2A2A26]">
        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-[#12130F] hover:bg-[#161813] active:bg-[#0A0A0A] text-[#39FF6A] border border-[#39FF6A] py-2 px-3 rounded-[2px] disabled:opacity-40 transition-colors text-xs font-bold tracking-wider uppercase cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border border-[#39FF6A] border-t-transparent animate-spin inline-block" />
              <span>[SIMULATION RUNNING...]</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-[#39FF6A]" />
              <span>[▶ ENGAGE SIMULATION]</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 bg-[#0A0A0A] hover:bg-[#161813] text-[#888888] hover:text-[#E8F5E9] border border-[#2A2A26] hover:border-[#888888] py-2 px-3 rounded-[2px] transition-colors text-xs font-mono cursor-pointer"
          title="Reset back to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>[RESET]</span>
        </button>
      </div>
    </div>
  );
};

