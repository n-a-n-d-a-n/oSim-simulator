import React from 'react';
import type { DeadlockSystemState } from '../../types/deadlock';
import { Table, Server } from 'lucide-react';

interface Props {
  systemState: DeadlockSystemState | null | undefined;
  activeProcessId?: string | null;
  activeMode: 'BANKER_AVOIDANCE' | 'DEADLOCK_DETECTION';
}

export const DeadlockMatrixView: React.FC<Props> = ({
  systemState,
  activeProcessId,
  activeMode,
}) => {
  if (!systemState) {
    return (
      <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] font-mono text-center text-xs text-[#83887E]">
        NO RESOURCE SYSTEM STATE LOADED
      </div>
    );
  }

  const { processes, resource_types, total, available, allocation, maximum, need, request } =
    systemState;

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            RESOURCE VECTORS & ALLOCATION MATRICES
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#83887E]">
          <span>PROCESSES: {processes.length}</span>
          <span>RESOURCES: {resource_types.length}</span>
        </div>
      </div>

      {/* Top summary vectors: Total (E) and Available (A) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Total Vector */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#83887E]">
            <span className="text-[#E8F5E9]">TOTAL RESOURCE VECTOR (E)</span>
            <span>Capacity</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {resource_types.map((res, idx) => (
              <div
                key={res}
                className="flex-1 min-w-[50px] p-1.5 bg-[#161814] border border-[#262922] rounded text-center"
              >
                <div className="text-[10px] text-[#83887E] font-bold">{res}</div>
                <div className="text-sm font-bold text-[#39FF6A]">{total[idx] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Vector */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#83887E]">
            <span className="text-[#39FF6A]">AVAILABLE VECTOR (A / Work)</span>
            <span>Unallocated</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {resource_types.map((res, idx) => (
              <div
                key={res}
                className="flex-1 min-w-[50px] p-1.5 bg-[#161814] border border-[#262922] rounded text-center"
              >
                <div className="text-[10px] text-[#83887E] font-bold">{res}</div>
                <div className="text-sm font-bold text-[#39FF6A]">{available[idx] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matrices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Allocation Matrix */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#E8F5E9] border-b border-[#262922] pb-1">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#39FF6A]" />
              ALLOCATION [Alloc]
            </span>
            <span className="text-[9px] text-[#83887E]">HELD</span>
          </div>
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="text-[#83887E] text-[10px]">
                <th className="py-1 text-left">PID</th>
                {resource_types.map((r) => (
                  <th key={r} className="py-1">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((proc, pIdx) => {
                const isActive = proc === activeProcessId;
                return (
                  <tr
                    key={proc}
                    className={`border-t border-[#1C1E19] transition-colors ${
                      isActive ? 'bg-[#1C2C18] text-[#39FF6A] font-bold' : 'text-[#E8F5E9]'
                    }`}
                  >
                    <td className="py-1 text-left text-[11px] font-bold text-[#83887E]">{proc}</td>
                    {resource_types.map((_, rIdx) => (
                      <td key={rIdx} className="py-1">
                        {allocation[pIdx]?.[rIdx] ?? 0}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Center Matrix: Maximum (Banker) or Request (Detection) */}
        {activeMode === 'BANKER_AVOIDANCE' ? (
          <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#E8F5E9] border-b border-[#262922] pb-1">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#DCDCAA]" />
                MAXIMUM [Max]
              </span>
              <span className="text-[9px] text-[#83887E]">CLAIM</span>
            </div>
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[#83887E] text-[10px]">
                  <th className="py-1 text-left">PID</th>
                  {resource_types.map((r) => (
                    <th key={r} className="py-1">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map((proc, pIdx) => {
                  const isActive = proc === activeProcessId;
                  return (
                    <tr
                      key={proc}
                      className={`border-t border-[#1C1E19] transition-colors ${
                        isActive ? 'bg-[#1C2C18] text-[#39FF6A] font-bold' : 'text-[#E8F5E9]'
                      }`}
                    >
                      <td className="py-1 text-left text-[11px] font-bold text-[#83887E]">{proc}</td>
                      {resource_types.map((_, rIdx) => (
                        <td key={rIdx} className="py-1">
                          {maximum[pIdx]?.[rIdx] ?? 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#E8F5E9] border-b border-[#262922] pb-1">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#E89E39]" />
                REQUEST [Request]
              </span>
              <span className="text-[9px] text-[#83887E]">WAITING</span>
            </div>
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[#83887E] text-[10px]">
                  <th className="py-1 text-left">PID</th>
                  {resource_types.map((r) => (
                    <th key={r} className="py-1">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map((proc, pIdx) => {
                  const isActive = proc === activeProcessId;
                  return (
                    <tr
                      key={proc}
                      className={`border-t border-[#1C1E19] transition-colors ${
                        isActive ? 'bg-[#1C2C18] text-[#39FF6A] font-bold' : 'text-[#E8F5E9]'
                      }`}
                    >
                      <td className="py-1 text-left text-[11px] font-bold text-[#83887E]">{proc}</td>
                      {resource_types.map((_, rIdx) => (
                        <td key={rIdx} className="py-1">
                          {request[pIdx]?.[rIdx] ?? 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Right Matrix: Need (Banker) or Request Summary */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#E8F5E9] border-b border-[#262922] pb-1">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#39FF6A]" />
              {activeMode === 'BANKER_AVOIDANCE' ? 'REMAINING NEED [Need = Max - Alloc]' : 'MATRIX INVARIANTS'}
            </span>
            <span className="text-[9px] text-[#83887E]">
              {activeMode === 'BANKER_AVOIDANCE' ? 'COMPUTED' : 'CHECK'}
            </span>
          </div>
          {activeMode === 'BANKER_AVOIDANCE' ? (
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[#83887E] text-[10px]">
                  <th className="py-1 text-left">PID</th>
                  {resource_types.map((r) => (
                    <th key={r} className="py-1">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map((proc, pIdx) => {
                  const isActive = proc === activeProcessId;
                  return (
                    <tr
                      key={proc}
                      className={`border-t border-[#1C1E19] transition-colors ${
                        isActive ? 'bg-[#1C2C18] text-[#39FF6A] font-bold' : 'text-[#E8F5E9]'
                      }`}
                    >
                      <td className="py-1 text-left text-[11px] font-bold text-[#83887E]">{proc}</td>
                      {resource_types.map((_, rIdx) => (
                        <td key={rIdx} className="py-1 font-semibold text-[#39FF6A]">
                          {need[pIdx]?.[rIdx] ?? 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-2 text-[11px] text-[#83887E] space-y-2">
              <div className="flex items-center justify-between">
                <span>Conservation Law:</span>
                <span className="text-[#39FF6A] font-bold">Alloc + Available == Total</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Algorithm input:</span>
                <span className="text-[#E89E39] font-bold">Request Matrix (NOT Need)</span>
              </div>
              <div className="text-[10px] leading-relaxed text-[#A4AAA0]">
                Multi-instance detection performs row reduction against Available/Work vector without needing maximum claims.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
