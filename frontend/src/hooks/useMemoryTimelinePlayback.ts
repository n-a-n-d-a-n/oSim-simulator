/**
 * Playback hook for memory simulation results.
 * Strictly replay-only: reads immutable snapshots from backend response.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  MemorySimulateResponse,
  MemoryStateSnapshot,
  MemoryEvent,
  OperationResultSnapshot,
} from '../types/memory';

export interface MemoryPlaybackController {
  currentTick: number;
  maxTicks: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  setTick: (tick: number) => void;
  setSpeed: (speed: number) => void;
  currentState: MemoryStateSnapshot | null;
  eventsAtCurrentTick: MemoryEvent[];
  recentEvents: MemoryEvent[];
  currentOperationResult: OperationResultSnapshot | null;
}

export function useMemoryTimelinePlayback(
  simulationResult: MemorySimulateResponse | null
): MemoryPlaybackController {
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tick = params.get('tick') ?? params.get('memory_tick');
      if (tick !== null) {
        const parsed = parseInt(tick, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          setCurrentTick(parsed);
          setIsPlaying(false);
          return;
        }
      }
    }
    setCurrentTick(0);
    setIsPlaying(false);
  }, [simulationResult]);

  const maxTicks = useMemo(() => {
    if (!simulationResult || simulationResult.timeline.length === 0) return 0;
    return simulationResult.timeline[simulationResult.timeline.length - 1].tick;
  }, [simulationResult]);

  useEffect(() => {
    if (!isPlaying || !simulationResult) return;

    if (currentTick >= maxTicks) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(100, Math.floor(800 / speed));
    const timer = setInterval(() => {
      setCurrentTick((prev) => {
        if (prev >= maxTicks) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentTick, maxTicks, speed, simulationResult]);

  const play = useCallback(() => {
    if (currentTick >= maxTicks) {
      setCurrentTick(0);
    }
    setIsPlaying(true);
  }, [currentTick, maxTicks]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentTick((prev) => Math.min(prev + 1, maxTicks));
  }, [maxTicks]);

  const stepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentTick((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTick(0);
  }, []);

  const setTick = useCallback(
    (tick: number) => {
      setIsPlaying(false);
      const bounded = Math.max(0, Math.min(tick, maxTicks));
      setCurrentTick(bounded);
    },
    [maxTicks]
  );

  const currentState = useMemo(() => {
    if (!simulationResult || simulationResult.timeline.length === 0) return null;
    const found = simulationResult.timeline.find((s) => s.tick === currentTick);
    if (found) return found;
    // Fallback to nearest previous state
    for (let t = currentTick; t >= 0; t--) {
      const prev = simulationResult.timeline.find((s) => s.tick === t);
      if (prev) return prev;
    }
    return simulationResult.timeline[0];
  }, [simulationResult, currentTick]);

  const eventsAtCurrentTick = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.events.filter((e) => e.tick === currentTick);
  }, [simulationResult, currentTick]);

  const recentEvents = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.events.filter((e) => e.tick <= currentTick);
  }, [simulationResult, currentTick]);

  const currentOperationResult = useMemo(() => {
    if (!currentState) return null;
    return currentState.last_operation_result || null;
  }, [currentState]);

  return {
    currentTick,
    maxTicks,
    isPlaying,
    speed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBack,
    reset,
    setTick,
    setSpeed,
    currentState,
    eventsAtCurrentTick,
    recentEvents,
    currentOperationResult,
  };
}
