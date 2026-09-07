import React, { useState, useRef, useEffect } from 'react';
import type { MemoryEvent } from '../../types/memory';

interface MemoryEventLogProps {
  events: MemoryEvent[];
  currentTick: number;
}

function getMemoryKeywordColor(type: string): string {
  switch (type) {
    case 'MEMORY_ALLOCATED':
      return 'text-[#39FF6A]';
    case 'MEMORY_BLOCK_SPLIT':
    case 'MEMORY_BLOCK_MERGED':
      return 'text-[#DCDCAA]';
    case 'MEMORY_DEALLOCATED':
      return 'text-[#CE9178]';
    case 'MEMORY_ALLOCATION_FAILED':
      return 'text-[#B8433A]';
    default:
      return 'text-[#FF6B35]';
  }
}

export const MemoryEventLog: React.FC<MemoryEventLogProps> = ({ events, currentTick }) => {
  const [filterText, setFilterText] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const filteredEvents = events.filter((e) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      e.event_type.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      String(e.tick).includes(q)
    );
  });

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono flex flex-col h-72">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 border-b border-[#2A2A26] pb-2 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A]">&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            TTY02 // MEMORY_EVENT_STREAM [BAUD: 9600]
          </h3>
          <span className="w-1.5 h-3 bg-[#39FF6A] inline-block animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="FILTER EVENTS..."
            className="bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-0.5 text-xs text-[#E8F5E9] placeholder-[#888888] outline-none w-36 sm:w-44"
          />
          <span className="text-[11px] text-[#888888]">
            SYNC_TICK: <span className="text-[#39FF6A]">{currentTick}</span>
          </span>
        </div>
      </div>

      {/* Terminal Feed */}
      <div
        ref={scrollRef}
        className="overflow-y-auto space-y-1.5 pr-1 flex-1 text-xs bg-[#0A0A0A] p-2.5 border border-[#2A2A26] rounded-[2px]"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-[#888888] text-xs">
            &gt; READY // AWAITING MEMORY OPERATIONS...
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const kwColor = getMemoryKeywordColor(evt.event_type);
            const isCurrentTick = evt.tick === currentTick;

            return (
              <div
                key={evt.event_id}
                className={`flex items-start gap-2 leading-relaxed ${
                  isCurrentTick ? 'bg-[#161813] text-[#E8F5E9]' : 'text-[#888888]'
                }`}
              >
                <span className="text-[#888888] shrink-0 select-none">
                  &gt; [T={String(evt.tick).padStart(2, '0')}]
                </span>
                <div className="flex-1">
                  <span className={`font-bold mr-2 ${kwColor}`}>
                    [{evt.event_type}]
                  </span>
                  <span className={isCurrentTick ? 'text-[#E8F5E9]' : 'text-[#888888]'}>
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

