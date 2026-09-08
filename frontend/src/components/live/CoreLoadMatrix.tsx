import React from 'react';

interface CoreLoadMatrixProps {
  perCpuPercent: number[];
}

export const CoreLoadMatrix: React.FC<CoreLoadMatrixProps> = ({ perCpuPercent }) => {
  if (!perCpuPercent || perCpuPercent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 font-mono">
      <div className="flex items-center justify-between text-[10px] text-[#83887E]">
        <span className="uppercase font-semibold tracking-wider">LOGICAL CORE DISTRIBUTION</span>
        <span className="text-[#39FF6A] font-bold">{perCpuPercent.length} CORES SAMPLED</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
        {perCpuPercent.map((pct, idx) => {
          // Heat color logic
          let colorClass = 'text-[#39FF6A] border-[#39FF6A]/30 bg-[#122214]/60';
          let barColor = 'bg-[#39FF6A]';
          if (pct >= 80) {
            colorClass = 'text-[#B8433A] border-[#B8433A]/40 bg-[#291210]/60';
            barColor = 'bg-[#B8433A]';
          } else if (pct >= 50) {
            colorClass = 'text-[#DCDCAA] border-[#DCDCAA]/40 bg-[#242212]/60';
            barColor = 'bg-[#DCDCAA]';
          }

          return (
            <div
              key={idx}
              className={`border rounded-[2px] p-1 flex flex-col justify-between text-[10px] ${colorClass}`}
            >
              <div className="flex justify-between items-center text-[9px] text-[#83887E]">
                <span>C{idx.toString().padStart(2, '0')}</span>
                <span className="font-bold text-white">{pct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#1A1C16] h-1 rounded-[1px] mt-1 overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-300`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
