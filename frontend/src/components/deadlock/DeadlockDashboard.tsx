import React, { useState, useEffect, useCallback } from 'react';
import type {
  DeadlockPresetItem,
  DeadlockSimulationResponse,
  DeadlockPresetCategory,
} from '../../types/deadlock';
import {
  fetchDeadlockPresets,
  evaluateBankerSafety,
  evaluateResourceRequest,
  detectDeadlock,
} from '../../services/deadlockApi';
import { useDeadlockTimelinePlayback } from '../../hooks/useDeadlockTimelinePlayback';

import { DeadlockPresetSelector } from './DeadlockPresetSelector';
import { DeadlockMatrixView } from './DeadlockMatrixView';
import { BankerSafetyVisualizer } from './BankerSafetyVisualizer';
import { ResourceRequestSimulator } from './ResourceRequestSimulator';
import { ResourceAllocationGraphView } from './ResourceAllocationGraphView';
import { DeadlockMetrics } from './DeadlockMetrics';
import { DeadlockTimelineControls } from './DeadlockTimelineControls';
import { DeadlockEventLog } from './DeadlockEventLog';

import { AlertCircle, RefreshCw } from 'lucide-react';

export const DeadlockDashboard: React.FC = () => {
  const [activeMode, setActiveMode] = useState<DeadlockPresetCategory>('BANKER_AVOIDANCE');
  const [presets, setPresets] = useState<DeadlockPresetItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    'silberschatz_banker_safe'
  );
  const [simulationResult, setSimulationResult] =
    useState<DeadlockSimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playback = useDeadlockTimelinePlayback(simulationResult);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  // Fetch presets on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPresets() {
      try {
        const loadedPresets = await fetchDeadlockPresets();
        if (isMounted) {
          setPresets(loadedPresets);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch presets';
          setErrorMessage(msg);
        }
      }
    }
    loadPresets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Run simulation based on current preset and mode
  const runSimulationForPreset = useCallback(
    async (preset: DeadlockPresetItem, modeToUse: DeadlockPresetCategory) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        let result: DeadlockSimulationResponse;
        if (modeToUse === 'BANKER_AVOIDANCE') {
          result = await evaluateBankerSafety({
            processes: preset.processes,
            resource_types: preset.resource_types,
            total: preset.total,
            available: preset.available,
            allocation: preset.allocation,
            maximum: preset.maximum,
            need: preset.need,
          });
        } else {
          result = await detectDeadlock({
            processes: preset.processes,
            resource_types: preset.resource_types,
            total: preset.total,
            available: preset.available,
            allocation: preset.allocation,
            request: preset.request,
          });
        }
        setSimulationResult(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Simulation failed';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger simulation on initial load when presets arrive
  useEffect(() => {
    if (presets.length > 0 && selectedPresetId && !simulationResult) {
      const p = presets.find((item) => item.id === selectedPresetId);
      if (p) {
        runSimulationForPreset(p, activeMode);
      }
    }
  }, [presets, selectedPresetId, simulationResult, activeMode, runSimulationForPreset]);

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = presets.find((item) => item.id === presetId);
    if (p) {
      const newMode = p.category;
      setActiveMode(newMode);
      runSimulationForPreset(p, newMode);
    }
  };

  // Handle mode toggle
  const handleChangeMode = (mode: DeadlockPresetCategory) => {
    setActiveMode(mode);
    if (selectedPreset) {
      runSimulationForPreset(selectedPreset, mode);
    }
  };

  // Handle interactive resource request
  const handleSubmitResourceRequest = async (
    processId: string,
    requestVector: number[]
  ) => {
    if (!selectedPreset) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await evaluateResourceRequest({
        processes: selectedPreset.processes,
        resource_types: selectedPreset.resource_types,
        total: selectedPreset.total,
        available: selectedPreset.available,
        allocation: selectedPreset.allocation,
        maximum: selectedPreset.maximum,
        requesting_process_id: processId,
        request_vector: requestVector,
      });
      setSimulationResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request evaluation failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isSingleInstance = selectedPreset
    ? selectedPreset.total.every((t) => t === 1)
    : false;

  return (
    <div className="space-y-4 font-mono">
      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-[#2D1515] border border-[#FF4C4C] rounded-[4px] flex items-center justify-between text-xs text-[#FF8585]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF4C4C] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] text-[#83887E] hover:text-[#E8F5E9] uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Preset Selector & Mode Switch */}
      <DeadlockPresetSelector
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        activeMode={activeMode}
        onChangeMode={handleChangeMode}
      />

      {/* Metrics Row */}
      <DeadlockMetrics metrics={simulationResult?.metrics} />

      {/* Resource Allocation & Vectors Matrix View */}
      <DeadlockMatrixView
        systemState={playback.currentSnapshot?.system_state}
        activeProcessId={
          playback.currentSafetyStep?.evaluated_process ||
          playback.currentDetectionStep?.evaluated_process
        }
        activeMode={activeMode}
      />

      {/* Algorithm Step Progress & Sequence */}
      <BankerSafetyVisualizer
        mode={activeMode}
        isSafe={simulationResult?.is_safe}
        safeSequence={simulationResult?.safe_sequence}
        isDeadlocked={simulationResult?.is_deadlocked}
        deadlockedProcesses={simulationResult?.deadlocked_processes}
        currentSafetyStep={playback.currentSafetyStep}
        currentDetectionStep={playback.currentDetectionStep}
        resourceTypes={selectedPreset?.resource_types || []}
      />

      {/* Resource Request Evaluator (Available under Banker's Avoidance) */}
      {activeMode === 'BANKER_AVOIDANCE' && selectedPreset && (
        <ResourceRequestSimulator
          processes={selectedPreset.processes}
          resourceTypes={selectedPreset.resource_types}
          defaultProcessId={selectedPreset.default_request_process_id}
          defaultRequestVector={selectedPreset.default_request_vector}
          onSubmitRequest={handleSubmitResourceRequest}
          isLoading={isLoading}
          requestResult={playback.currentRequestStep || simulationResult?.request_result}
        />
      )}

      {/* Resource Allocation Graph (RAG) & Wait-For Graph (WFG) */}
      <ResourceAllocationGraphView
        ragSnapshot={simulationResult?.rag_snapshot}
        wfgSnapshot={simulationResult?.wfg_snapshot}
        isSingleInstance={isSingleInstance}
        isDeadlocked={simulationResult?.is_deadlocked}
        deadlockedProcesses={simulationResult?.deadlocked_processes}
      />

      {/* Timeline Playback Controls */}
      <DeadlockTimelineControls
        currentStep={playback.currentStep}
        maxSteps={playback.maxSteps}
        isPlaying={playback.isPlaying}
        speed={playback.speed}
        description={playback.currentSnapshot?.description}
        onTogglePlay={playback.togglePlay}
        onStepForward={playback.stepForward}
        onStepBack={playback.stepBack}
        onReset={playback.reset}
        onSetStep={playback.setStep}
        onSetSpeed={playback.setSpeed}
      />

      {/* Event Stream Log */}
      <DeadlockEventLog
        events={playback.recentEvents}
        currentTick={playback.currentSnapshot?.tick ?? 0}
      />

      {/* Re-simulate Button */}
      {selectedPreset && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => runSimulationForPreset(selectedPreset, activeMode)}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-[#162114] border border-[#39FF6A]/50 text-[#39FF6A] text-xs font-bold rounded hover:bg-[#1f311c] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            RE-RUN {activeMode === 'BANKER_AVOIDANCE' ? 'SAFETY CHECK' : 'DETECTION'}
          </button>
        </div>
      )}
    </div>
  );
};
