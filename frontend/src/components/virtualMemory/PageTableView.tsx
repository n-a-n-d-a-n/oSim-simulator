import React from 'react';
import type { PageTableEntry } from '../../types/virtualMemory';
import { Table } from 'lucide-react';

interface Props {
  entries: PageTableEntry[];
  activePageNumber: number | null;
}

export const PageTableView: React.FC<Props> = ({
  entries,
  activePageNumber,
}) => {
  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            SINGLE-LEVEL PAGE TABLE
          </span>
        </div>
        <span className="text-[10px] text-[#83887E]">
          {entries.filter((e) => e.is_present).length} / {entries.length} PAGES RESIDENT
        </span>
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#262922] text-[#83887E] text-[10px] uppercase">
              <th className="py-1.5 px-2">PAGE</th>
              <th className="py-1.5 px-2">PRESENT</th>
              <th className="py-1.5 px-2">FRAME</th>
              <th className="py-1.5 px-2">REF BIT</th>
              <th className="py-1.5 px-2">LOADED AT</th>
              <th className="py-1.5 px-2">LAST ACCESS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isActive = entry.page_number === activePageNumber;
              return (
                <tr
                  key={entry.page_number}
                  className={`border-b border-[#181C14] transition-colors ${
                    isActive
                      ? 'bg-[#181C14] text-[#39FF6A] font-bold border-l-2 border-l-[#39FF6A]'
                      : entry.is_present
                      ? 'text-[#E8F5E9] hover:bg-[#151712]'
                      : 'text-[#83887E] hover:bg-[#12140E]'
                  }`}
                >
                  <td className="py-1 px-2 font-bold">
                    P{entry.page_number}
                  </td>
                  <td className="py-1 px-2">
                    {entry.is_present ? (
                      <span className="px-1.5 py-0.2 rounded-[2px] bg-[#161912] border border-[#39FF6A]/50 text-[#39FF6A] text-[10px] font-bold">
                        YES
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-[2px] bg-[#1A1211] border border-[#B8433A]/50 text-[#B8433A] text-[10px]">
                        NO
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    {entry.frame_number !== null && entry.frame_number !== undefined ? (
                      <span className="text-[#4EC9B0] font-bold">
                        FRAME {entry.frame_number}
                      </span>
                    ) : (
                      <span className="text-[#83887E]">-</span>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <span
                      className={`text-[10px] font-bold ${
                        entry.reference_bit === 1 ? 'text-[#DCDCAA]' : 'text-[#83887E]'
                      }`}
                    >
                      {entry.reference_bit}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-[10px] text-[#83887E]">
                    {entry.loaded_at_tick !== null && entry.loaded_at_tick !== undefined
                      ? `TICK #${entry.loaded_at_tick}`
                      : '-'}
                  </td>
                  <td className="py-1 px-2 text-[10px] text-[#83887E]">
                    {entry.last_accessed_tick !== null && entry.last_accessed_tick !== undefined
                      ? `TICK #${entry.last_accessed_tick}`
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
