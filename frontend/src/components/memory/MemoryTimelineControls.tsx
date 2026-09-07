import React from 'react';
import type { MemoryPlaybackController } from '../../hooks/useMemoryTimelinePlayback';
import { Play, Pause, StepForward, StepBack, RotateCcw, FastForward } from 'lucide-react';

interface MemoryTimelineControlsProps {
  playback: MemoryPlaybackController;
}

export const MemoryTimelineControls: React.FC<MemoryTimelineControlsProps> = ({ playback }) => {
  const {
    currentTick,
    maxTicks,
    isPlaying,
    speed,
    togglePlay,
    stepForward,
    stepBack,
    reset,
    setTick,
    setSpeed,
  } = playback;

  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Reset to Tick 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={stepBack}
            disabled={currentTick <= 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Step Back (1 Tick)"
          >
            <StepBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg shadow-md shadow-cyan-500/20 transition-all text-xs cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={stepForward}
            disabled={currentTick >= maxTicks}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Step Forward (1 Tick)"
          >
            <StepForward className="w-4 h-4" />
          </button>
        </div>

        {/* Current Tick Display */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs">
          <span className="text-slate-400">Simulation Tick:</span>
          <span className="text-cyan-300 font-bold text-sm">
            {currentTick}
          </span>
          <span className="text-slate-500">/ {maxTicks}</span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-lg">
          <FastForward className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {speeds.map((s) => (
            <button
              key={`speed-${s}`}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                speed === s
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Scrubber Range Slider */}
      <div className="space-y-1 pt-1">
        <input
          type="range"
          min={0}
          max={maxTicks || 0}
          value={currentTick}
          onChange={(e) => setTick(parseInt(e.target.value) || 0)}
          className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span>Start: Tick 0</span>
          <span>
            {maxTicks > 0 ? `${Math.round((currentTick / maxTicks) * 100)}% Complete` : '0%'}
          </span>
          <span>End: Tick {maxTicks}</span>
        </div>
      </div>
    </div>
  );
};
