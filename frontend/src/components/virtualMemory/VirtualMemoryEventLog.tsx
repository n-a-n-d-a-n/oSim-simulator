import React, { useState } from 'react';
import type { VirtualMemoryEvent } from '../../types/virtualMemory';
import { Terminal, Filter } from 'lucide-react';

interface Props {
  events: VirtualMemoryEvent[];
  currentStep: number;
}

export const VirtualMemoryEventLog: React.FC<Props> = ({
  events,
  currentStep,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'FAULTS_HITS') {
      return e.event_type === 'PAGE_FAULT' || e.event_type === 'PAGE_HIT';
    }
    if (filterType === 'EVICTIONS') {
      return (
        e.event_type === 'PAGE_EVICTED' ||
        e.event_type === 'PAGE_EVICTION_STARTED' ||
        e.event_type === 'FREE_FRAME_SELECTED'
      );
    }
    return true;
  });

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#4EC9B0]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            PAGING EVENT LOG (STEP #{currentStep + 1})
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#83887E]" />
          {['ALL', 'FAULTS_HITS', 'EVICTIONS'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border cursor-pointer ${
                filterType === f
                  ? 'bg-[#181C14] text-[#4EC9B0] border-[#4EC9B0]'
                  : 'bg-[#0E100C] text-[#83887E] border-[#262922] hover:text-[#E8F5E9]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#080907] border border-[#262922] rounded-[3px] p-2.5 max-h-[220px] overflow-y-auto space-y-1.5 text-xs">
        {filteredEvents.length === 0 ? (
          <div className="text-[11px] text-[#83887E] text-center py-4">
            NO SIMULATION EVENTS RECORDED YET
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const isHit = evt.event_type === 'PAGE_HIT';
            const isFault = evt.event_type === 'PAGE_FAULT';
            const isEvict = evt.event_type === 'PAGE_EVICTED';

            return (
              <div
                key={evt.event_id || idx}
                className="flex items-start gap-2 leading-relaxed"
              >
                <span className="text-[#83887E] shrink-0 text-[10px]">
                  [TICK #{evt.tick}]
                </span>

                <span
                  className={`px-1 py-0.2 rounded-[2px] text-[9px] font-bold shrink-0 ${
                    isHit
                      ? 'bg-[#39FF6A]/10 text-[#39FF6A] border border-[#39FF6A]/40'
                      : isFault
                      ? 'bg-[#B8433A]/10 text-[#B8433A] border border-[#B8433A]/40'
                      : isEvict
                      ? 'bg-[#DCDCAA]/10 text-[#DCDCAA] border border-[#DCDCAA]/40'
                      : 'bg-[#181C14] text-[#83887E] border border-[#262922]'
                  }`}
                >
                  {evt.event_type}
                </span>

                <span
                  className={`text-[11px] ${
                    isHit
                      ? 'text-[#39FF6A]'
                      : isFault
                      ? 'text-[#B8433A]'
                      : 'text-[#E8F5E9]'
                  }`}
                >
                  {evt.description}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
