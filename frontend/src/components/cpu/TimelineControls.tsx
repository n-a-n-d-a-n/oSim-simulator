import React from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

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
    <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-3 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-1.5">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1 bg-[#0A0A0A] hover:bg-[#161813] text-[#DCDCAA] border border-[#DCDCAA] px-3 py-1.5 rounded-[2px] text-xs font-bold cursor-pointer transition-colors"
            >
              <Pause className="w-3.5 h-3.5 fill-[#DCDCAA]" />
              <span>[❚❚ PAUSE]</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-1 bg-[#0A0A0A] hover:bg-[#161813] text-[#39FF6A] border border-[#39FF6A] px-3 py-1.5 rounded-[2px] text-xs font-bold cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-[#39FF6A]" />
              <span>[▶ RUN]</span>
            </button>
          )}

          <button
            onClick={onStepForward}
            disabled={currentTick >= maxTicks}
            className="flex items-center gap-1 bg-[#0A0A0A] hover:bg-[#161813] disabled:opacity-20 text-[#E8F5E9] border border-[#2A2A26] hover:border-[#888888] px-2.5 py-1.5 rounded-[2px] text-xs cursor-pointer transition-colors"
            title="Step Forward (1 tick)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>[STEP +1]</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 bg-[#0A0A0A] hover:bg-[#161813] text-[#888888] hover:text-[#E8F5E9] border border-[#2A2A26] hover:border-[#888888] px-2.5 py-1.5 rounded-[2px] text-xs cursor-pointer transition-colors"
            title="Reset to Tick 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[RESET]</span>
          </button>
        </div>

        {/* Scrub Slider */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-[#888888] min-w-28 shrink-0">
            TICK: <span className="font-bold text-[#39FF6A]">{currentTick}</span> / {maxTicks}T
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, maxTicks)}
            value={currentTick}
            onChange={(e) => onSeekTick(parseInt(e.target.value, 10) || 0)}
            className="w-full h-1.5 bg-[#0A0A0A] border border-[#2A2A26] appearance-none cursor-pointer accent-[#39FF6A]"
          />
        </div>

        {/* Speed Multiplier Bank */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 border border-[#2A2A26] rounded-[2px]">
          <span className="text-[10px] text-[#888888] px-1">RATE:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 text-[11px] rounded-[2px] cursor-pointer transition-colors ${
                speed === s
                  ? 'bg-[#12130F] border border-[#39FF6A] text-[#39FF6A] font-bold'
                  : 'text-[#888888] hover:text-[#E8F5E9]'
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

