import React, { useState, useEffect, useCallback } from 'react';
import type {
  VirtualMemoryAlgorithmType,
  InputMode,
  VirtualMemorySimulateResponse,
  VirtualMemoryPresetItem,
} from '../../types/virtualMemory';
import { simulateVirtualMemory } from '../../services/virtualMemoryApi';
import { useVirtualMemoryTimelinePlayback } from '../../hooks/useVirtualMemoryTimelinePlayback';

import { VirtualMemoryPresetSelector } from './VirtualMemoryPresetSelector';
import { VirtualMemoryControls } from './VirtualMemoryControls';
import { ReferenceSequenceInput } from './ReferenceSequenceInput';
import { PageFaultIndicator } from './PageFaultIndicator';
import { AddressTranslationVisualizer } from './AddressTranslationVisualizer';
import { PageTableView } from './PageTableView';
import { PhysicalFrameView } from './PhysicalFrameView';
import { VirtualMemoryMetrics } from './VirtualMemoryMetrics';
import { VirtualMemoryTimelineControls } from './VirtualMemoryTimelineControls';
import { VirtualMemoryEventLog } from './VirtualMemoryEventLog';

import { AlertCircle } from 'lucide-react';

export const VirtualMemoryDashboard: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<VirtualMemoryAlgorithmType>('LRU');
  const [frameCount, setFrameCount] = useState<number>(3);
  const [pageSize, setPageSize] = useState<number>(4096);
  const [virtualPageCount, setVirtualPageCount] = useState<number>(16);
  const [inputMode, setInputMode] = useState<InputMode>('PAGE_REFERENCE');
  const [references, setReferences] = useState<number[]>([
    7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1,
  ]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    'vm-silberschatz-benchmark'
  );

  const [simulationResult, setSimulationResult] =
    useState<VirtualMemorySimulateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playback = useVirtualMemoryTimelinePlayback(simulationResult);

  const handleRunSimulation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await simulateVirtualMemory({
        algorithm,
        frame_count: frameCount,
        page_size: pageSize,
        virtual_page_count: virtualPageCount,
        input_mode: inputMode,
        references,
      });
      setSimulationResult(result);
    } catch (err: any) {
      console.error('Virtual memory simulation failed:', err);
      setErrorMessage(err.message || 'Simulation execution failed.');
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, frameCount, pageSize, virtualPageCount, inputMode, references]);

  // Run initial simulation on component mount
  useEffect(() => {
    handleRunSimulation();
  }, [handleRunSimulation]);

  const handleSelectPreset = (preset: VirtualMemoryPresetItem) => {
    setSelectedPresetId(preset.id);
    setAlgorithm(preset.recommended_algorithm);
    setFrameCount(preset.frame_count);
    setPageSize(preset.page_size);
    setVirtualPageCount(preset.virtual_page_count);
    setInputMode(preset.input_mode);
    setReferences(preset.raw_references);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-[#B8433A]/10 border border-[#B8433A] rounded-[2px] flex items-center justify-between gap-3 text-[#E8F5E9] text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B8433A]" />
            <div>
              <strong className="text-[#B8433A]">SYSTEM ERROR:</strong> {errorMessage}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-[#B8433A] hover:text-[#E8F5E9] cursor-pointer"
          >
            [DISMISS]
          </button>
        </div>
      )}

      {/* Preset Selector */}
      <VirtualMemoryPresetSelector
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
      />

      {/* Upper Grid: Paging Controls & Reference Stream Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <VirtualMemoryControls
            algorithm={algorithm}
            onChangeAlgorithm={(a) => {
              setAlgorithm(a);
              setSelectedPresetId(null);
            }}
            frameCount={frameCount}
            onChangeFrameCount={(fc) => {
              setFrameCount(fc);
              setSelectedPresetId(null);
            }}
            pageSize={pageSize}
            onChangePageSize={(sz) => {
              setPageSize(sz);
              setSelectedPresetId(null);
            }}
            virtualPageCount={virtualPageCount}
            onChangeVirtualPageCount={(pc) => {
              setVirtualPageCount(pc);
              setSelectedPresetId(null);
            }}
            inputMode={inputMode}
            onChangeInputMode={(im) => {
              setInputMode(im);
              setSelectedPresetId(null);
            }}
            onRunSimulation={handleRunSimulation}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-6">
          <ReferenceSequenceInput
            references={references}
            onChangeReferences={(refs) => {
              setReferences(refs);
              setSelectedPresetId(null);
            }}
            inputMode={inputMode}
            virtualPageCount={virtualPageCount}
            pageSize={pageSize}
          />
        </div>
      </div>

      {/* Page Fault / Page Hit Oscilloscope Indicator */}
      <PageFaultIndicator snapshot={playback.currentSnapshot} />

      {/* Middle Grid: Address Translation Pipeline & Physical Frame RAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <AddressTranslationVisualizer
            snapshot={playback.currentSnapshot}
            pageSize={pageSize}
          />
        </div>
        <div className="lg:col-span-6">
          <PhysicalFrameView
            frames={playback.currentSnapshot?.frames || []}
            clockHand={playback.currentSnapshot?.clock_hand}
            activeFrameNumber={playback.currentSnapshot?.frame_number || null}
          />
        </div>
      </div>

      {/* Single-Level Page Table */}
      <PageTableView
        entries={playback.currentSnapshot?.page_table || []}
        activePageNumber={playback.currentSnapshot?.reference.page_number || null}
      />

      {/* Interactive Timeline Playback Controls */}
      <VirtualMemoryTimelineControls
        currentStep={playback.currentStep}
        maxSteps={playback.maxSteps}
        isPlaying={playback.isPlaying}
        speed={playback.speed}
        onTogglePlay={playback.togglePlay}
        onStepForward={playback.stepForward}
        onStepBack={playback.stepBack}
        onReset={playback.reset}
        onSetStep={playback.setStep}
        onSetSpeed={playback.setSpeed}
      />

      {/* Cumulative Metrics & Scrolling Event Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <VirtualMemoryMetrics
            metrics={playback.currentSnapshot?.metrics || simulationResult?.final_metrics}
          />
        </div>
        <div className="lg:col-span-5">
          <VirtualMemoryEventLog
            events={playback.recentEvents}
            currentStep={playback.currentStep}
          />
        </div>
      </div>
    </div>
  );
};
