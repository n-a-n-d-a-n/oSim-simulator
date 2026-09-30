import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock } from 'lucide-react';

interface Props {
  currentStep: number;
  maxSteps: number;
  isPlaying: boolean;
  speed: number;
  description?: string;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSetStep: (step: number) => void;
  onSetSpeed: (speed: number) => void;
}

export const DeadlockTimelineControls: React.FC<Props> = ({
  currentStep,
  maxSteps,
  isPlaying,
  speed,
  description,
  onTogglePlay,
  onStepForward,
  onStepBack,
  onReset,
  onSetStep,
  onSetSpeed,
}) => {
  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      {/* Upper Bar: Title & Step Counter */}
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            SIMULATION TIMELINE CONTROLLER
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-[#83887E]">TICK:</span>
          <span className="text-[#39FF6A]">
            {currentStep} / {maxSteps}
          </span>
        </div>
      </div>

      {/* Center Description Banner */}
      <div className="p-2.5 bg-[#0E100C] border border-[#262922] rounded-[3px] text-xs text-[#A4AAA0] flex items-center justify-between">
        <span className="truncate">{description || 'Initial simulation state.'}</span>
      </div>

      {/* Lower Bar: Controls & Scrubber */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5 bg-[#0E100C] p-1 border border-[#262922] rounded-[3px]">
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 text-[#83887E] hover:text-[#E8F5E9] transition-colors"
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onStepBack}
            disabled={currentStep <= 0}
            className="p-1.5 text-[#83887E] hover:text-[#E8F5E9] disabled:opacity-30 transition-colors"
            title="Step Back"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-3 py-1 bg-[#39FF6A] text-[#0A0D08] font-bold rounded-[2px] hover:bg-[#32e05d] transition-colors flex items-center gap-1"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
          <button
            type="button"
            onClick={onStepForward}
            disabled={currentStep >= maxSteps}
            className="p-1.5 text-[#83887E] hover:text-[#E8F5E9] disabled:opacity-30 transition-colors"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 w-full flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={maxSteps || 0}
            value={currentStep}
            onChange={(e) => onSetStep(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#262922] rounded-lg appearance-none cursor-pointer accent-[#39FF6A]"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#0E100C] p-1 border border-[#262922] rounded-[3px] text-[11px]">
          <span className="text-[#83887E] px-1 font-bold">SPEED:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSetSpeed(s)}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                speed === s
                  ? 'bg-[#39FF6A] text-[#0A0D08]'
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
