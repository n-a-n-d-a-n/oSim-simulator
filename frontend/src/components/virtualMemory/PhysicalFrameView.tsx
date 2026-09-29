import React from 'react';
import type { PhysicalFrame } from '../../types/virtualMemory';
import { Layers, Clock as ClockIcon } from 'lucide-react';

interface Props {
  frames: PhysicalFrame[];
  clockHand: number | null | undefined;
  activeFrameNumber: number | null;
}

export const PhysicalFrameView: React.FC<Props> = ({
  frames,
  clockHand,
  activeFrameNumber,
}) => {
  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#4EC9B0]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            PHYSICAL MEMORY FRAMES (RAM)
          </span>
        </div>
        <span className="text-[10px] text-[#83887E]">
          {frames.filter((f) => f.is_occupied).length} / {frames.length} OCCUPIED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {frames.map((frame) => {
          const isClockTarget = clockHand !== null && clockHand !== undefined && clockHand === frame.frame_number;
          const isActive = activeFrameNumber === frame.frame_number;

          return (
            <div
              key={frame.frame_number}
              className={`p-3 rounded-[3px] border relative transition-all ${
                isActive
                  ? 'bg-[#181C14] border-[#39FF6A] shadow-[0_0_12px_rgba(57,255,106,0.18)]'
                  : frame.is_occupied
                  ? 'bg-[#0E100C] border-[#2D3A29]'
                  : 'bg-[#080907] border-[#1C2018] border-dashed'
              }`}
            >
              {/* Clock Hand Badge */}
              {isClockTarget && (
                <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-[2px] bg-[#2A2410] border border-[#DCDCAA] text-[#DCDCAA] text-[9px] font-bold flex items-center gap-1 shadow-md">
                  <ClockIcon className="w-2.5 h-2.5" />
                  <span>HAND</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-bold text-[#83887E] mb-1">
                <span>FRAME {frame.frame_number}</span>
                <span className="text-[9px] font-normal text-[#83887E]">
                  REF BIT: {frame.reference_bit}
                </span>
              </div>

              {frame.is_occupied ? (
                <div className="space-y-1">
                  <div className="text-base font-bold text-[#39FF6A] tracking-wider">
                    PAGE {frame.page_number}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#83887E] pt-1 border-t border-[#1C2018]">
                    <span>LOAD: #{frame.loaded_at_tick}</span>
                    <span>ACCESS: #{frame.last_accessed_tick}</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs font-bold text-[#83887E]">
                  [EMPTY / FREE]
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
