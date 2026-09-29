import React from 'react';
import type { VirtualMemorySnapshot } from '../../types/virtualMemory';
import { Cpu, ArrowRight } from 'lucide-react';

interface Props {
  snapshot: VirtualMemorySnapshot | null;
  pageSize: number;
}

export const AddressTranslationVisualizer: React.FC<Props> = ({
  snapshot,
  pageSize,
}) => {
  if (!snapshot) {
    return (
      <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-2 font-mono text-center text-xs text-[#83887E]">
        NO SIMULATION ACTIVE
      </div>
    );
  }

  const ref = snapshot.reference;
  const pageNum = ref.page_number;
  const offset = ref.offset;
  const frameNum = snapshot.frame_number;
  const physAddr = snapshot.physical_address;

  const hexVirtual =
    ref.virtual_address !== null && ref.virtual_address !== undefined
      ? `0x${ref.virtual_address.toString(16).toUpperCase()}`
      : `0x${(pageNum * pageSize + offset).toString(16).toUpperCase()}`;

  const hexPhysical =
    physAddr !== null && physAddr !== undefined
      ? `0x${physAddr.toString(16).toUpperCase()}`
      : 'N/A';

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#DCDCAA]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            MMU ADDRESS TRANSLATION PIPELINE
          </span>
        </div>
        <span className="text-[10px] text-[#4EC9B0] font-bold">
          PAGE SIZE: {pageSize} B
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-center">
        {/* Step 1: Virtual Address */}
        <div className="p-2.5 bg-[#080907] border border-[#262922] rounded-[3px] space-y-1">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">
            1. VIRTUAL ADDRESS
          </div>
          <div className="text-sm font-bold text-[#E8F5E9]">{hexVirtual}</div>
          <div className="text-[10px] text-[#83887E]">
            DEC: {ref.virtual_address ?? pageNum * pageSize + offset}
          </div>
        </div>

        <div className="hidden md:flex justify-center text-[#83887E]">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Step 2: Bit Decomposition */}
        <div className="p-2.5 bg-[#080907] border border-[#262922] rounded-[3px] space-y-1">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">
            2. DECOMPOSITION
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold">
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#161912] border border-[#39FF6A]/40 text-[#39FF6A]">
              PAGE: {pageNum}
            </span>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#161912] border border-[#DCDCAA]/40 text-[#DCDCAA]">
              OFFSET: {offset}
            </span>
          </div>
          <div className="text-[9px] text-[#83887E]">
            {pageNum} × {pageSize} + {offset}
          </div>
        </div>

        <div className="hidden md:flex justify-center text-[#83887E]">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Step 3: Physical Address */}
        <div className="p-2.5 bg-[#080907] border border-[#262922] rounded-[3px] space-y-1">
          <div className="text-[10px] text-[#83887E] font-bold uppercase">
            3. PHYSICAL ADDRESS
          </div>
          <div className="text-sm font-bold text-[#4EC9B0]">{hexPhysical}</div>
          <div className="text-[10px] text-[#83887E]">
            FRAME {frameNum} × {pageSize} + {offset}
          </div>
        </div>
      </div>
    </div>
  );
};
