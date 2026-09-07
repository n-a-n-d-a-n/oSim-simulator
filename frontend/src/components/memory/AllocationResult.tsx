import React from 'react';
import type { OperationResultSnapshot, MemoryMetricsSnapshot } from '../../types/memory';

interface AllocationResultProps {
  result: OperationResultSnapshot | null;
  metrics?: MemoryMetricsSnapshot | null;
}

export const AllocationResult: React.FC<AllocationResultProps> = ({ result, metrics }) => {
  if (!result) {
    return (
      <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-3 text-[#888888] text-xs font-mono">
        &gt; NO DISPATCH EXECUTED AT CURRENT TICK // ADVANCE TIMELINE TRANSPORT
      </div>
    );
  }

  const isAllocate = result.operation_type === 'ALLOCATE';

  if (!isAllocate) {
    // DEALLOCATE Operation
    return (
      <div className="bg-[#12130F] border border-[#CE9178] rounded-[4px] p-3 font-mono space-y-1">
        <div className="flex items-center gap-2 text-[#CE9178] font-bold text-xs">
          <span>&gt;&gt; [DEALLOCATE] EXECUTION_OK</span>
        </div>
        <p className="text-[11px] text-[#888888] leading-relaxed">
          PROCESS <span className="text-[#CE9178] font-bold">[{result.request_id}]</span> RELEASED {result.allocated_size || 0}U STARTING AT ADDR {result.allocated_start_address ?? 0}. ADJACENT FREE HOLES COALESCED.
        </p>
      </div>
    );
  }

  if (result.success) {
    // Successful ALLOCATE Operation
    const endAddress = (result.allocated_start_address ?? 0) + (result.allocated_size ?? 0);
    return (
      <div className="bg-[#12130F] border border-[#39FF6A] rounded-[4px] p-3 font-mono space-y-1">
        <div className="flex items-center gap-2 text-[#39FF6A] font-bold text-xs">
          <span>&gt;&gt; [ALLOCATE] SUCCESSFUL</span>
        </div>
        <div className="text-[11px] text-[#888888] flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>PROCESS: <strong className="text-[#39FF6A]">[{result.request_id}]</strong></span>
          <span>SIZE: <strong className="text-[#E8F5E9]">{result.size}U</strong></span>
          <span>ADDR RANGE: <strong className="text-[#39FF6A]">[{result.allocated_start_address}, {endAddress})</strong></span>
        </div>
      </div>
    );
  }

  // Failed ALLOCATE Operation
  return (
    <div className="bg-[#12130F] border border-[#B8433A] rounded-[4px] p-3 font-mono space-y-2">
      <div className="flex items-center gap-2 text-[#B8433A] font-bold text-xs">
        <span>&gt;&gt; [ALLOCATE] FAILED // INSUFFICIENT CONTIGUOUS SPACE</span>
      </div>

      <div className="text-[11px] text-[#888888] flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>REQUESTED: <strong className="text-[#B8433A]">{result.size}U</strong></span>
        {metrics && (
          <>
            <span>TOTAL FREE: <strong className="text-[#DCDCAA]">{metrics.free_memory}U</strong></span>
            <span>LARGEST HOLE: <strong className="text-[#FF6B35]">{metrics.largest_free_block}U</strong></span>
          </>
        )}
      </div>

      <div className="p-2 bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] text-[10px] text-[#888888]">
        <span className="text-[#B8433A] font-bold">DIAGNOSTIC: </span>
        {result.reason || 'No single contiguous free partition is large enough.'} Having sufficient total free memory does not guarantee contiguous allocation.
      </div>
    </div>
  );
};

