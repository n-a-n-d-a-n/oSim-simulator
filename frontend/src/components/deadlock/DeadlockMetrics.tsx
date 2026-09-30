import React from 'react';
import type { DeadlockMetrics as DeadlockMetricsType } from '../../types/deadlock';
import { BarChart3, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  metrics: DeadlockMetricsType | null | undefined;
}

export const DeadlockMetrics: React.FC<Props> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] font-mono text-center text-xs text-[#83887E]">
        NO DEADLOCK / BANKER METRICS RECORDED
      </div>
    );
  }

  const utilPct = (metrics.resource_utilization_ratio * 100).toFixed(1);

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            RESOURCE & SAFETY PERFORMANCE METRICS
          </span>
        </div>
        <span className="text-[10px] text-[#83887E] font-bold">
          TOTAL CAPACITY: {metrics.total_resource_instances} UNITS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
        {/* Resource Utilization */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">UTILIZATION</div>
          <div className="text-base font-bold text-[#39FF6A]">{utilPct}%</div>
          <div className="text-[9px] text-[#83887E]">
            {metrics.allocated_instances}/{metrics.total_resource_instances} HELD
          </div>
        </div>

        {/* Free / Available Instances */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">AVAILABLE</div>
          <div className="text-base font-bold text-[#DCDCAA]">{metrics.available_instances}</div>
          <div className="text-[9px] text-[#83887E]">UNALLOCATED</div>
        </div>

        {/* Banker Safety Status */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">BANKER STATE</div>
          <div
            className={`text-base font-bold flex items-center justify-center gap-1 ${
              metrics.is_safe === true
                ? 'text-[#39FF6A]'
                : metrics.is_safe === false
                ? 'text-[#FF4C4C]'
                : 'text-[#83887E]'
            }`}
          >
            {metrics.is_safe === true ? (
              <>
                <ShieldCheck className="w-4 h-4" /> SAFE
              </>
            ) : metrics.is_safe === false ? (
              <>
                <ShieldAlert className="w-4 h-4" /> UNSAFE
              </>
            ) : (
              'N/A'
            )}
          </div>
          <div className="text-[9px] text-[#83887E]">AVOIDANCE CHECK</div>
        </div>

        {/* Deadlock Detection Status */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">DEADLOCK</div>
          <div
            className={`text-base font-bold flex items-center justify-center gap-1 ${
              metrics.is_deadlocked === true
                ? 'text-[#FF4C4C]'
                : metrics.is_deadlocked === false
                ? 'text-[#39FF6A]'
                : 'text-[#83887E]'
            }`}
          >
            {metrics.is_deadlocked === true ? (
              <>
                <Cpu className="w-4 h-4" /> DETECTED
              </>
            ) : metrics.is_deadlocked === false ? (
              'NONE'
            ) : (
              'N/A'
            )}
          </div>
          <div className="text-[9px] text-[#83887E]">
            {metrics.deadlocked_process_count} PROCESS(ES)
          </div>
        </div>

        {/* Request Decisions */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">GRANTED REQS</div>
          <div className="text-base font-bold text-[#39FF6A]">{metrics.granted_requests}</div>
          <div className="text-[9px] text-[#83887E]">OUT OF {metrics.request_count}</div>
        </div>

        {/* Denied / Waiting */}
        <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-0.5">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">DENIED / WAIT</div>
          <div className="text-base font-bold text-[#FF8585]">
            {metrics.denied_requests} / {metrics.waiting_requests}
          </div>
          <div className="text-[9px] text-[#83887E]">UNSAFE / INSUFF</div>
        </div>
      </div>
    </div>
  );
};
