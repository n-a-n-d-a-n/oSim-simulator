/**
 * Hook to manage local timeline playback of a pre-computed simulation result.
 * Strictly replay-only: does not run any scheduling or metrics calculations in JavaScript.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CPUSimulateResponse, SystemState, SimulationEvent, GanttSegment } from '../types/cpu';

export interface TimelinePlaybackController {
  currentTick: number;
  maxTicks: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  reset: () => void;
  setTick: (tick: number) => void;
  setSpeed: (speed: number) => void;
  currentState: SystemState | null;
  currentGanttSegment: GanttSegment | null;
  eventsAtCurrentTick: SimulationEvent[];
  recentEvents: SimulationEvent[];
}

export function useTimelinePlayback(simulationResult: CPUSimulateResponse | null): TimelinePlaybackController {
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    setCurrentTick(0);
    setIsPlaying(false);
  }, [simulationResult]);

  const maxTicks = useMemo(() => {
    if (!simulationResult || simulationResult.timeline.length === 0) return 0;
    return simulationResult.timeline[simulationResult.timeline.length - 1].clock;
  }, [simulationResult]);

  useEffect(() => {
    if (!isPlaying || !simulationResult) return;

    if (currentTick >= maxTicks) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(80, Math.floor(700 / speed));
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

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTick(0);
  }, []);

  const setTick = useCallback((tick: number) => {
    setIsPlaying(false);
    const bounded = Math.max(0, Math.min(tick, maxTicks));
    setCurrentTick(bounded);
  }, [maxTicks]);

  const currentState = useMemo(() => {
    if (!simulationResult || simulationResult.timeline.length === 0) return null;
    if (currentTick < simulationResult.timeline.length) {
      return simulationResult.timeline[currentTick];
    }
    return simulationResult.timeline[simulationResult.timeline.length - 1];
  }, [simulationResult, currentTick]);

  const currentGanttSegment = useMemo(() => {
    if (!simulationResult) return null;
    return (
      simulationResult.gantt_segments.find(
        (seg) => currentTick >= seg.start_time && currentTick < seg.end_time
      ) || null
    );
  }, [simulationResult, currentTick]);

  const eventsAtCurrentTick = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.events.filter((e) => e.tick === currentTick);
  }, [simulationResult, currentTick]);

  const recentEvents = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.events.filter((e) => e.tick <= currentTick);
  }, [simulationResult, currentTick]);

  return {
    currentTick,
    maxTicks,
    isPlaying,
    speed,
    play,
    pause,
    togglePlay,
    stepForward,
    reset,
    setTick,
    setSpeed,
    currentState,
    currentGanttSegment,
    eventsAtCurrentTick,
    recentEvents,
  };
}
