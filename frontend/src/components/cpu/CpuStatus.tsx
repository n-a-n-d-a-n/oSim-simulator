import React from 'react';
import type { CPUState, ProcessSnapshot } from '../../types/cpu';
import { getProcessColor } from '../../utils/palette';
import { Cpu, Zap, PauseCircle, RefreshCw } from 'lucide-react';

interface CpuStatusProps {
  cpuState: CPUState | null;
  currentTick: number;
  currentProcess: ProcessSnapshot | null;
}

export const CpuStatus: React.FC<CpuStatusProps> = ({
  cpuState,
  currentTick,
  currentProcess,
}) => {
  if (!cpuState) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center text-slate-500 text-xs">
        CPU state unavailable.
      </div>
    );
  }

  let statusTitle = 'IDLE';
  let statusBadgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
  let StatusIcon = PauseCircle;

  if (cpuState.is_context_switching) {
    statusTitle = 'CONTEXT SWITCH';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    StatusIcon = RefreshCw;
  } else if (cpuState.running_pid) {
    statusTitle = 'RUNNING';
    statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    StatusIcon = Zap;
  }

  const pidColor = cpuState.running_pid ? getProcessColor(cpuState.running_pid) : null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            CPU Core Status
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
          <span>Tick:</span>
          <span className="font-bold text-indigo-400">{currentTick}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Core State */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Core State</span>
          <div className="flex items-center gap-1.5 mt-1">
            <StatusIcon className="w-4 h-4 text-slate-300 animate-pulse" />
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border font-mono ${statusBadgeColor}`}
            >
              {statusTitle}
            </span>
          </div>
        </div>

        {/* Running Process */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Active Process</span>
          <div className="mt-1">
            {cpuState.running_pid && pidColor ? (
              <span
                className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded border ${pidColor.bg} ${pidColor.border} ${pidColor.text}`}
              >
                {cpuState.running_pid}
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Burst details if process is running */}
      {currentProcess && (
        <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800 text-xs mb-3 space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span>Remaining Burst:</span>
            <span className="font-mono font-bold text-indigo-300">
              {currentProcess.remaining_time} / {currentProcess.burst_time} ticks
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-150"
              style={{
                width: `${Math.min(
                  100,
                  (currentProcess.executed_time / currentProcess.burst_time) * 100
                )}%`,
              }}
            />
          </div>
          {cpuState.current_quantum_remaining > 0 && (
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Quantum Remaining:</span>
              <span className="font-mono text-cyan-300">
                {cpuState.current_quantum_remaining} ticks
              </span>
            </div>
          )}
        </div>
      )}

      {/* Context Switch Details */}
      {cpuState.is_context_switching && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-xs text-amber-300 mb-3 flex items-center justify-between font-mono">
          <span>CS Remaining:</span>
          <span className="font-bold">{cpuState.context_switch_remaining} ticks</span>
        </div>
      )}

      {/* Cumulative Counters */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono border-t border-slate-800/80 pt-2.5 text-slate-400">
        <div>
          <div className="text-slate-500">Busy</div>
          <div className="font-bold text-slate-200">{cpuState.total_busy_ticks}t</div>
        </div>
        <div>
          <div className="text-slate-500">Idle</div>
          <div className="font-bold text-slate-200">{cpuState.total_idle_ticks}t</div>
        </div>
        <div>
          <div className="text-slate-500">CS</div>
          <div className="font-bold text-slate-200">{cpuState.total_context_switch_ticks}t</div>
        </div>
      </div>
    </div>
  );
};
