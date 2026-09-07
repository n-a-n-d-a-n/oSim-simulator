import React from 'react';
import type { ProcessMetrics } from '../../types/cpu';

interface ProcessTableProps {
  processMetrics: Record<string, ProcessMetrics>;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ processMetrics }) => {
  const pids = Object.keys(processMetrics).sort();

  if (pids.length === 0) return null;

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            EXECUTION_METRICS_LEDGER
          </h3>
        </div>
        <span className="text-[11px] text-[#888888]">FINAL DISPOSITION REPORT</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2A2A26] text-[#888888] text-[11px]">
              <th className="pb-2 font-semibold">PID</th>
              <th className="pb-2 font-semibold">ARRIVAL (AT)</th>
              <th className="pb-2 font-semibold">BURST (BT)</th>
              <th className="pb-2 font-semibold">COMPLETION (CT)</th>
              <th className="pb-2 font-semibold">TURNAROUND (TAT)</th>
              <th className="pb-2 font-semibold">WAITING (WT)</th>
              <th className="pb-2 font-semibold">RESPONSE (RT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A26]">
            {pids.map((pid) => {
              const pm = processMetrics[pid];
              return (
                <tr key={pid} className="hover:bg-[#161813] transition-colors">
                  <td className="py-2.5 font-bold">
                    <span className="text-[#39FF6A] border border-[#39FF6A]/60 bg-[#39FF6A]/10 px-1.5 py-0.5 rounded-[2px]">
                      [{pm.pid}]
                    </span>
                  </td>
                  <td className="py-2.5 text-[#888888]">{pm.arrival_time}</td>
                  <td className="py-2.5 text-[#E8F5E9]">{pm.burst_time}</td>
                  <td className="py-2.5 text-[#39FF6A] font-bold">{pm.completion_time}</td>
                  <td className="py-2.5 text-[#E8F5E9]">{pm.turnaround_time}</td>
                  <td className="py-2.5 text-[#DCDCAA] font-bold">{pm.waiting_time}</td>
                  <td className="py-2.5 text-[#CE9178]">{pm.response_time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-[#888888] mt-2.5 pt-2 border-t border-[#2A2A26] flex flex-wrap gap-4">
        <span>FORMULAE:</span>
        <span>TAT = CT - AT</span>
        <span>&bull;</span>
        <span>WT = TAT - BT</span>
        <span>&bull;</span>
        <span>RT = FIRST_SCHEDULE - AT</span>
      </div>
    </div>
  );
};

