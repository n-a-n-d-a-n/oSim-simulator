import React from 'react';
import type { MemoryMetricsSnapshot } from '../../types/memory';

interface MemoryMetricsProps {
  metrics: MemoryMetricsSnapshot;
}

export const MemoryMetrics: React.FC<MemoryMetricsProps> = ({ metrics }) => {
  const usedPct = metrics.total_memory > 0 ? ((metrics.used_memory / metrics.total_memory) * 100).toFixed(1) : '0';
  const freePct = metrics.total_memory > 0 ? ((metrics.free_memory / metrics.total_memory) * 100).toFixed(1) : '0';
  const extFragPct = (metrics.external_fragmentation_ratio * 100).toFixed(1);

  const items = [
    {
      label: 'TOTAL MEMORY',
      value: `${metrics.total_memory}u`,
      sub: '100% CAPACITY POOL',
      color: 'text-[#E8F5E9]',
    },
    {
      label: 'USED MEMORY',
      value: `${metrics.used_memory}u`,
      sub: `${usedPct}% (${metrics.allocated_block_count} BLOCKS)`,
      color: 'text-[#39FF6A]',
    },
    {
      label: 'FREE MEMORY',
      value: `${metrics.free_memory}u`,
      sub: `${freePct}% (${metrics.free_block_count} HOLES)`,
      color: 'text-[#DCDCAA]',
    },
    {
      label: 'LARGEST FREE HOLE',
      value: `${metrics.largest_free_block}u`,
      sub: 'MAX CONTIGUOUS BLOCK',
      color: 'text-[#DCDCAA]',
    },
    {
      label: 'EXT. FRAGMENTATION',
      value: `${metrics.external_fragmentation}u`,
      sub: `RATIO: ${extFragPct}% (FREE - MAX)`,
      color: 'text-[#FF6B35]',
    },
    {
      label: 'DISPATCH STATUS',
      value: `${metrics.allocation_success_count} / ${metrics.allocation_failure_count}`,
      sub: 'SUCCESS / FAILED OPS',
      color: 'text-[#39FF6A]',
    },
  ];

  return (
    <div className="space-y-2.5 font-mono">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-3 flex flex-col justify-between"
          >
            <span className="text-[10px] text-[#888888] uppercase tracking-wider">
              {item.label}
            </span>
            <div className="my-1.5">
              <div className={`text-xl font-bold ${item.color}`}>
                {item.value}
              </div>
              <div className="text-[10px] text-[#888888] truncate mt-0.5">
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Educational Note strip */}
      <div className="px-3 py-2 bg-[#12130F] border border-[#2A2A26] rounded-[2px] text-[11px] text-[#888888] flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-[#E8F5E9]">INTERNAL FRAG:</strong> 0u (VARIABLE-SIZED PARTITIONS EXACTLY MATCH REQUESTS)
        </span>
        <span className="text-[#888888]">
          EXT_FRAG = TOTAL_FREE ({metrics.free_memory}u) - LARGEST_HOLE ({metrics.largest_free_block}u) = {metrics.external_fragmentation}u
        </span>
      </div>
    </div>
  );
};

