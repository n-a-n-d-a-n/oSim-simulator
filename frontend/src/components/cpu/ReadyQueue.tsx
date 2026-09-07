import React from 'react';

interface ReadyQueueProps {
  readyQueue: string[];
}

export const ReadyQueue: React.FC<ReadyQueueProps> = ({ readyQueue }) => {
  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#DCDCAA]">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
            READY_QUEUE_BUFFER ({readyQueue.length})
          </h3>
        </div>
        <span className="text-[11px] text-[#888888]">DISPATCH ORDER: HEAD &rarr; TAIL</span>
      </div>

      {readyQueue.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] py-4 text-center text-xs text-[#888888]">
          HEAD &rarr; [EMPTY_QUEUE] &rarr; TAIL
        </div>
      ) : (
        <div className="bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] p-3 overflow-x-auto flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#888888] shrink-0">HEAD &rarr;</span>
          {readyQueue.map((pid, idx) => {
            return (
              <React.Fragment key={pid}>
                <div className="flex items-center gap-1.5 bg-[#12130F] border border-[#DCDCAA] px-2.5 py-1 rounded-[2px] shrink-0">
                  <span className="text-xs font-bold text-[#DCDCAA] tracking-wider">
                    [{pid}]
                  </span>
                  <span className="text-[10px] text-[#888888]">#{idx + 1}</span>
                </div>
                {idx < readyQueue.length - 1 && (
                  <span className="text-[#888888] text-xs shrink-0">&rarr;</span>
                )}
              </React.Fragment>
            );
          })}
          <span className="text-[11px] font-bold text-[#888888] shrink-0">&rarr; TAIL</span>
        </div>
      )}
    </div>
  );
};

