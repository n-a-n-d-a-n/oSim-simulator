import React, { useState, useEffect } from 'react';
import type {
  MemoryAlgorithmType,
  MemoryOperationInput as MemOpInput,
  MemorySimulateResponse,
  MemoryPresetItem,
} from '../../types/memory';
import { simulateMemory } from '../../services/memoryApi';
import { useMemoryTimelinePlayback } from '../../hooks/useMemoryTimelinePlayback';

import { MemoryControls } from './MemoryControls';
import { MemoryPresetSelector } from './MemoryPresetSelector';
import { MemoryOperationInput } from './MemoryOperationInput';
import { MemoryMap } from './MemoryMap';
import { MemoryMetrics } from './MemoryMetrics';
import { AllocationResult } from './AllocationResult';
import { MemoryEventLog } from './MemoryEventLog';
import { MemoryTimelineControls } from './MemoryTimelineControls';
import { AlertCircle } from 'lucide-react';

export const MemoryDashboard: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<MemoryAlgorithmType>('FIRST_FIT');
  const [memorySize, setMemorySize] = useState<number>(1000);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('preset-a-basic');

  const [operations, setOperations] = useState<MemOpInput[]>([
    { tick: 0, operation_type: 'ALLOCATE', request_id: 'P1', size: 200 },
    { tick: 1, operation_type: 'ALLOCATE', request_id: 'P2', size: 300 },
    { tick: 2, operation_type: 'ALLOCATE', request_id: 'P3', size: 150 },
    { tick: 3, operation_type: 'ALLOCATE', request_id: 'P4', size: 250 },
  ]);

  const [simulationResult, setSimulationResult] = useState<MemorySimulateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playback = useMemoryTimelinePlayback(simulationResult);

  const handleRunSimulation = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await simulateMemory({
        algorithm,
        memory_size: memorySize,
        operations,
      });
      setSimulationResult(result);
    } catch (err: any) {
      console.error('Memory simulation error:', err);
      setErrorMessage(err.message || 'Simulation failed to complete.');
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, memorySize, operations]);

  useEffect(() => {
    handleRunSimulation();
  }, [handleRunSimulation]);

  const handleSelectPreset = (preset: MemoryPresetItem) => {
    setSelectedPresetId(preset.id);
    setAlgorithm(preset.recommended_algorithm);
    setMemorySize(preset.memory_size);
    setOperations(preset.operations);
  };

  const handleReset = () => {
    playback.reset();
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="flex-1">
            <strong>Simulation Request Error:</strong> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-400 hover:text-rose-200 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Preset Selector */}
      <MemoryPresetSelector
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
      />

      {/* Controls & Operation Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <MemoryControls
            algorithm={algorithm}
            setAlgorithm={setAlgorithm}
            memorySize={memorySize}
            setMemorySize={setMemorySize}
            onRunSimulation={handleRunSimulation}
            onReset={handleReset}
            isLoading={isLoading}
          />

          <AllocationResult
            result={playback.currentOperationResult}
            metrics={playback.currentState?.metrics}
          />
        </div>

        <div className="lg:col-span-7">
          <MemoryOperationInput
            operations={operations}
            setOperations={setOperations}
          />
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <MemoryTimelineControls playback={playback} />

      {/* Memory Map Display */}
      {playback.currentState && (
        <MemoryMap
          blocks={playback.currentState.blocks}
          totalMemory={playback.currentState.total_memory}
          nextFitCursor={playback.currentState.next_fit_cursor}
          algorithmName={simulationResult?.algorithm_name}
        />
      )}

      {/* Metrics Cards */}
      {playback.currentState && (
        <MemoryMetrics metrics={playback.currentState.metrics} />
      )}

      {/* Event Stream */}
      <MemoryEventLog
        events={playback.recentEvents}
        currentTick={playback.currentTick}
      />
    </div>
  );
};
