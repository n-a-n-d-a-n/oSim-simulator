import React from 'react';
import type { ProcessInput as ProcessInputType, AlgorithmType } from '../../types/cpu';
import { getProcessColor } from '../../utils/palette';
import { Plus, Trash2, ListFilter, AlertCircle } from 'lucide-react';

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
      .map((p) => parseInt(p.pid.replace(/\D/g, '')))
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            Workload Process Set ({processes.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAddProcess}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-indigo-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Process</span>
        </button>
      </div>

      {hasDuplicatePids && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Duplicate process IDs detected! Each PID must be unique.</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="pb-2 font-mono">PID</th>
              <th className="pb-2">Arrival (ticks)</th>
              <th className="pb-2">Burst (ticks)</th>
              {isPriorityAlgorithm && <th className="pb-2">Priority</th>}
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {processes.map((proc, index) => {
              const color = getProcessColor(proc.pid);
              return (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${color.bg} ${color.border} border`}
                      />
                      <input
                        type="text"
                        value={proc.pid}
                        onChange={(e) => handleUpdate(index, 'pid', e.target.value)}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      value={proc.arrival_time}
                      onChange={(e) =>
                        handleUpdate(index, 'arrival_time', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={1}
                      value={proc.burst_time}
                      onChange={(e) =>
                        handleUpdate(index, 'burst_time', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  {isPriorityAlgorithm && (
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={proc.priority}
                        onChange={(e) =>
                          handleUpdate(index, 'priority', parseInt(e.target.value) || 0)
                        }
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                  )}

                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveProcess(index)}
                      disabled={processes.length <= 1}
                      className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 p-1 rounded transition-colors cursor-pointer"
                      title="Remove Process"
                    >
                      <Trash2 className="w-4 h-4" />
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
