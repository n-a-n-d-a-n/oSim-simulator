import React from 'react';
import type { CPUState, ProcessSnapshot } from '../../types/cpu';

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
      <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 text-center text-[#888888] text-xs font-mono">
        CORE_STATE_OFFLINE
      </div>
    );
  }

  let statusText = 'IDLE';
  let statusColor = 'text-[#888888] border-[#888888] bg-[#888888]/10';

  if (cpuState.is_context_switching) {
    statusText = 'CONTEXT_SWITCH';
    statusColor = 'text-[#FF6B35] border-[#FF6B35] bg-[#FF6B35]/10';
  } else if (cpuState.running_pid) {
    statusText = 'RUNNING';
    statusColor = 'text-[#39FF6A] border-[#39FF6A] bg-[#39FF6A]/10';
  }

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            CPU_CORE_REGISTER
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#888888] bg-[#0A0A0A] px-2 py-0.5 border border-[#2A2A26] rounded-[2px]">
          <span>TICK:</span>
          <span className="font-bold text-[#39FF6A]">{currentTick}</span>
        </div>
      </div>

      {/* Core State & Active PID */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Core State */}
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-[#888888] uppercase tracking-wider">STATE</span>
          <div className="mt-1">
            <span className={`text-xs font-bold px-2 py-0.5 border rounded-[2px] inline-block ${statusColor}`}>
              [{statusText}]
            </span>
          </div>
        </div>

        {/* Active PID */}
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-[#888888] uppercase tracking-wider">ACTIVE PROCESS</span>
          <div className="mt-1">
            {cpuState.running_pid ? (
              <span className="text-xs font-bold text-[#39FF6A] border border-[#39FF6A] bg-[#39FF6A]/10 px-2 py-0.5 rounded-[2px]">
                [{cpuState.running_pid}]
              </span>
            ) : (
              <span className="text-xs text-[#888888]">[NONE]</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Process Telemetry */}
      {currentProcess && (
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] p-2.5 text-xs mb-3 space-y-1.5">
          <div className="flex justify-between text-[#888888] text-[11px]">
            <span>REMAINING BURST:</span>
            <span className="text-[#39FF6A] font-bold">
              {currentProcess.remaining_time} / {currentProcess.burst_time}T
            </span>
          </div>
          {/* Flat retro progress track */}
          <div className="w-full bg-[#12130F] h-1.5 border border-[#2A2A26] rounded-[1px] overflow-hidden">
            <div
              className="bg-[#39FF6A] h-full"
              style={{
                width: `${Math.min(
                  100,
                  (currentProcess.executed_time / currentProcess.burst_time) * 100
                )}%`,
              }}
            />
          </div>
          {cpuState.current_quantum_remaining > 0 && (
            <div className="flex justify-between text-[#888888] text-[11px] pt-1">
              <span>QUANTUM REMAINING:</span>
              <span className="text-[#DCDCAA] font-bold">
                {cpuState.current_quantum_remaining}T
              </span>
            </div>
          )}
        </div>
      )}

      {/* Context Switch Indicator */}
      {cpuState.is_context_switching && (
        <div className="bg-[#FF6B35]/10 border border-[#FF6B35] rounded-[2px] p-2 text-xs text-[#FF6B35] mb-3 flex items-center justify-between">
          <span>CS OVERHEAD REMAINING:</span>
          <span className="font-bold">{cpuState.context_switch_remaining}T</span>
        </div>
      )}

      {/* Cumulative Counters in large monospace numerals */}
      <div className="grid grid-cols-3 gap-2 border-t border-[#2A2A26] pt-2.5 text-center">
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] py-1.5">
          <div className="text-[10px] text-[#888888]">BUSY</div>
          <div className="text-sm font-bold text-[#39FF6A] mt-0.5">
            {cpuState.total_busy_ticks}t
          </div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] py-1.5">
          <div className="text-[10px] text-[#888888]">IDLE</div>
          <div className="text-sm font-bold text-[#E8F5E9] mt-0.5">
            {cpuState.total_idle_ticks}t
          </div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] py-1.5">
          <div className="text-[10px] text-[#888888]">OVERHEAD</div>
          <div className="text-sm font-bold text-[#FF6B35] mt-0.5">
            {cpuState.total_context_switch_ticks}t
          </div>
        </div>
      </div>
    </div>
  );
};

