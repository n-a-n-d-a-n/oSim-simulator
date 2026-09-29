import React from 'react';
import type {
  VirtualMemoryAlgorithmType,
  InputMode,
} from '../../types/virtualMemory';
import { Sliders, Play } from 'lucide-react';

interface Props {
  algorithm: VirtualMemoryAlgorithmType;
  onChangeAlgorithm: (algo: VirtualMemoryAlgorithmType) => void;
  frameCount: number;
  onChangeFrameCount: (frames: number) => void;
  pageSize: number;
  onChangePageSize: (size: number) => void;
  virtualPageCount: number;
  onChangeVirtualPageCount: (pages: number) => void;
  inputMode: InputMode;
  onChangeInputMode: (mode: InputMode) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
}

export const VirtualMemoryControls: React.FC<Props> = ({
  algorithm,
  onChangeAlgorithm,
  frameCount,
  onChangeFrameCount,
  pageSize,
  onChangePageSize,
  virtualPageCount,
  onChangeVirtualPageCount,
  inputMode,
  onChangeInputMode,
  onRunSimulation,
  isLoading,
}) => {
  const algorithms: { id: VirtualMemoryAlgorithmType; label: string; desc: string }[] = [
    { id: 'FIFO', label: 'FIFO', desc: 'First-In, First-Out' },
    { id: 'LRU', label: 'LRU', desc: 'Least Recently Used' },
    { id: 'OPTIMAL', label: 'OPTIMAL', desc: "Belady's Theoretical MIN" },
    { id: 'CLOCK', label: 'CLOCK', desc: 'Second Chance' },
  ];

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            PAGING CONFIGURATION
          </span>
        </div>
        <span className="text-[10px] text-[#39FF6A] font-bold">[HARDWARE MMU]</span>
      </div>

      {/* Algorithm Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#83887E] uppercase">
          REPLACEMENT ALGORITHM
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {algorithms.map((algo) => {
            const isSelected = algorithm === algo.id;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => onChangeAlgorithm(algo.id)}
                className={`py-2 px-2.5 rounded-[3px] text-xs font-bold transition-all text-center border cursor-pointer ${
                  isSelected
                    ? 'bg-[#181C14] text-[#39FF6A] border-[#39FF6A] shadow-[0_0_8px_rgba(57,255,106,0.2)]'
                    : 'bg-[#0E100C] text-[#83887E] border-[#262922] hover:text-[#E8F5E9] hover:border-[#383D33]'
                }`}
              >
                <div>{algo.label}</div>
                <div className="text-[9px] text-[#83887E] font-normal truncate">
                  {algo.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hardware & Page Space Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Frame Count */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#83887E] uppercase">
            PHYSICAL FRAMES
          </label>
          <select
            value={frameCount}
            onChange={(e) => onChangeFrameCount(parseInt(e.target.value, 10))}
            className="w-full bg-[#0E100C] border border-[#262922] rounded-[3px] px-2 py-1.5 text-xs text-[#E8F5E9] focus:border-[#39FF6A] outline-none"
          >
            {[2, 3, 4, 5, 6, 8, 12, 16].map((num) => (
              <option key={num} value={num}>
                {num} FRAMES
              </option>
            ))}
          </select>
        </div>

        {/* Page Size */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#83887E] uppercase">
            PAGE SIZE
          </label>
          <select
            value={pageSize}
            onChange={(e) => onChangePageSize(parseInt(e.target.value, 10))}
            className="w-full bg-[#0E100C] border border-[#262922] rounded-[3px] px-2 py-1.5 text-xs text-[#E8F5E9] focus:border-[#39FF6A] outline-none"
          >
            {[1024, 2048, 4096, 8192].map((sz) => (
              <option key={sz} value={sz}>
                {sz} B ({sz / 1024} KB)
              </option>
            ))}
          </select>
        </div>

        {/* Virtual Pages */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#83887E] uppercase">
            VIRTUAL PAGES
          </label>
          <select
            value={virtualPageCount}
            onChange={(e) => onChangeVirtualPageCount(parseInt(e.target.value, 10))}
            className="w-full bg-[#0E100C] border border-[#262922] rounded-[3px] px-2 py-1.5 text-xs text-[#E8F5E9] focus:border-[#39FF6A] outline-none"
          >
            {[8, 16, 32, 64].map((pages) => (
              <option key={pages} value={pages}>
                {pages} PAGES
              </option>
            ))}
          </select>
        </div>

        {/* Input Mode */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#83887E] uppercase">
            INPUT MODE
          </label>
          <select
            value={inputMode}
            onChange={(e) => onChangeInputMode(e.target.value as InputMode)}
            className="w-full bg-[#0E100C] border border-[#262922] rounded-[3px] px-2 py-1.5 text-xs text-[#E8F5E9] focus:border-[#39FF6A] outline-none"
          >
            <option value="PAGE_REFERENCE">PAGE NUMBERS</option>
            <option value="VIRTUAL_ADDRESS">BYTE ADDRESSES</option>
          </select>
        </div>
      </div>

      {/* Execute Button */}
      <button
        type="button"
        onClick={onRunSimulation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#181C14] border border-[#39FF6A] text-[#39FF6A] font-bold text-xs rounded-[3px] hover:bg-[#39FF6A]/10 transition-all cursor-pointer shadow-[0_0_12px_rgba(57,255,106,0.15)] disabled:opacity-50"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>{isLoading ? 'EXECUTING SIMULATION...' : 'RUN SIMULATION'}</span>
      </button>
    </div>
  );
};
