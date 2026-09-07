import React from 'react';
import { getProcessColor } from '../../utils/palette';
import { Layers, ArrowRight } from 'lucide-react';

interface ReadyQueueProps {
  readyQueue: string[];
}

export const ReadyQueue: React.FC<ReadyQueueProps> = ({ readyQueue }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            Ready Queue ({readyQueue.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Head &rarr; Tail</span>
      </div>

      {readyQueue.length === 0 ? (
        <div className="text-center py-5 text-xs text-slate-500 font-mono bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
          Ready queue is empty
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {readyQueue.map((pid, idx) => {
            const color = getProcessColor(pid);
            return (
              <React.Fragment key={pid}>
                <div
                  className={`flex flex-col items-center justify-center min-w-14 px-3 py-2 rounded-lg border ${color.bg} ${color.border} shadow-sm`}
                >
                  <span className={`text-xs font-bold font-mono ${color.text}`}>{pid}</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">#{idx + 1}</span>
                </div>
                {idx < readyQueue.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
