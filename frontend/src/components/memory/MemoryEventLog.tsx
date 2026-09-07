import React, { useState } from 'react';
import type { MemoryEvent } from '../../types/memory';
import { ScrollText, Search } from 'lucide-react';

interface MemoryEventLogProps {
  events: MemoryEvent[];
  currentTick: number;
}

export const MemoryEventLog: React.FC<MemoryEventLogProps> = ({ events, currentTick }) => {
  const [filterText, setFilterText] = useState<string>('');

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'MEMORY_ALLOCATED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'MEMORY_ALLOCATION_FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'MEMORY_DEALLOCATED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'MEMORY_BLOCK_SPLIT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEMORY_BLOCK_MERGED':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

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
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-cyan-400" />
          Memory Event Stream ({events.length})
        </h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter events..."
            className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No events match current filter or tick boundary.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isCurrentTick = evt.tick === currentTick;
            return (
              <div
                key={evt.event_id}
                className={`p-2 rounded-lg border transition-all ${
                  isCurrentTick
                    ? 'bg-slate-800/80 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getEventBadge(
                      evt.event_type
                    )}`}
                  >
                    {evt.event_type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    TICK {evt.tick}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">
                  {evt.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
