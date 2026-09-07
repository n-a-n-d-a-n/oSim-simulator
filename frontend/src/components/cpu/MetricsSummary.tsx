import React from 'react';
import type { AggregateMetrics } from '../../types/cpu';
import { Activity, Clock, Timer, Zap, Shuffle, Hourglass } from 'lucide-react';

interface MetricsSummaryProps {
  metrics: AggregateMetrics | null;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics }) => {
  if (!metrics) return null;

  const items = [
    {
      label: 'CPU Utilization',
      value: `${metrics.cpu_utilization_percent.toFixed(1)}%`,
      sub: `${metrics.total_busy_ticks} busy / ${metrics.total_simulation_time} total ticks`,
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Avg Waiting Time',
      value: `${metrics.average_waiting_time.toFixed(2)}t`,
      sub: 'Time spent waiting in ready queue',
      icon: Clock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Avg Turnaround Time',
      value: `${metrics.average_turnaround_time.toFixed(2)}t`,
      sub: 'Completion time - Arrival time',
      icon: Timer,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.average_response_time.toFixed(2)}t`,
      sub: 'First schedule - Arrival time',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Context Switches',
      value: `${metrics.context_switch_count}`,
      sub: `${metrics.total_context_switch_ticks} ticks spent in overhead`,
      icon: Shuffle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Throughput',
      value: `${metrics.throughput_per_tick.toFixed(3)}/t`,
      sub: 'Completed processes per tick',
      icon: Hourglass,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`border ${item.border} ${item.bg} rounded-xl p-3 shadow-md backdrop-blur-md flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
              <Icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <div className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
