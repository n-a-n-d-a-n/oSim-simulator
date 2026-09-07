import React from 'react';
import type { MemoryBlockSnapshot } from '../../types/memory';
import { getProcessColor } from '../../utils/palette';

interface MemoryMapProps {
  blocks: MemoryBlockSnapshot[];
  totalMemory: number;
  nextFitCursor?: number;
  algorithmName?: string;
}

export const MemoryMap: React.FC<MemoryMapProps> = ({
  blocks,
  totalMemory,
  nextFitCursor,
  algorithmName,
}) => {
  if (!blocks || blocks.length === 0 || totalMemory <= 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        No memory state available. Run simulation to visualize.
      </div>
    );
  }

  const isNextFit = algorithmName?.toUpperCase().includes('NEXT');

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
            Address-Accurate Contiguous Memory Map
          </h3>
          <p className="text-xs text-slate-400">
            Physical layout spanning addresses [0, {totalMemory}). Block widths are strictly proportional to byte sizes.
          </p>
        </div>

        {isNextFit && nextFitCursor !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Next Fit Cursor: <strong className="text-amber-200">@{nextFitCursor}</strong>
          </div>
        )}
      </div>

      {/* Main Memory Bar */}
      <div className="relative pt-2 pb-6">
        {/* Address Ruler Bounds */}
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1 px-1">
          <span>Addr 0</span>
          <span>Addr {totalMemory}</span>
        </div>

        {/* Proportional Memory Track */}
        <div className="relative w-full h-16 bg-slate-950 rounded-lg border-2 border-slate-800 flex overflow-hidden shadow-inner">
          {blocks.map((block, idx) => {
            const widthPct = Math.max(0.5, (block.size / totalMemory) * 100);
            const color = block.is_free ? null : getProcessColor(block.owner_id || 'UNKNOWN');

            return (
              <div
                key={`${block.start_address}-${block.end_address}-${idx}`}
                style={{ width: `${widthPct}%` }}
                className={`relative h-full transition-all duration-300 flex flex-col items-center justify-center border-r border-slate-900 group cursor-default ${
                  block.is_free
                    ? 'bg-slate-800/40 hover:bg-slate-700/50 text-slate-400 border-dashed border-r-slate-700'
                    : `${color?.bg || 'bg-cyan-500/20'} ${color?.border || 'border-cyan-500/40'} ${color?.text || 'text-cyan-300'} hover:brightness-125`
                }`}
              >
                {/* Visual Label */}
                <div className="truncate max-w-full px-1 text-center font-mono">
                  <span className="text-xs font-bold block truncate">
                    {block.is_free ? 'FREE' : block.owner_id}
                  </span>
                  <span className="text-[10px] opacity-80 block truncate">
                    {block.size}u
                  </span>
                </div>

                {/* Detailed Hover Tooltip */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none whitespace-nowrap">
                  <div className="bg-slate-950 text-slate-100 text-xs py-1.5 px-3 rounded-md border border-slate-700 shadow-2xl space-y-0.5">
                    <div className="font-semibold text-cyan-300">
                      {block.is_free ? 'Free Memory Block' : `Process ${block.owner_id}`}
                    </div>
                    <div className="font-mono text-[11px] text-slate-300">
                      Address: [{block.start_address}, {block.end_address}) · Size: {block.size} units (
                      {((block.size / totalMemory) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                </div>
              </div>
            );
          })}

          {/* Next Fit Cursor Indicator Line */}
          {isNextFit && nextFitCursor !== undefined && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-lg shadow-amber-400/80 z-20 pointer-events-none transition-all duration-300"
              style={{ left: `${Math.min(100, Math.max(0, (nextFitCursor / totalMemory) * 100))}%` }}
              title={`Next Fit Cursor: @${nextFitCursor}`}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-amber-400"></div>
            </div>
          )}
        </div>

        {/* Address markers beneath the bar */}
        <div className="relative w-full h-4 mt-1 font-mono text-[10px] text-slate-500 overflow-hidden">
          {blocks.map((block) => (
            <span
              key={`marker-${block.start_address}`}
              className="absolute -translate-x-1/2 truncate"
              style={{ left: `${(block.start_address / totalMemory) * 100}%` }}
            >
              {block.start_address}
            </span>
          ))}
          <span className="absolute right-0 text-slate-400">
            {totalMemory}
          </span>
        </div>
      </div>

      {/* Legend and Block Table Summary */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
            <span>Free Space</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-400"></span>
            <span>Allocated Space</span>
          </div>
          {isNextFit && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-amber-400 rounded"></span>
              <span>Next Fit Cursor</span>
            </div>
          )}
        </div>
        <div>
          Total Partitions: <strong className="text-slate-200">{blocks.length}</strong> (
          {blocks.filter((b) => !b.is_free).length} allocated, {blocks.filter((b) => b.is_free).length} free)
        </div>
      </div>
    </div>
  );
};
