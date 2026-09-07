import React from 'react';
import type { MemoryOperationInput as MemOpType, MemoryOperationType } from '../../types/memory';
import { Plus, Trash2, ArrowDownUp, ListOrdered } from 'lucide-react';

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
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-cyan-400" />
          Scheduled Memory Operations ({operations.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSortByTick}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
            title="Sort chronologically by simulation tick"
          >
            <ArrowDownUp className="w-3 h-3" />
            Sort by Tick
          </button>
          <button
            onClick={handleAddOperation}
            className="flex items-center gap-1 text-xs text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30 transition-colors font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Operation
          </button>
        </div>
      </div>

      {operations.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          No operations defined. Click "Add Operation" or load an educational preset above.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
          <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-400 font-semibold px-2 py-1 bg-slate-950/60 rounded">
            <span className="col-span-2">Tick</span>
            <span className="col-span-3">Action</span>
            <span className="col-span-3">Request ID</span>
            <span className="col-span-3">Size</span>
            <span className="col-span-1 text-center">Del</span>
          </div>

          {operations.map((op, idx) => (
            <div
              key={`op-${idx}`}
              className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-800/60 rounded transition-colors"
            >
              {/* Tick */}
              <div className="col-span-2">
                <input
                  type="number"
                  min={0}
                  value={op.tick}
                  onChange={(e) => handleUpdate(idx, 'tick', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Action Type */}
              <div className="col-span-3">
                <select
                  value={op.operation_type}
                  onChange={(e) =>
                    handleUpdate(idx, 'operation_type', e.target.value as MemoryOperationType)
                  }
                  className={`w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-cyan-500 ${
                    op.operation_type === 'ALLOCATE' ? 'text-emerald-400' : 'text-blue-400'
                  }`}
                >
                  <option value="ALLOCATE">ALLOCATE</option>
                  <option value="DEALLOCATE">DEALLOCATE</option>
                </select>
              </div>

              {/* Request ID */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={op.request_id}
                  onChange={(e) => handleUpdate(idx, 'request_id', e.target.value.trim().toUpperCase())}
                  placeholder="e.g. P1"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 uppercase"
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
                      handleUpdate(idx, 'size', Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                  />
                ) : (
                  <span className="text-slate-600 text-[11px] block text-center py-1">N/A</span>
                )}
              </div>

              {/* Delete Button */}
              <div className="col-span-1 text-center">
                <button
                  onClick={() => handleRemoveOperation(idx)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
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
