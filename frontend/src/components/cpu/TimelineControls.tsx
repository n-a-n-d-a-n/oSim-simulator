import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, FastForward } from 'lucide-react';

interface TimelineControlsProps {
  currentTick: number;
  maxTicks: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onSeekTick: (tick: number) => void;
  onChangeSpeed: (speed: number) => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTick,
  maxTicks,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onReset,
  onSeekTick,
  onChangeSpeed,
}) => {
  const speeds = [0.5, 1, 2, 5];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-md transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-md transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play</span>
            </button>
          )}

          <button
            onClick={onStepForward}
            disabled={currentTick >= maxTicks}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Step Forward (1 tick)"
          >
            <SkipForward className="w-4 h-4" />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Reset to Tick 0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Scrub Slider */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 min-w-16">
            Tick: <span className="font-bold text-slate-100">{currentTick}</span> / {maxTicks}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, maxTicks)}
            value={currentTick}
            onChange={(e) => onSeekTick(parseInt(e.target.value) || 0)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <FastForward className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                speed === s
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
