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
    <div className="retro-panel p-3 font-mono shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 bg-[#1C180E] hover:bg-[#282214] text-[#DCDCAA] border border-[#DCDCAA] px-3.5 py-1.5 rounded-[3px] text-xs font-bold cursor-pointer transition-all shadow-[0_0_10px_rgba(220,220,170,0.2)] active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 fill-[#DCDCAA]" />
              <span>[❚❚ PAUSE]</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-1.5 bg-[#122214] hover:bg-[#172D1B] text-[#39FF6A] border border-[#39FF6A] px-3.5 py-1.5 rounded-[3px] text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(57,255,106,0.25)] active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-[#39FF6A]" />
              <span>[▶ RUN]</span>
            </button>
          )}

          <button
            onClick={onStepForward}
            disabled={currentTick >= maxTicks}
            className="flex items-center gap-1.5 bg-[#11130E] hover:bg-[#181C14] disabled:opacity-20 text-[#E8F5E9] border border-[#262922] hover:border-[#83887E] px-3 py-1.5 rounded-[3px] text-xs font-semibold cursor-pointer transition-colors active:scale-95"
            title="Step Forward (1 tick)"
          >
            <SkipForward className="w-3.5 h-3.5 text-[#39FF6A]" />
            <span>[STEP +1]</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 bg-[#11130E] hover:bg-[#181C14] text-[#83887E] hover:text-[#E8F5E9] border border-[#262922] hover:border-[#83887E] px-2.5 py-1.5 rounded-[3px] text-xs cursor-pointer transition-colors active:scale-95"
            title="Reset to Tick 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[RESET]</span>
          </button>
        </div>

        {/* Scrub Slider with Live Status */}
        <div className="flex-1 flex items-center gap-3 px-2">
          <span className="text-xs text-[#83887E] min-w-28 shrink-0">
            TICK: <span className="font-bold text-[#39FF6A] glow-text-green">{currentTick}</span> / {maxTicks}T
          </span>
          <div className="relative w-full flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(1, maxTicks)}
              value={currentTick}
              onChange={(e) => onSeekTick(parseInt(e.target.value, 10) || 0)}
              className="w-full h-1.5 bg-[#060705] border border-[#262922] rounded-full appearance-none cursor-pointer accent-[#39FF6A]"
            />
          </div>
        </div>

        {/* Speed Multiplier Bank */}
        <div className="flex items-center gap-1 bg-[#0A0C08] p-1 border border-[#262922] rounded-[3px]">
          <span className="text-[10px] text-[#83887E] px-1 font-bold">RATE:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 text-[11px] rounded-[2px] cursor-pointer transition-all ${
                speed === s
                  ? 'bg-[#181C14] border border-[#39FF6A] text-[#39FF6A] font-bold shadow-[0_0_8px_rgba(57,255,106,0.3)]'
                  : 'text-[#83887E] hover:text-[#E8F5E9]'
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

