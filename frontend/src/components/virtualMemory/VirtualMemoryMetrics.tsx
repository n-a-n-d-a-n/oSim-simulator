import React from 'react';
import type { VirtualMemoryMetrics as VMMetricsType } from '../../types/virtualMemory';
import { BarChart3 } from 'lucide-react';

interface Props {
  metrics: VMMetricsType | null | undefined;
}

export const VirtualMemoryMetrics: React.FC<Props> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] font-mono text-center text-xs text-[#83887E]">
        NO METRICS RECORDED
      </div>
    );
  }

  const hitPct = (metrics.hit_ratio * 100).toFixed(1);
  const faultPct = (metrics.fault_ratio * 100).toFixed(1);

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            PAGING PERFORMANCE METRICS
          </span>
        </div>
        <span className="text-[10px] text-[#83887E] font-bold">
          TOTAL REFS: {metrics.total_references}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
        {/* Page Hits */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">PAGE HITS</div>
          <div className="text-base font-bold text-[#39FF6A]">{metrics.page_hits}</div>
          <div className="text-[9px] text-[#83887E]">{hitPct}% HIT RATE</div>
        </div>

        {/* Page Faults */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">PAGE FAULTS</div>
          <div className="text-base font-bold text-[#B8433A]">{metrics.page_faults}</div>
          <div className="text-[9px] text-[#83887E]">{faultPct}% FAULT RATE</div>
        </div>

        {/* Replacements */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">REPLACEMENTS</div>
          <div className="text-base font-bold text-[#DCDCAA]">{metrics.replacements}</div>
          <div className="text-[9px] text-[#83887E]">VICTIMS CHOSEN</div>
        </div>

        {/* Evictions */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">EVICTIONS</div>
          <div className="text-base font-bold text-[#E8F5E9]">{metrics.evictions}</div>
          <div className="text-[9px] text-[#83887E]">PAGES UNMAPPED</div>
        </div>

        {/* Free Frames */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">FREE FRAMES</div>
          <div className="text-base font-bold text-[#4EC9B0]">{metrics.free_frames}</div>
          <div className="text-[9px] text-[#83887E]">UNALLOCATED</div>
        </div>

        {/* Resident Pages */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">RESIDENT PAGES</div>
          <div className="text-base font-bold text-[#E8F5E9]">{metrics.resident_pages}</div>
          <div className="text-[9px] text-[#83887E]">IN RAM POOL</div>
        </div>
      </div>
    </div>
  );
};
