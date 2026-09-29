import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
} from 'lucide-react';

interface Props {
  currentStep: number;
  maxSteps: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSetStep: (step: number) => void;
  onSetSpeed: (speed: number) => void;
}

export const VirtualMemoryTimelineControls: React.FC<Props> = ({
  currentStep,
  maxSteps,
  isPlaying,
  speed,
  onTogglePlay,
  onStepForward,
  onStepBack,
  onReset,
  onSetStep,
  onSetSpeed,
}) => {
  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="p-3 bg-[#11130E] border border-[#262922] rounded-[4px] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
      {/* Step Indicator & Transport Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          title="Reset to Step 0"
          className="p-1.5 rounded-[3px] bg-[#0E100C] border border-[#262922] text-[#83887E] hover:text-[#E8F5E9] hover:border-[#383D33] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onStepBack}
          disabled={currentStep <= 0}
          title="Step Backward"
          className="p-1.5 rounded-[3px] bg-[#0E100C] border border-[#262922] text-[#83887E] hover:text-[#E8F5E9] hover:border-[#383D33] cursor-pointer disabled:opacity-40"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          className={`px-3 py-1.5 rounded-[3px] font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
            isPlaying
              ? 'bg-[#181C14] text-[#DCDCAA] border-[#DCDCAA]'
              : 'bg-[#181C14] text-[#39FF6A] border-[#39FF6A] shadow-[0_0_8px_rgba(57,255,106,0.2)]'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onStepForward}
          disabled={currentStep >= maxSteps}
          title="Step Forward"
          className="p-1.5 rounded-[3px] bg-[#0E100C] border border-[#262922] text-[#83887E] hover:text-[#E8F5E9] hover:border-[#383D33] cursor-pointer disabled:opacity-40"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-bold text-[#E8F5E9] ml-2">
          STEP {maxSteps > 0 ? currentStep + 1 : 0} / {maxSteps > 0 ? maxSteps + 1 : 0}
        </span>
      </div>

      {/* Scrubber slider */}
      <div className="flex-1 max-w-md w-full px-2">
        <input
          type="range"
          min={0}
          max={Math.max(0, maxSteps)}
          value={currentStep}
          onChange={(e) => onSetStep(parseInt(e.target.value, 10))}
          className="w-full accent-[#39FF6A] cursor-pointer bg-[#262922] h-1.5 rounded-lg"
        />
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[#83887E] mr-1">SPEED:</span>
        {speeds.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSetSpeed(s)}
            className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border cursor-pointer ${
              speed === s
                ? 'bg-[#181C14] text-[#39FF6A] border-[#39FF6A]'
                : 'bg-[#0E100C] text-[#83887E] border-[#262922] hover:text-[#E8F5E9]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
