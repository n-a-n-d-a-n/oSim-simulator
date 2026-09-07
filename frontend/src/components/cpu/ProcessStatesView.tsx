import React from 'react';
import type { ProcessSnapshot } from '../../types/cpu';
import { getStateBadgeColor } from '../../utils/palette';

interface ProcessStatesViewProps {
  processes: Record<string, ProcessSnapshot>;
}

export const ProcessStatesView: React.FC<ProcessStatesViewProps> = ({ processes }) => {
  const pids = Object.keys(processes).sort();

  if (pids.length === 0) return null;

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4">
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <span className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            PROCESS_STATE_REGISTER ({pids.length})
          </span>
        </div>
        <span className="text-[#888888] text-[11px]">FORMAT: [STATE] PID METRICS PROGRESS</span>
      </div>

      {/* Terminal log lines list */}
      <div className="space-y-1.5 font-mono text-xs">
        {pids.map((pid) => {
          const p = processes[pid];
          const badge = getStateBadgeColor(p.state);
          const percent = p.burst_time > 0 ? Math.round((p.executed_time / p.burst_time) * 100) : 100;
          const totalSlots = 10;
          const filledSlots = Math.round((percent / 100) * totalSlots);
          const emptySlots = totalSlots - filledSlots;
          const textProgressBar = `[${'='.repeat(Math.max(0, filledSlots > 0 ? filledSlots - 1 : 0))}${filledSlots > 0 ? '>' : ''}${'.'.repeat(emptySlots)}]`;

          return (
            <div
              key={pid}
              className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-[#39FF6A]/40 transition-colors"
            >
              {/* Bracket State Tag + Process PID */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 text-[11px] font-bold border rounded-[2px] ${badge.bg} ${badge.border} ${badge.text}`}
                >
                  [{p.state}]
                </span>
                <span className="font-bold text-[#E8F5E9] tracking-wider text-xs">
                  {p.pid}
                </span>
              </div>

              {/* Monospace telemetry data */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#888888]">
                <span>
                  rem=<span className="text-[#E8F5E9] font-medium">{p.remaining_time}</span>
                </span>
                <span>
                  burst=<span className="text-[#E8F5E9] font-medium">{p.burst_time}</span>
                </span>
                <span>
                  arr=<span className="text-[#888888]">{p.arrival_time}</span>
                </span>
                <span>
                  wait=<span className="text-[#DCDCAA]">{p.waiting_time}</span>
                </span>
                <span className="text-[#39FF6A] hidden md:inline">
                  {textProgressBar} {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

