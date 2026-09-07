import React from 'react';
import type { MemoryMetricsSnapshot } from '../../types/memory';
import { Layers, HardDrive, PieChart, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface MemoryMetricsProps {
  metrics: MemoryMetricsSnapshot;
}

export const MemoryMetrics: React.FC<MemoryMetricsProps> = ({ metrics }) => {
  const usedPct = metrics.total_memory > 0 ? ((metrics.used_memory / metrics.total_memory) * 100).toFixed(1) : '0';
  const freePct = metrics.total_memory > 0 ? ((metrics.free_memory / metrics.total_memory) * 100).toFixed(1) : '0';
  const extFragPct = (metrics.external_fragmentation_ratio * 100).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Memory */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Memory</span>
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.total_memory} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">100% capacity</div>
        </div>

        {/* Used Memory */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Used Memory</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {metrics.used_memory} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            {usedPct}% ({metrics.allocated_block_count} blocks)
          </div>
        </div>

        {/* Free Memory */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Free Memory</span>
            <PieChart className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {metrics.free_memory} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            {freePct}% ({metrics.free_block_count} holes)
          </div>
        </div>

        {/* Largest Free Block */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Largest Free Block</span>
            <Layers className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300">
            {metrics.largest_free_block} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Max contiguous size</div>
        </div>

        {/* External Fragmentation */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Ext. Fragmentation</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {metrics.external_fragmentation} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Ratio: {extFragPct}% (Free - Max)
          </div>
        </div>

        {/* Allocation Success/Fail */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Operations</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex items-center gap-3 text-lg font-bold font-mono mt-0.5">
            <span className="text-emerald-400 flex items-center gap-1 text-base">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {metrics.allocation_success_count}
            </span>
            <span className="text-rose-400 flex items-center gap-1 text-base">
              <XCircle className="w-3.5 h-3.5" />
              {metrics.allocation_failure_count}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Success vs Failure
          </div>
        </div>
      </div>

      {/* Educational Note on Internal Fragmentation */}
      <div className="px-4 py-2 bg-slate-900/40 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-center justify-between">
        <span>
          <strong className="text-slate-300">Internal Fragmentation:</strong> 0 units (In variable-sized contiguous allocation, partitions exactly match requested sizes without padding).
        </span>
        <span className="text-slate-500 font-mono text-[11px]">
          External Frag = Total Free ({metrics.free_memory}) - Largest Hole ({metrics.largest_free_block}) = {metrics.external_fragmentation}u
        </span>
      </div>
    </div>
  );
};
