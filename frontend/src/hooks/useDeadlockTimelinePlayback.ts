/**
 * Playback hook for Deadlock Detection & Banker's Algorithm simulation results.
 * Strictly replay-only: reads immutable snapshots from backend response.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  DeadlockSimulationResponse,
  DeadlockTimelineSnapshot,
  DeadlockEvent,
  SafetyStep,
  DetectionStep,
  RequestEvaluation,
} from '../types/deadlock';

export interface DeadlockPlaybackController {
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
  currentSnapshot: DeadlockTimelineSnapshot | null;
  eventsAtCurrentStep: DeadlockEvent[];
  recentEvents: DeadlockEvent[];
  currentSafetyStep: SafetyStep | null;
  currentDetectionStep: DetectionStep | null;
  currentRequestStep: RequestEvaluation | null;
}

export function useDeadlockTimelinePlayback(
  simulationResult: DeadlockSimulationResponse | null
): DeadlockPlaybackController {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Reset when a new simulation result arrives
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

  // Animation interval timer
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= maxSteps) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(150, Math.round(1000 / speed));
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
    const tick = currentSnapshot.tick;
    return simulationResult.events.filter((e) => e.tick === tick);
  }, [simulationResult, currentSnapshot]);

  const recentEvents = useMemo(() => {
    if (!simulationResult || !currentSnapshot) return [];
    const tick = currentSnapshot.tick;
    return simulationResult.events.filter((e) => e.tick <= tick);
  }, [simulationResult, currentSnapshot]);

  const currentSafetyStep = useMemo(() => {
    return currentSnapshot?.safety_step ?? null;
  }, [currentSnapshot]);

  const currentDetectionStep = useMemo(() => {
    return currentSnapshot?.detection_step ?? null;
  }, [currentSnapshot]);

  const currentRequestStep = useMemo(() => {
    return currentSnapshot?.request_step ?? null;
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
    currentSafetyStep,
    currentDetectionStep,
    currentRequestStep,
  };
}
