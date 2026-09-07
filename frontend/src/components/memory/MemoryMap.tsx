import React from 'react';
import type { MemoryBlockSnapshot } from '../../types/memory';

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
      <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-6 text-center text-[#888888] text-xs font-mono">
        NO MEMORY STATE AVAILABLE // ENGAGE SIMULATION TO MAP PHYSICAL ADDRESSES
      </div>
    );
  }

  const isNextFit = algorithmName?.toUpperCase().includes('NEXT');

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A26] pb-2 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#39FF6A]">&gt;&gt;</span>
            <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
              PHYSICAL_MEMORY_MAP // RANGE: [0, {totalMemory})
            </h3>
          </div>
          <p className="text-[11px] text-[#888888] mt-0.5">
            PROPORTIONAL CONTIGUOUS ADDRESS PARTITIONS &bull; BYTE-ACCURATE BOUNDS
          </p>
        </div>

        {isNextFit && nextFitCursor !== undefined && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0A0A0A] border border-[#FF6B35] rounded-[2px] text-xs font-mono text-[#FF6B35]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
            <span>NEXT_FIT_CURSOR: <strong>@{nextFitCursor}</strong></span>
          </div>
        )}
      </div>

      {/* Main Memory Bar */}
      <div className="relative pt-1 pb-4">
        {/* Address Ruler Bounds */}
        <div className="flex justify-between text-[10px] text-[#888888] mb-1 px-1">
          <span>ADDR_0x0000 [0]</span>
          <span>ADDR_0x{totalMemory.toString(16).toUpperCase()} [{totalMemory}]</span>
        </div>

        {/* Proportional Memory Track */}
        <div className="relative w-full h-14 bg-[#0A0A0A] rounded-[2px] border border-[#2A2A26] flex overflow-hidden">
          {blocks.map((block, idx) => {
            const widthPct = Math.max(0.5, (block.size / totalMemory) * 100);

            return (
              <div
                key={`${block.start_address}-${block.end_address}-${idx}`}
                style={{ width: `${widthPct}%` }}
                className={`relative h-full flex flex-col items-center justify-center border-r border-[#2A2A26] group cursor-default transition-colors ${
                  block.is_free
                    ? 'bg-[#0A0A0A] text-[#DCDCAA] hover:bg-[#161813]'
                    : 'bg-[#39FF6A]/10 text-[#39FF6A] border-r-[#2A2A26] hover:bg-[#39FF6A]/20'
                }`}
              >
                {/* Visual Label */}
                <div className="truncate max-w-full px-1 text-center font-mono">
                  <span className="text-xs font-bold block truncate">
                    {block.is_free ? '[FREE]' : `[${block.owner_id}]`}
                  </span>
                  <span className="text-[10px] opacity-75 block truncate">
                    {block.size}u
                  </span>
                </div>

                {/* Hover Tooltip in Console styling */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none whitespace-nowrap">
                  <div className="bg-[#0A0A0A] text-[#E8F5E9] text-[11px] py-1 px-2.5 rounded-[2px] border border-[#2A2A26] space-y-0.5">
                    <div className={block.is_free ? 'text-[#DCDCAA]' : 'text-[#39FF6A]'}>
                      {block.is_free ? 'FREE PARTITION' : `PROCESS ${block.owner_id}`}
                    </div>
                    <div className="text-[#888888] text-[10px]">
                      ADDR: [{block.start_address}, {block.end_address}) &bull; SIZE: {block.size}u (
                      {((block.size / totalMemory) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Next Fit Cursor Indicator Line */}
          {isNextFit && nextFitCursor !== undefined && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#FF6B35] z-20 pointer-events-none"
              style={{ left: `${Math.min(100, Math.max(0, (nextFitCursor / totalMemory) * 100))}%` }}
              title={`Next Fit Cursor: @${nextFitCursor}`}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-3 border-x-transparent border-t-3 border-t-[#FF6B35]" />
            </div>
          )}
        </div>

        {/* Address markers beneath the bar */}
        <div className="relative w-full h-4 mt-1 font-mono text-[10px] text-[#888888] overflow-hidden">
          {blocks.map((block) => (
            <span
              key={`marker-${block.start_address}`}
              className="absolute -translate-x-1/2 truncate"
              style={{ left: `${(block.start_address / totalMemory) * 100}%` }}
            >
              {block.start_address}
            </span>
          ))}
          <span className="absolute right-0 text-[#888888]">
            {totalMemory}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#2A2A26] text-[11px] text-[#888888] gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#39FF6A]/20 border border-[#39FF6A] rounded-[1px]" />
            <span className="text-[#39FF6A]">ALLOCATED BLOCK (#39FF6A)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#0A0A0A] border border-[#DCDCAA] rounded-[1px]" />
            <span className="text-[#DCDCAA]">FREE SPACE (#DCDCAA)</span>
          </div>
          {isNextFit && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-2.5 bg-[#FF6B35] rounded-[1px]" />
              <span className="text-[#FF6B35]">NEXT FIT CURSOR (@{nextFitCursor})</span>
            </div>
          )}
        </div>
        <div>
          PARTITIONS: <strong className="text-[#E8F5E9]">{blocks.length}</strong> (
          <span className="text-[#39FF6A]">{blocks.filter((b) => !b.is_free).length} ALLOCATED</span>,{' '}
          <span className="text-[#DCDCAA]">{blocks.filter((b) => b.is_free).length} FREE</span>)
        </div>
      </div>
    </div>
  );
};

