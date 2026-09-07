import React from 'react';
import type { MemoryAlgorithmType } from '../../types/memory';
import { Play, RotateCcw, Cpu } from 'lucide-react';

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
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Memory Allocator Settings
        </h3>
        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
          Phase 3
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Algorithm Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Allocation Algorithm</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as MemoryAlgorithmType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="FIRST_FIT">First Fit (First suitable block from 0)</option>
            <option value="BEST_FIT">Best Fit (Smallest suitable block)</option>
            <option value="WORST_FIT">Worst Fit (Largest suitable block)</option>
            <option value="NEXT_FIT">Next Fit (Search from cursor with wrap)</option>
          </select>
        </div>

        {/* Total Memory Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Physical Memory Capacity</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={50}
              max={10000}
              step={50}
              value={memorySize}
              onChange={(e) => setMemorySize(Math.max(50, Number(e.target.value) || 50))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <span className="text-xs text-slate-400 font-mono">units</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold py-2 px-4 rounded-lg shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all text-sm cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          {isLoading ? 'Simulating...' : 'Run Simulation'}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 px-3 rounded-lg border border-slate-700 transition-colors text-sm cursor-pointer"
          title="Reset back to initial state"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
};
