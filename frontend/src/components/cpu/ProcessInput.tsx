import React from 'react';
import type { ProcessInput as ProcessInputType, AlgorithmType } from '../../types/cpu';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface ProcessInputProps {
  processes: ProcessInputType[];
  onChangeProcesses: (procs: ProcessInputType[]) => void;
  algorithm: AlgorithmType;
}

export const ProcessInput: React.FC<ProcessInputProps> = ({
  processes,
  onChangeProcesses,
  algorithm,
}) => {
  const isPriorityAlgorithm = algorithm.startsWith('PRIORITY');

  const handleUpdate = (index: number, field: keyof ProcessInputType, value: any) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    onChangeProcesses(updated);
  };

  const handleAddProcess = () => {
    const existingNums = processes
      .map((p) => parseInt(p.pid.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : processes.length + 1;
    const newPid = `P${nextNum}`;

    onChangeProcesses([
      ...processes,
      {
        pid: newPid,
        arrival_time: 0,
        burst_time: 4,
        priority: 1,
      },
    ]);
  };

  const handleRemoveProcess = (index: number) => {
    if (processes.length <= 1) return;
    const updated = processes.filter((_, i) => i !== index);
    onChangeProcesses(updated);
  };

  const pids = processes.map((p) => p.pid.trim());
  const hasDuplicatePids = pids.some((pid, idx) => pids.indexOf(pid) !== idx);

  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF6A] text-xs font-bold">&gt;&gt;</span>
          <h3 className="font-semibold text-[#E8F5E9] text-xs tracking-wider uppercase">
            PUNCH-CARD PROCESS STRIPS ({processes.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAddProcess}
          className="flex items-center gap-1.5 bg-[#12130F] hover:bg-[#1A1C16] text-[#39FF6A] px-2.5 py-1 rounded-[2px] text-xs font-mono border border-[#39FF6A]/60 hover:border-[#39FF6A] cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>[+ PUNCH NEW STRIP]</span>
        </button>
      </div>

      {hasDuplicatePids && (
        <div className="flex items-center gap-2 text-xs text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35] p-2 rounded-[2px] mb-3 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>DUPLICATE PID DETECTED // EACH STRIP MUST HAVE A UNIQUE PID</span>
        </div>
      )}

      {/* Process Table with Punch-Card Columns */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#2A2A26] text-[#888888] text-[11px]">
              <th className="pb-2 font-semibold">PID</th>
              <th className="pb-2 font-semibold">PUNCH STRIP</th>
              <th className="pb-2 font-semibold">ARRIVAL (T)</th>
              <th className="pb-2 font-semibold">BURST (T)</th>
              {isPriorityAlgorithm && <th className="pb-2 font-semibold">PRIORITY</th>}
              <th className="pb-2 text-right font-semibold">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A26]">
            {processes.map((proc, index) => {
              // Punch-card perforation representations
              // Priority holes: red punch #B8433A
              const priorityPunches = Math.min(5, Math.max(1, proc.priority || 1));
              const burstPunches = Math.min(6, Math.max(1, Math.ceil(proc.burst_time / 2)));
              const arrivalPunched = proc.arrival_time > 0;

              return (
                <tr key={index} className="hover:bg-[#161813] transition-colors">
                  {/* PID */}
                  <td className="py-2.5 pr-2">
                    <input
                      type="text"
                      value={proc.pid}
                      onChange={(e) => handleUpdate(index, 'pid', e.target.value)}
                      className="w-16 bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs font-mono text-[#E8F5E9] outline-none"
                    />
                  </td>

                  {/* Punch Card Hole Track */}
                  <td className="py-2.5 pr-3">
                    <div
                      className="inline-flex items-center gap-1 bg-[#0A0A0A] border border-[#2A2A26] px-2 py-1 rounded-[2px]"
                      title="Punch-card strip: Arrival (amber), Burst (green), Priority (crimson red)"
                    >
                      {/* Arrival punch indicator */}
                      <span
                        className={`w-2 h-2 rounded-full border border-[#2A2A26] ${
                          arrivalPunched ? 'bg-[#DCDCAA]' : 'bg-[#161813]'
                        }`}
                        title={`Arrival punch: ${proc.arrival_time}t`}
                      />

                      {/* Burst punch indicators */}
                      {Array.from({ length: 4 }).map((_, bIdx) => (
                        <span
                          key={`b-${bIdx}`}
                          className={`w-2 h-2 rounded-full border border-[#2A2A26] ${
                            bIdx < burstPunches ? 'bg-[#39FF6A]' : 'bg-[#161813]'
                          }`}
                          title={`Burst punch track ${bIdx + 1}`}
                        />
                      ))}

                      {/* Priority punch indicator (crimson red #B8433A) */}
                      {isPriorityAlgorithm && (
                        <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-[#2A2A26]">
                          {Array.from({ length: 3 }).map((_, pIdx) => (
                            <span
                              key={`p-${pIdx}`}
                              className={`w-2 h-2 rounded-full border border-[#2A2A26] ${
                                pIdx < priorityPunches ? 'bg-[#B8433A]' : 'bg-[#161813]'
                              }`}
                              title={`Priority punch marker: ${proc.priority}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Arrival Time */}
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      value={proc.arrival_time}
                      onChange={(e) =>
                        handleUpdate(index, 'arrival_time', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-20 bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs font-mono text-[#E8F5E9] outline-none"
                    />
                  </td>

                  {/* Burst Time */}
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      min={1}
                      value={proc.burst_time}
                      onChange={(e) =>
                        handleUpdate(index, 'burst_time', Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-20 bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs font-mono text-[#E8F5E9] outline-none"
                    />
                  </td>

                  {/* Priority */}
                  {isPriorityAlgorithm && (
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#B8433A]" />
                        <input
                          type="number"
                          value={proc.priority}
                          onChange={(e) =>
                            handleUpdate(index, 'priority', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#B8433A] rounded-[2px] px-2 py-1 text-xs font-mono text-[#E8F5E9] outline-none"
                        />
                      </div>
                    </td>
                  )}

                  {/* Action */}
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveProcess(index)}
                      disabled={processes.length <= 1}
                      className="text-[#888888] hover:text-[#B8433A] disabled:opacity-20 p-1 rounded-[2px] transition-colors cursor-pointer"
                      title="Eject Punch Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

