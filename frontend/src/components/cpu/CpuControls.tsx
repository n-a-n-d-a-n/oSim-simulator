import React from 'react';
import type { AlgorithmType } from '../../types/cpu';
import { Play } from 'lucide-react';

interface CpuControlsProps {
  algorithm: AlgorithmType;
  onChangeAlgorithm: (alg: AlgorithmType) => void;
  timeQuantum: number;
  onChangeTimeQuantum: (q: number) => void;
  lowerNumberHigherPriority: boolean;
  onChangePriorityMode: (val: boolean) => void;
  contextSwitchCost: number;
  onChangeContextSwitchCost: (cost: number) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
}

const ALGORITHMS: { value: AlgorithmType; label: string; tag: string }[] = [
  { value: 'FCFS', label: 'FCFS (First-Come, First-Served)', tag: 'Non-Preemptive' },
  { value: 'SJF', label: 'SJF (Shortest Job First)', tag: 'Non-Preemptive' },
  { value: 'SRTF', label: 'SRTF (Shortest Remaining Time First)', tag: 'Preemptive' },
  { value: 'ROUND_ROBIN', label: 'Round Robin', tag: 'Preemptive / Quantum' },
  { value: 'PRIORITY_NON_PREEMPTIVE', label: 'Priority Scheduling', tag: 'Non-Preemptive' },
  { value: 'PRIORITY_PREEMPTIVE', label: 'Priority Scheduling', tag: 'Preemptive' },
];

export const CpuControls: React.FC<CpuControlsProps> = ({
  algorithm,
  onChangeAlgorithm,
  timeQuantum,
  onChangeTimeQuantum,
  lowerNumberHigherPriority,
  onChangePriorityMode,
  contextSwitchCost,
  onChangeContextSwitchCost,
  onRunSimulation,
  isLoading,
}) => {
  return (
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-4 font-mono flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#2A2A26] pb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#39FF6A]">&gt;&gt;</span>
            <h3 className="font-semibold text-[#E8F5E9] tracking-wider uppercase">
              SCHEDULER_CONTROL_BANK
            </h3>
          </div>
          <span className="text-[10px] text-[#888888]">[UNIT: 01]</span>
        </div>

        {/* Algorithm Select */}
        <div className="mb-3">
          <label className="block text-[11px] text-[#888888] mb-1.5 uppercase">
            DISPATCH ALGORITHM
          </label>
          <select
            value={algorithm}
            onChange={(e) => onChangeAlgorithm(e.target.value as AlgorithmType)}
            className="w-full bg-[#0A0A0A] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2.5 py-1.5 text-xs text-[#E8F5E9] outline-none transition-colors"
          >
            {ALGORITHMS.map((alg) => (
              <option key={alg.value} value={alg.value} className="bg-[#0A0A0A] text-[#E8F5E9]">
                {alg.label} — [{alg.tag}]
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm-Specific Parameters */}
        <div className="space-y-3 bg-[#0A0A0A] border border-[#2A2A26] rounded-[2px] p-3 mb-3">
          <div className="text-[10px] text-[#888888] uppercase border-b border-[#2A2A26] pb-1">
            RUNTIME PARAMETERS // {algorithm}
          </div>

          {algorithm === 'ROUND_ROBIN' && (
            <div>
              <label className="block text-[11px] text-[#888888] mb-1">
                TIME QUANTUM (<span className="text-[#39FF6A]">Q TICKS</span>)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={timeQuantum}
                onChange={(e) => onChangeTimeQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs text-[#E8F5E9] outline-none"
              />
            </div>
          )}

          {algorithm.startsWith('PRIORITY') && (
            <div>
              <label className="block text-[11px] text-[#888888] mb-1">PRIORITY CONVENTION</label>
              <select
                value={lowerNumberHigherPriority ? 'lower' : 'higher'}
                onChange={(e) => onChangePriorityMode(e.target.value === 'lower')}
                className="w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs text-[#E8F5E9] outline-none"
              >
                <option value="lower" className="bg-[#0A0A0A]">Lower number = Higher priority (1 is highest)</option>
                <option value="higher" className="bg-[#0A0A0A]">Higher number = Higher priority (10 is highest)</option>
              </select>
            </div>
          )}

          {/* Context Switch Cost */}
          <div>
            <label className="block text-[11px] text-[#888888] mb-1">
              CONTEXT-SWITCH OVERHEAD (<span className="text-[#FF6B35]">TICKS</span>)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={contextSwitchCost}
              onChange={(e) => onChangeContextSwitchCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-[#12130F] border border-[#2A2A26] focus:border-[#FF6B35] rounded-[2px] px-2 py-1 text-xs text-[#E8F5E9] outline-none"
            />
            <span className="text-[10px] text-[#888888] mt-1 block">
              Incurred whenever switching between distinct processes.
            </span>
          </div>
        </div>
      </div>

      {/* Engage Simulation Button */}
      <div className="pt-2 border-t border-[#2A2A26]">
        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className="w-full bg-[#12130F] hover:bg-[#161813] active:bg-[#0A0A0A] disabled:opacity-40 text-[#39FF6A] border border-[#39FF6A] py-2 px-3 rounded-[2px] flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-bold tracking-wider uppercase"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border border-[#39FF6A] border-t-transparent animate-spin inline-block" />
              <span>[SIMULATION RUNNING...]</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-[#39FF6A]" />
              <span>[▶ ENGAGE SIMULATION]</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

