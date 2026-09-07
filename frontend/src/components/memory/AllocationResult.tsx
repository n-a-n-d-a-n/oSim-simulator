import React from 'react';
import type { OperationResultSnapshot, MemoryMetricsSnapshot } from '../../types/memory';
import { CheckCircle, XCircle, Trash2, Info } from 'lucide-react';

interface AllocationResultProps {
  result: OperationResultSnapshot | null;
  metrics?: MemoryMetricsSnapshot | null;
}

export const AllocationResult: React.FC<AllocationResultProps> = ({ result, metrics }) => {
  if (!result) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span>No operations executed at current tick. Step timeline forward to view operation results.</span>
      </div>
    );
  }

  const isAllocate = result.operation_type === 'ALLOCATE';

  if (!isAllocate) {
    // DEALLOCATE Operation
    return (
      <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl space-y-1">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <Trash2 className="w-4 h-4" />
          <span>Deallocation Executed</span>
        </div>
        <p className="text-xs text-blue-200/90 font-mono">
          Process <strong>{result.request_id}</strong> released {result.allocated_size || 0} units starting at address {result.allocated_start_address ?? 0}. Adjacent free partitions were automatically coalesced.
        </p>
      </div>
    );
  }

  if (result.success) {
    // Successful ALLOCATE Operation
    const endAddress = (result.allocated_start_address ?? 0) + (result.allocated_size ?? 0);
    return (
      <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>✓ Allocation Successful</span>
        </div>
        <div className="text-xs text-emerald-200/90 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Process: <strong>{result.request_id}</strong></span>
          <span>Size: <strong>{result.size} units</strong></span>
          <span>Address Range: <strong>[{result.allocated_start_address}, {endAddress})</strong></span>
        </div>
      </div>
    );
  }

  // Failed ALLOCATE Operation
  return (
    <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
        <XCircle className="w-4 h-4" />
        <span>✗ Allocation Failed</span>
      </div>

      <div className="text-xs text-rose-200/90 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>Requested: <strong>{result.size} units</strong></span>
        {metrics && (
          <>
            <span>Total Free Memory: <strong>{metrics.free_memory} units</strong></span>
            <span>Largest Free Block: <strong>{metrics.largest_free_block} units</strong></span>
          </>
        )}
      </div>

      <div className="p-2.5 bg-rose-950/60 rounded border border-rose-900/50 text-xs text-rose-300">
        <p className="font-semibold text-rose-200 mb-0.5">Educational Explanation:</p>
        <p>{result.reason || 'No contiguous free block is large enough to satisfy this request.'}</p>
        <p className="mt-1 text-[11px] text-rose-400/90">
          Note: Having sufficient total free memory does NOT guarantee that a contiguous allocation succeeds. All units must be in a single continuous address interval.
        </p>
      </div>
    </div>
  );
};
