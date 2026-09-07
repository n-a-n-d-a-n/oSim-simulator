import React from 'react';
import type { ProcessSnapshot } from '../../types/cpu';
import { getProcessColor, getStateBadgeColor } from '../../utils/palette';
import { Network } from 'lucide-react';

interface ProcessStatesViewProps {
  processes: Record<string, ProcessSnapshot>;
}

export const ProcessStatesView: React.FC<ProcessStatesViewProps> = ({ processes }) => {
  const pids = Object.keys(processes).sort();

  if (pids.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800/80 pb-2">
        <Network className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
          Live Process States
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {pids.map((pid) => {
          const p = processes[pid];
          const color = getProcessColor(pid);
          const stateColor = getStateBadgeColor(p.state);
          const percentDone = p.burst_time > 0 ? (p.executed_time / p.burst_time) * 100 : 100;

          return (
            <div
              key={pid}
              className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${color.bg} ${color.border} ${color.text}`}
                  >
                    {p.pid}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    arr: {p.arrival_time}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded border ${stateColor.bg} ${stateColor.text} ${stateColor.border}`}
                >
                  {p.state}
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Progress:</span>
                  <span className="text-slate-200">
                    {p.executed_time} / {p.burst_time}t
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-100"
                    style={{ width: `${percentDone}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 pt-1.5 border-t border-slate-800/60">
                <span>Wait: {p.waiting_time}t</span>
                <span>Rem: {p.remaining_time}t</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
