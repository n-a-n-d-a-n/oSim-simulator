/**
 * Playback hook for virtual memory simulation results.
 * Strictly replay-only: reads immutable snapshots from backend response.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  VirtualMemorySimulateResponse,
  VirtualMemorySnapshot,
  VirtualMemoryEvent,
  ReplacementDecision,
} from '../types/virtualMemory';

export interface VirtualMemoryPlaybackController {
  currentStep: number;
  maxSteps: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  setStep: (step: number) => void;
  setSpeed: (speed: number) => void;
  currentSnapshot: VirtualMemorySnapshot | null;
  eventsAtCurrentStep: VirtualMemoryEvent[];
  recentEvents: VirtualMemoryEvent[];
  currentReplacementDecision: ReplacementDecision | null;
}

export function useVirtualMemoryTimelinePlayback(
  simulationResult: VirtualMemorySimulateResponse | null
): VirtualMemoryPlaybackController {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Reset to initial step when simulation result changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [simulationResult]);

  const maxSteps = useMemo(() => {
    if (!simulationResult || simulationResult.timeline.length === 0) return 0;
    return simulationResult.timeline.length - 1;
  }, [simulationResult]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, maxSteps));
  }, [maxSteps]);

  const stepBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const setStep = useCallback(
    (step: number) => {
      const clamped = Math.max(0, Math.min(step, maxSteps));
      setCurrentStep(clamped);
    },
    [maxSteps]
  );

  // Animation playback interval timer
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= maxSteps) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(100, Math.round(1000 / speed));
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, maxSteps, speed]);

  const currentSnapshot = useMemo(() => {
    if (!simulationResult || simulationResult.timeline.length === 0) return null;
    return simulationResult.timeline[currentStep] ?? null;
  }, [simulationResult, currentStep]);

  const eventsAtCurrentStep = useMemo(() => {
    if (!simulationResult || !currentSnapshot) return [];
    const stepIdx = currentSnapshot.step_index;
    return simulationResult.events.filter((e) => e.tick === stepIdx);
  }, [simulationResult, currentSnapshot]);

  const recentEvents = useMemo(() => {
    if (!simulationResult || !currentSnapshot) return [];
    const stepIdx = currentSnapshot.step_index;
    return simulationResult.events.filter((e) => e.tick <= stepIdx);
  }, [simulationResult, currentSnapshot]);

  const currentReplacementDecision = useMemo(() => {
    return currentSnapshot?.replacement_decision ?? null;
  }, [currentSnapshot]);

  return {
    currentStep,
    maxSteps,
    isPlaying,
    speed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBack,
    reset,
    setStep,
    setSpeed,
    currentSnapshot,
    eventsAtCurrentStep,
    recentEvents,
    currentReplacementDecision,
  };
}
