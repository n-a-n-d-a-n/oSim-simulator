import React from 'react';
import type { AlgorithmType } from '../../types/cpu';
import { Play, Settings2, Sliders } from 'lucide-react';

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
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            Algorithm & Scheduler Setup
          </h3>
        </div>

        {/* Algorithm Select */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            CPU Scheduling Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => onChangeAlgorithm(e.target.value as AlgorithmType)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            {ALGORITHMS.map((alg) => (
              <option key={alg.value} value={alg.value}>
                {alg.label} — [{alg.tag}]
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm-Specific Settings */}
        <div className="space-y-3 bg-slate-800/40 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Parameters for {algorithm}</span>
          </div>

          {algorithm === 'ROUND_ROBIN' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Time Quantum (<span className="text-indigo-400 font-mono">q</span> ticks)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={timeQuantum}
                onChange={(e) => onChangeTimeQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Each process is allocated up to {timeQuantum} ticks before round-robin preemption.
              </span>
            </div>
          )}

          {algorithm.startsWith('PRIORITY') && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">Priority Convention</label>
              <select
                value={lowerNumberHigherPriority ? 'lower' : 'higher'}
                onChange={(e) => onChangePriorityMode(e.target.value === 'lower')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="lower">Lower number = Higher priority (1 is highest)</option>
                <option value="higher">Higher number = Higher priority (10 is highest)</option>
              </select>
            </div>
          )}

          {/* Context Switch Cost */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Context-Switch Overhead (<span className="text-amber-400 font-mono">ticks</span>)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={contextSwitchCost}
              onChange={(e) => onChangeContextSwitchCost(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Extra ticks penalty incurred whenever switching execution between distinct processes.
            </span>
          </div>
        </div>
      </div>

      {/* Run Action */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all duration-150 cursor-pointer text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
