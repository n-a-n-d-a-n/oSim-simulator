import React, { useRef, useEffect } from 'react';
import type { SimulationEvent } from '../../types/cpu';

interface EventLogProps {
  events: SimulationEvent[];
  currentTick: number;
}

function getKeywordColor(type: string): string {
  switch (type) {
    case 'PROCESS_SCHEDULED':
      return 'text-[#39FF6A]';
    case 'PROCESS_ARRIVED':
      return 'text-[#DCDCAA]';
    case 'PROCESS_PREEMPTED':
    case 'CONTEXT_SWITCH_STARTED':
    case 'CONTEXT_SWITCH_FINISHED':
      return 'text-[#FF6B35]';
    case 'PROCESS_TERMINATED':
      return 'text-[#CE9178]';
    case 'CPU_IDLE':
    default:
      return 'text-[#888888]';
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
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 flex flex-col h-72 font-mono">
      {/* Terminal Header */}
      <div className="flex items-center justify-between mb-2 border-b border-[#2A2A26] pb-2 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;</span>
          <span className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            TTY01 // EVENT_STREAM [BAUD: 9600]
          </span>
          <span className="w-1.5 h-3 bg-[#39FF6A] inline-block animate-pulse" />
        </div>
        <span className="text-[11px] text-[#888888]">
          SYNC_TICK: <span className="text-[#39FF6A]">{currentTick}</span>
        </span>
      </div>

      {/* Terminal Feed */}
      <div
        ref={scrollRef}
        className="overflow-y-auto space-y-1.5 pr-1 flex-1 text-xs bg-[#0A0A0A] p-2.5 border border-[#2A2A26] rounded-[2px]"
      >
        {events.length === 0 ? (
          <div className="text-[#888888] text-xs">
            &gt; READY // AWAITING SIMULATION TRIGGER...
          </div>
        ) : (
          events.map((evt) => {
            const kwColor = getKeywordColor(evt.event_type);
            const isLatest = evt.tick === currentTick;

            return (
              <div
                key={evt.event_id}
                className={`flex items-start gap-2 leading-relaxed ${
                  isLatest ? 'bg-[#161813] text-[#E8F5E9]' : 'text-[#888888]'
                }`}
              >
                <span className="text-[#888888] shrink-0 select-none">
                  &gt; [T={String(evt.tick).padStart(2, '0')}]
                </span>
                <div className="flex-1">
                  <span className={`font-bold mr-2 ${kwColor}`}>
                    [{evt.event_type}]
                  </span>
                  <span className={isLatest ? 'text-[#E8F5E9]' : 'text-[#888888]'}>
                    {evt.description}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

