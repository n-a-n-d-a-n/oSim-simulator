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
    <div className="retro-panel p-4 font-mono flex flex-col justify-between h-full shadow-lg">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#262922] pb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#39FF6A] font-bold">&gt;&gt;</span>
            <h3 className="font-bold text-[#E8F5E9] tracking-wider uppercase">
              SCHEDULER_CONTROL_BANK
            </h3>
          </div>
          <span className="text-[10px] text-[#83887E] bg-[#0A0C08] px-1.5 py-0.5 rounded-[2px] border border-[#262922]">[UNIT: 01]</span>
        </div>

        {/* Algorithm Select */}
        <div className="mb-3">
          <label className="block text-[11px] text-[#83887E] mb-1.5 uppercase font-semibold">
            DISPATCH ALGORITHM
          </label>
          <select
            value={algorithm}
            onChange={(e) => onChangeAlgorithm(e.target.value as AlgorithmType)}
            className="w-full bg-[#0A0C08] border border-[#262922] focus:border-[#39FF6A] rounded-[3px] px-2.5 py-1.5 text-xs text-[#E8F5E9] outline-none transition-colors cursor-pointer"
          >
            {ALGORITHMS.map((alg) => (
              <option key={alg.value} value={alg.value} className="bg-[#0A0C08] text-[#E8F5E9]">
                {alg.label} — [{alg.tag}]
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm-Specific Parameters */}
        <div className="space-y-3 bg-[#0A0C08] border border-[#262922] rounded-[3px] p-3 mb-3">
          <div className="text-[10px] text-[#83887E] uppercase border-b border-[#262922] pb-1 font-bold">
            RUNTIME PARAMETERS // {algorithm}
          </div>

          {algorithm === 'ROUND_ROBIN' && (
            <div>
              <label className="block text-[11px] text-[#83887E] mb-1">
                TIME QUANTUM (<span className="text-[#39FF6A] font-bold">Q TICKS</span>)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={timeQuantum}
                onChange={(e) => onChangeTimeQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-[#11130E] border border-[#262922] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs text-[#E8F5E9] outline-none"
              />
            </div>
          )}

          {algorithm.startsWith('PRIORITY') && (
            <div>
              <label className="block text-[11px] text-[#83887E] mb-1 font-semibold">PRIORITY CONVENTION</label>
              <select
                value={lowerNumberHigherPriority ? 'lower' : 'higher'}
                onChange={(e) => onChangePriorityMode(e.target.value === 'lower')}
                className="w-full bg-[#11130E] border border-[#262922] focus:border-[#39FF6A] rounded-[2px] px-2 py-1 text-xs text-[#E8F5E9] outline-none cursor-pointer"
              >
                <option value="lower" className="bg-[#0A0C08]">Lower number = Higher priority (1 is highest)</option>
                <option value="higher" className="bg-[#0A0C08]">Higher number = Higher priority (10 is highest)</option>
              </select>
            </div>
          )}

          {/* Context Switch Cost */}
          <div>
            <label className="block text-[11px] text-[#83887E] mb-1 font-semibold">
              CONTEXT-SWITCH OVERHEAD (<span className="text-[#FF6B35] font-bold">TICKS</span>)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={contextSwitchCost}
              onChange={(e) => onChangeContextSwitchCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-[#11130E] border border-[#262922] focus:border-[#FF6B35] rounded-[2px] px-2 py-1 text-xs text-[#E8F5E9] outline-none"
            />
            <span className="text-[10px] text-[#83887E] mt-1 block">
              Incurred whenever switching between distinct processes.
            </span>
          </div>
        </div>
      </div>

      {/* Engage Simulation Button */}
      <div className="pt-2 border-t border-[#262922]">
        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className="w-full bg-[#122214] hover:bg-[#182F1C] active:scale-[0.99] text-[#39FF6A] border border-[#39FF6A] shadow-[0_0_14px_rgba(57,255,106,0.25)] hover:shadow-[0_0_22px_rgba(57,255,106,0.45)] py-2.5 px-3 rounded-[3px] flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-bold tracking-wider uppercase disabled:opacity-40"
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

