import React from 'react';
import type { MemoryOperationInput as MemOpType, MemoryOperationType } from '../../types/memory';
import { Plus, Trash2, ArrowDownUp } from 'lucide-react';

interface MemoryOperationInputProps {
  operations: MemOpType[];
  setOperations: (ops: MemOpType[]) => void;
}

export const MemoryOperationInput: React.FC<MemoryOperationInputProps> = ({
  operations,
  setOperations,
}) => {
  const handleAddOperation = () => {
    const nextTick = operations.length > 0 ? Math.max(...operations.map((o) => o.tick)) + 1 : 0;
    const nextId = `P${operations.length + 1}`;
    setOperations([
      ...operations,
      {
        tick: nextTick,
        operation_type: 'ALLOCATE',
        request_id: nextId,
        size: 150,
      },
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof MemOpType, value: any) => {
    const updated = [...operations];
    updated[index] = { ...updated[index], [field]: value };
    setOperations(updated);
  };

  const handleSortByTick = () => {
    const sorted = [...operations].sort((a, b) => a.tick - b.tick);
    setOperations(sorted);
  };

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2A26] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            SCHEDULED_MEMORY_OPERATIONS ({operations.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSortByTick}
            className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#E8F5E9] bg-[#0A0A0A] px-2 py-1 rounded-[2px] border border-[#2A2A26] hover:border-[#888888] transition-colors cursor-pointer"
            title="Sort chronologically by simulation tick"
          >
            <ArrowDownUp className="w-3 h-3" />
            <span>[SORT]</span>
          </button>
          <button
            onClick={handleAddOperation}
            className="flex items-center gap-1 text-xs text-[#39FF6A] bg-[#12130F] hover:bg-[#161813] px-2.5 py-1 rounded-[2px] border border-[#39FF6A]/60 hover:border-[#39FF6A] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ ADD OP]</span>
          </button>
        </div>
      </div>

      {operations.length === 0 ? (
        <div className="p-4 text-center text-xs text-[#888888] border border-dashed border-[#2A2A26] rounded-[2px]">
          NO OPERATIONS DEFINED // CLICK [+ ADD OP] OR LOAD A ROM WORKLOAD BANK ABOVE
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
          <div className="grid grid-cols-12 gap-2 text-[11px] text-[#888888] font-semibold px-2 py-1 bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px]">
            <span className="col-span-2">TICK</span>
            <span className="col-span-3">ACTION</span>
            <span className="col-span-3">REQ_ID</span>
            <span className="col-span-3">SIZE (U)</span>
            <span className="col-span-1 text-center">DEL</span>
          </div>

          {operations.map((op, idx) => (
            <div
              key={`op-${idx}`}
              className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 bg-[#0A0A0A] hover:bg-[#161813] border border-[#2A2A26] rounded-[2px] transition-colors"
            >
              {/* Tick */}
              <div className="col-span-2">
                <input
                  type="number"
                  min={0}
                  value={op.tick}
                  onChange={(e) => handleUpdate(idx, 'tick', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-1.5 py-1 text-[#E8F5E9] text-xs outline-none"
                />
              </div>

              {/* Action Type */}
              <div className="col-span-3">
                <select
                  value={op.operation_type}
                  onChange={(e) =>
                    handleUpdate(idx, 'operation_type', e.target.value as MemoryOperationType)
                  }
                  className={`w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-1.5 py-1 text-xs outline-none ${
                    op.operation_type === 'ALLOCATE' ? 'text-[#39FF6A]' : 'text-[#CE9178]'
                  }`}
                >
                  <option value="ALLOCATE" className="bg-[#0A0A0A] text-[#39FF6A]">ALLOCATE</option>
                  <option value="DEALLOCATE" className="bg-[#0A0A0A] text-[#CE9178]">DEALLOCATE</option>
                </select>
              </div>

              {/* Request ID */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={op.request_id}
                  onChange={(e) => handleUpdate(idx, 'request_id', e.target.value.trim().toUpperCase())}
                  placeholder="e.g. P1"
                  className="w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-1.5 py-1 text-[#E8F5E9] text-xs outline-none uppercase"
                />
              </div>

              {/* Size (for ALLOCATE) */}
              <div className="col-span-3">
                {op.operation_type === 'ALLOCATE' ? (
                  <input
                    type="number"
                    min={1}
                    value={op.size ?? 100}
                    onChange={(e) =>
                      handleUpdate(idx, 'size', Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-1.5 py-1 text-[#E8F5E9] text-xs outline-none"
                  />
                ) : (
                  <span className="text-[#888888] text-[11px] block text-center py-1">N/A</span>
                )}
              </div>

              {/* Delete Button */}
              <div className="col-span-1 text-center">
                <button
                  onClick={() => handleRemoveOperation(idx)}
                  className="text-[#888888] hover:text-[#B8433A] transition-colors p-1 cursor-pointer"
                  title="Remove operation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

