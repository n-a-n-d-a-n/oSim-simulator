import React from 'react';
import type { ProcessMetrics } from '../../types/cpu';
import { getProcessColor } from '../../utils/palette';
import { Table } from 'lucide-react';

interface ProcessTableProps {
  processMetrics: Record<string, ProcessMetrics>;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ processMetrics }) => {
  const pids = Object.keys(processMetrics).sort();

  if (pids.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <Table className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
          Process Execution Metrics
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium font-mono">
              <th className="pb-2">PID</th>
              <th className="pb-2">Arrival (AT)</th>
              <th className="pb-2">Burst (BT)</th>
              <th className="pb-2">Completion (CT)</th>
              <th className="pb-2">Turnaround (TAT)</th>
              <th className="pb-2">Waiting (WT)</th>
              <th className="pb-2">Response (RT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {pids.map((pid) => {
              const pm = processMetrics[pid];
              const color = getProcessColor(pid);
              return (
                <tr key={pid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-bold">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded border ${color.bg} ${color.border} ${color.text}`}
                    >
                      {pm.pid}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{pm.arrival_time}</td>
                  <td className="py-2.5 text-slate-300">{pm.burst_time}</td>
                  <td className="py-2.5 text-indigo-300 font-semibold">{pm.completion_time}</td>
                  <td className="py-2.5 text-slate-200">{pm.turnaround_time}</td>
                  <td className="py-2.5 text-cyan-300 font-semibold">{pm.waiting_time}</td>
                  <td className="py-2.5 text-amber-300">{pm.response_time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-slate-500 mt-2 font-mono">
        Formulas: TAT = CT - AT &bull; WT = TAT - BT &bull; RT = Start - AT
      </div>
    </div>
  );
};
