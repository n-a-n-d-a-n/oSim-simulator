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

import { MemoryDashboard } from './components/memory/MemoryDashboard';

import { Cpu, HardDrive, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation Module Tab
  const [activeTab, setActiveTab] = useState<'cpu' | 'memory'>('cpu');

  // CPU Simulator configuration state
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('SRTF');
  const [timeQuantum, setTimeQuantum] = useState<number>(4);
  const [lowerNumberHigherPriority, setLowerNumberHigherPriority] = useState<boolean>(true);
  const [contextSwitchCost, setContextSwitchCost] = useState<number>(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // CPU Workload processes state
  const [processes, setProcesses] = useState<ProcessInputType[]>([
    { pid: 'P1', arrival_time: 0, burst_time: 8, priority: 3 },
    { pid: 'P2', arrival_time: 1, burst_time: 4, priority: 1 },
    { pid: 'P3', arrival_time: 2, burst_time: 9, priority: 4 },
    { pid: 'P4', arrival_time: 3, burst_time: 5, priority: 2 },
  ]);

  // CPU Simulation execution state
  const [simulationResult, setSimulationResult] = useState<CPUSimulateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CPU Playback controller hook
  const playback = useTimelinePlayback(simulationResult);

  const handleRunSimulation = React.useCallback(async () => {
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
      setErrorMessage(err.message || 'An unexpected error occurred while executing the simulation.');
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, processes, timeQuantum, lowerNumberHigherPriority, contextSwitchCost]);

  // Auto-run initial simulation on mount
  useEffect(() => {
    handleRunSimulation();
  }, [handleRunSimulation]);

  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPresetId(preset.id);
    setProcesses(preset.processes);
    setAlgorithm(preset.recommended_algorithm);
    if (preset.time_quantum) {
      setTimeQuantum(preset.time_quantum);
    }
  };

  const currentRunningProcess =
    playback.currentState && playback.currentState.cpu.running_pid
      ? playback.currentState.processes[playback.currentState.cpu.running_pid]
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  OSim Simulator
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  Phase 1 · 2 · 3
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl w-fit shadow-md">
          <button
            onClick={() => setActiveTab('cpu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cpu'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>CPU Scheduling (Phase 1 & 2)</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Contiguous Memory Allocation (Phase 3)</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-400/20 text-violet-300 font-mono border border-violet-400/30">
              NEW
            </span>
          </button>
        </div>

        {/* ACTIVE TAB: CPU SIMULATOR */}
        {activeTab === 'cpu' && (
          <div className="space-y-6">
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
        )}

        {/* ACTIVE TAB: CONTIGUOUS MEMORY ALLOCATOR */}
        {activeTab === 'memory' && (
          <div className="space-y-6">
            <MemoryDashboard />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        OSim &bull; Educational Operating System Resource Simulator &bull; Phase 1 (CPU Engine) + Phase 2 (CPU Frontend) + Phase 3 (Contiguous Memory)
      </footer>
    </div>
  );
};

export default App;
