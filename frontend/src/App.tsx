import React, { useState, useEffect } from 'react';
import type {
  AlgorithmType,
  ProcessInput as ProcessInputType,
  CPUSimulateResponse,
  PresetItem,
} from './types/cpu';
import { simulateCpu } from './services/cpuApi';
import { useTimelinePlayback } from './hooks/useTimelinePlayback';

import { PresetSelector } from './components/cpu/PresetSelector';
import { CpuControls } from './components/cpu/CpuControls';
import { ProcessInput } from './components/cpu/ProcessInput';
import { GanttChart } from './components/cpu/GanttChart';
import { MetricsSummary } from './components/cpu/MetricsSummary';
import { ProcessTable } from './components/cpu/ProcessTable';
import { CpuStatus } from './components/cpu/CpuStatus';
import { ReadyQueue } from './components/cpu/ReadyQueue';
import { ProcessStatesView } from './components/cpu/ProcessStatesView';
import { EventLog } from './components/cpu/EventLog';
import { TimelineControls } from './components/cpu/TimelineControls';

import { Cpu, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // Simulator configuration state
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('SRTF');
  const [timeQuantum, setTimeQuantum] = useState<number>(4);
  const [lowerNumberHigherPriority, setLowerNumberHigherPriority] = useState<boolean>(true);
  const [contextSwitchCost, setContextSwitchCost] = useState<number>(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Workload processes state
  const [processes, setProcesses] = useState<ProcessInputType[]>([
    { pid: 'P1', arrival_time: 0, burst_time: 8, priority: 3 },
    { pid: 'P2', arrival_time: 1, burst_time: 4, priority: 1 },
    { pid: 'P3', arrival_time: 2, burst_time: 9, priority: 4 },
    { pid: 'P4', arrival_time: 3, burst_time: 5, priority: 2 },
  ]);

  // Simulation execution state
  const [simulationResult, setSimulationResult] = useState<CPUSimulateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback controller hook
  const playback = useTimelinePlayback(simulationResult);

  // Auto-run initial simulation on mount
  useEffect(() => {
    handleRunSimulation();
  }, []);

  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPresetId(preset.id);
    setProcesses(preset.processes);
    setAlgorithm(preset.recommended_algorithm);
    if (preset.time_quantum) {
      setTimeQuantum(preset.time_quantum);
    }
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await simulateCpu({
        algorithm,
        processes,
        time_quantum: algorithm === 'ROUND_ROBIN' ? timeQuantum : undefined,
        lower_number_higher_priority: lowerNumberHigherPriority,
        context_switch_cost: contextSwitchCost,
      });
      setSimulationResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const currentRunningProcess =
    playback.currentState && playback.currentState.cpu.running_pid
      ? playback.currentState.processes[playback.currentState.cpu.running_pid]
      : null;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">OSim</h1>
                <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  Phase 2 &bull; CPU Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive Operating System Resource Management Simulator &bull; Pure Deterministic Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">FastAPI REST Ready</span>
          </div>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-semibold">Error: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Top Section: Workload Configuration & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Presets & Workload Input */}
          <div className="lg:col-span-2 space-y-5">
            <PresetSelector
              onSelectPreset={handleSelectPreset}
              selectedPresetId={selectedPresetId}
            />
            <ProcessInput
              processes={processes}
              onChangeProcesses={(procs) => {
                setProcesses(procs);
                setSelectedPresetId(null);
              }}
              algorithm={algorithm}
            />
          </div>

          {/* Algorithm Settings & Run Button */}
          <div>
            <CpuControls
              algorithm={algorithm}
              onChangeAlgorithm={(alg) => {
                setAlgorithm(alg);
                setSelectedPresetId(null);
              }}
              timeQuantum={timeQuantum}
              onChangeTimeQuantum={setTimeQuantum}
              lowerNumberHigherPriority={lowerNumberHigherPriority}
              onChangePriorityMode={setLowerNumberHigherPriority}
              contextSwitchCost={contextSwitchCost}
              onChangeContextSwitchCost={setContextSwitchCost}
              onRunSimulation={handleRunSimulation}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Simulation Output Section */}
        {simulationResult && (
          <div className="space-y-6 pt-2">
            {/* Top Aggregate Metrics */}
            <MetricsSummary metrics={simulationResult.metrics} />

            {/* Timeline Playback Bar */}
            <TimelineControls
              currentTick={playback.currentTick}
              maxTicks={playback.maxTicks}
              isPlaying={playback.isPlaying}
              speed={playback.speed}
              onPlay={playback.play}
              onPause={playback.pause}
              onStepForward={playback.stepForward}
              onReset={playback.reset}
              onSeekTick={playback.setTick}
              onChangeSpeed={playback.setSpeed}
            />

            {/* Interactive Gantt Chart */}
            <GanttChart
              segments={simulationResult.gantt_segments}
              totalTime={simulationResult.total_simulation_time}
              currentTick={playback.currentTick}
              onSeekTick={playback.setTick}
            />

            {/* Middle Row: Synchronized CPU Core Status + Ready Queue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CpuStatus
                cpuState={playback.currentState?.cpu || null}
                currentTick={playback.currentTick}
                currentProcess={currentRunningProcess}
              />
              <ReadyQueue readyQueue={playback.currentState?.ready_queue || []} />
            </div>

            {/* Lower Row: Live Process States + Event Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ProcessStatesView processes={playback.currentState?.processes || {}} />
              <EventLog
                events={playback.recentEvents}
                currentTick={playback.currentTick}
              />
            </div>

            {/* Bottom: Final Process Metrics Table */}
            <ProcessTable processMetrics={simulationResult.metrics.process_metrics} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-600 font-mono">
        OSim Educational OS Simulator &bull; Phase 2: CPU Scheduling API + Frontend Slice &bull; Verified Invariants
      </footer>
    </div>
  );
};

export default App;
