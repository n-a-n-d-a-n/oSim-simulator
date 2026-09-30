import React, { useRef, useEffect } from 'react';
import type { DeadlockEvent } from '../../types/deadlock';
import { Terminal } from 'lucide-react';

interface Props {
  events: DeadlockEvent[];
  currentTick: number;
}

export const DeadlockEventLog: React.FC<Props> = ({ events, currentTick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, currentTick]);

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            SIMULATION EVENT LOG STREAM
          </span>
        </div>
        <span className="text-[10px] text-[#83887E] font-bold">TOTAL EVENTS: {events.length}</span>
      </div>

      <div
        ref={scrollRef}
        className="h-44 overflow-y-auto bg-[#0A0C08] border border-[#262922] rounded-[3px] p-2.5 space-y-1.5 text-xs text-[#A4AAA0]"
      >
        {events.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-[#83887E]">
            NO EVENTS DISPATCHED
          </div>
        ) : (
          events.map((evt) => {
            const isCurrent = evt.tick === currentTick;
            return (
              <div
                key={evt.event_id}
                className={`p-1.5 rounded transition-colors flex items-start gap-2 ${
                  isCurrent
                    ? 'bg-[#182615] text-[#E8F5E9] border-l-2 border-[#39FF6A]'
                    : 'hover:bg-[#121410]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#39FF6A] whitespace-nowrap">
                  [T+{evt.tick.toString().padStart(2, '0')}]
                </span>
                <span className="text-[10px] font-bold text-[#DCDCAA] whitespace-nowrap">
                  {evt.event_type}
                </span>
                <span className="text-[10px] text-[#83887E] whitespace-nowrap">
                  ({evt.component})
                </span>
                <span className="text-[11px] flex-1 leading-snug">{evt.description}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
