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

import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation Module Tab
  const [activeTab, setActiveTab] = useState<'cpu' | 'memory'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'memory' || params.has('memory_tick')) return 'memory';
      if (window.location.hash.includes('memory')) return 'memory';
    }
    return 'cpu';
  });

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
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8F5E9] flex flex-col font-mono selection:bg-[#39FF6A]/20 selection:text-[#39FF6A]">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4 flex-1">
        {/* Console Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A26] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#12130F] border border-[#39FF6A] rounded-[2px] flex items-center justify-center text-[#39FF6A]">
              <span className="font-bold text-sm">Ω</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-wider text-[#E8F5E9] uppercase">
                  OSIM // SYSTEMS CONSOLE
                </h1>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#12130F] border border-[#2A2A26] text-[#DCDCAA]">
                  REV 3.1
                </span>
              </div>
              <p className="text-[11px] text-[#888888]">
                DETERMINISTIC CPU SCHEDULING &bull; REAL-TIME OSCILLOSCOPE LOG
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#888888]">
            <div className="flex items-center gap-1.5 bg-[#12130F] border border-[#2A2A26] px-2 py-1 rounded-[2px]">
              <span className="w-2 h-2 rounded-full bg-[#39FF6A] animate-pulse" />
              <span className="text-[#39FF6A] font-bold">CORE ONLINE</span>
            </div>
          </div>
        </header>

        {/* Instrument Switch Tabs */}
        <div className="flex items-center gap-2 p-1 bg-[#12130F] border border-[#2A2A26] rounded-[2px] w-fit">
          <button
            onClick={() => setActiveTab('cpu')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'cpu'
                ? 'bg-[#0A0A0A] text-[#39FF6A] border border-[#39FF6A]'
                : 'text-[#888888] hover:text-[#E8F5E9] border border-transparent'
            }`}
          >
            <span>[•]</span>
            <span>CPU SCHEDULING (PHASE 1 &amp; 2)</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-[#0A0A0A] text-[#DCDCAA] border border-[#DCDCAA]'
                : 'text-[#888888] hover:text-[#E8F5E9] border border-transparent'
            }`}
          >
            <span>[ ]</span>
            <span>CONTIGUOUS MEMORY ALLOCATION (PHASE 3)</span>
          </button>
        </div>

        {/* ACTIVE TAB: CPU SIMULATOR */}
        {activeTab === 'cpu' && (
          <div className="space-y-4">
            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-[#B8433A]/10 border border-[#B8433A] rounded-[2px] p-3 flex items-center gap-3 text-[#E8F5E9] text-xs">
                <AlertCircle className="w-4 h-4 text-[#B8433A] shrink-0" />
                <div>
                  <span className="font-bold text-[#B8433A]">SYSTEM ERROR: </span>
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
      <footer className="border-t border-[#2A2A26] bg-[#0A0A0A] py-3 text-center text-xs text-[#888888] font-mono">
        OSIM // EDUCATIONAL OPERATING SYSTEM RESOURCE SIMULATOR &bull; RETRO SYSTEMS CONSOLE REV 3.1
      </footer>
    </div>
  );
};

export default App;

