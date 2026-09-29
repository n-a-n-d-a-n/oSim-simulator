import React from 'react';
import type { VirtualMemorySnapshot } from '../../types/virtualMemory';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  snapshot: VirtualMemorySnapshot | null;
}

export const PageFaultIndicator: React.FC<Props> = ({ snapshot }) => {
  if (!snapshot) {
    return (
      <div className="p-3 bg-[#11130E] border border-[#262922] rounded-[4px] text-xs text-[#83887E] text-center font-mono">
        READY TO SIMULATE &bull; AWAITING RUN
      </div>
    );
  }

  const isHit = snapshot.is_hit;
  const ref = snapshot.reference;
  const decision = snapshot.replacement_decision;

  return (
    <div
      className={`p-3.5 rounded-[4px] border font-mono transition-all ${
        isHit
          ? 'bg-[#181C14] border-[#39FF6A]/60 shadow-[0_0_15px_rgba(57,255,106,0.15)] text-[#E8F5E9]'
          : 'bg-[#1A1211] border-[#B8433A]/70 shadow-[0_0_15px_rgba(184,67,58,0.2)] text-[#E8F5E9]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Status tag and main reference */}
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-[3px] flex items-center justify-center shrink-0 ${
              isHit
                ? 'bg-[#39FF6A]/10 text-[#39FF6A] border border-[#39FF6A]'
                : 'bg-[#B8433A]/10 text-[#B8433A] border border-[#B8433A]'
            }`}
          >
            {isHit ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isHit ? 'text-[#39FF6A]' : 'text-[#B8433A]'
                }`}
              >
                {isHit ? '● PAGE HIT' : '▲ PAGE FAULT'}
              </span>
              <span className="text-[10px] text-[#83887E]">
                [STEP #{snapshot.step_index + 1}]
              </span>
            </div>
            <div className="text-xs text-[#E8F5E9] font-bold">
              Requested Page {ref.page_number}
              {ref.virtual_address !== null && ref.virtual_address !== undefined && (
                <span className="text-[#83887E] font-normal">
                  {' '}
                  (Addr: 0x{ref.virtual_address.toString(16).toUpperCase()})
                </span>
              )}
              {' ➜ '}
              <span className="text-[#4EC9B0]">Frame {snapshot.frame_number}</span>
            </div>
          </div>
        </div>

        {/* Right: Eviction / Replacement / Clock reasoning */}
        <div className="text-xs text-right">
          {decision ? (
            decision.victim_page !== null && decision.victim_page !== undefined ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-end gap-1.5 text-xs text-[#DCDCAA] font-bold">
                  <span>EVICTED: Page {decision.victim_page}</span>
                  <ArrowRight className="w-3 h-3 text-[#83887E]" />
                  <span className="text-[#39FF6A]">LOADED: Page {decision.requested_page}</span>
                </div>
                <div className="text-[11px] text-[#83887E] max-w-[420px] truncate">
                  {decision.reason}
                </div>
                {decision.frames_scanned && decision.frames_scanned.length > 0 && (
                  <div className="text-[10px] text-[#4EC9B0]">
                    [CLOCK SCANNED FRAMES: {decision.frames_scanned.join(' ➜ ')}]
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-[#4EC9B0] font-bold">
                  FREE FRAME ALLOCATED: Frame {decision.allocated_frame}
                </div>
                <div className="text-[11px] text-[#83887E]">
                  No page eviction required (RAM has free frames)
                </div>
              </div>
            )
          ) : (
            <div className="space-y-0.5">
              <div className="text-[#39FF6A] font-bold">PAGE RESIDENT IN RAM</div>
              <div className="text-[11px] text-[#83887E]">
                Referenced page already mapped in Frame {snapshot.frame_number}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
