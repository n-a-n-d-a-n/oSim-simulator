import React, { useRef, useEffect } from 'react';
import type { SimulationEvent } from '../../types/cpu';
import { ScrollText } from 'lucide-react';

interface EventLogProps {
  events: SimulationEvent[];
  currentTick: number;
}

function getEventTypeBadge(type: string): { bg: string; text: string; border: string } {
  switch (type) {
    case 'PROCESS_ARRIVED':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' };
    case 'PROCESS_SCHEDULED':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    case 'PROCESS_PREEMPTED':
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' };
    case 'PROCESS_TERMINATED':
      return { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' };
    case 'CONTEXT_SWITCH_STARTED':
    case 'CONTEXT_SWITCH_FINISHED':
      return { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/40' };
    case 'CPU_IDLE':
      return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
    default:
      return { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/40' };
  }
}

export const EventLog: React.FC<EventLogProps> = ({ events, currentTick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-col h-72">
      <div className="flex items-center justify-between mb-2 border-b border-slate-800/80 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            Simulation Event Log ({events.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Through tick: <span className="text-slate-300">{currentTick}</span>
        </span>
      </div>

      <div ref={scrollRef} className="overflow-y-auto space-y-2 pr-1 flex-1 font-mono text-xs">
        {events.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No events logged yet for tick 0.
          </div>
        ) : (
          events.map((evt) => {
            const badge = getEventTypeBadge(evt.event_type);
            const isLatest = evt.tick === currentTick;
            return (
              <div
                key={evt.event_id}
                className={`p-2 rounded-lg border transition-all ${
                  isLatest
                    ? 'bg-slate-800/90 border-indigo-500/60 shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-950/40 border-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                      [{String(evt.tick).padStart(2, '0')}]
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {evt.event_type}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500">{evt.event_id}</span>
                </div>
                <p className="text-[11px] text-slate-200 pl-1">{evt.description}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
