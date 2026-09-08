import React from 'react';
import type { AggregateMetrics } from '../../types/cpu';

interface MetricsSummaryProps {
  metrics: AggregateMetrics | null;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics }) => {
  if (!metrics) return null;

  const items = [
    {
      label: 'CPU UTILIZATION',
      value: `${metrics.cpu_utilization_percent.toFixed(1)}%`,
      sub: `${metrics.total_busy_ticks} / ${metrics.total_simulation_time} TICKS`,
      color: 'text-[#39FF6A]',
    },
    {
      label: 'AVG WAIT TIME',
      value: `${metrics.average_waiting_time.toFixed(2)}t`,
      sub: 'READY QUEUE LATENCY',
      color: 'text-[#DCDCAA]',
    },
    {
      label: 'AVG TURNAROUND',
      value: `${metrics.average_turnaround_time.toFixed(2)}t`,
      sub: 'CT - AT INTERVAL',
      color: 'text-[#E8F5E9]',
    },
    {
      label: 'AVG RESPONSE',
      value: `${metrics.average_response_time.toFixed(2)}t`,
      sub: 'INITIAL SCHEDULE LAG',
      color: 'text-[#DCDCAA]',
    },
    {
      label: 'CONTEXT SWITCHES',
      value: `${metrics.context_switch_count}`,
      sub: `${metrics.total_context_switch_ticks}T OVERHEAD PENALTY`,
      color: 'text-[#FF6B35]',
    },
    {
      label: 'THROUGHPUT',
      value: `${metrics.throughput_per_tick.toFixed(3)}/t`,
      sub: 'COMPLETIONS PER TICK',
      color: 'text-[#CE9178]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="retro-panel p-3 flex flex-col justify-between hover:border-[#383D33] transition-all hover:translate-y-[-1px]"
        >
          <span className="text-[10px] text-[#83887E] uppercase tracking-wider font-semibold">
            {item.label}
          </span>
          <div className="my-1.5">
            <div className={`text-xl font-bold tracking-tight ${item.color}`}>
              {item.value}
            </div>
            <div className="text-[10px] text-[#83887E] truncate mt-0.5">
              {item.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

