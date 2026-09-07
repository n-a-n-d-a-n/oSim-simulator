import React from 'react';
import type { GanttSegment } from '../../types/cpu';
import { getProcessColor } from '../../utils/palette';
import { BarChart3 } from 'lucide-react';

interface GanttChartProps {
  segments: GanttSegment[];
  totalTime: number;
  currentTick: number;
  onSeekTick: (tick: number) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  segments,
  totalTime,
  currentTick,
  onSeekTick,
}) => {
  if (totalTime <= 0 || segments.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
        Run simulation to view Gantt timeline.
      </div>
    );
  }

  const cursorPercent = Math.min(100, Math.max(0, (currentTick / totalTime) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">
            CPU Execution Gantt Chart
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/80 inline-block" />
            <span className="text-slate-400">Context Switch (CS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" />
            <span className="text-slate-400">CPU Idle</span>
          </div>
          <div className="text-slate-400 font-mono">
            Total: <span className="text-slate-200 font-semibold">{totalTime}</span> ticks
          </div>
        </div>
      </div>

      {/* Interactive Gantt Bar Container */}
      <div className="relative pt-2 pb-6 select-none">
        {/* Playback Cursor Line */}
        <div
          className="absolute top-0 bottom-6 w-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-100 flex flex-col items-center"
          style={{ left: `${cursorPercent}%` }}
        >
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full -mt-1 shadow-md shadow-rose-500/50" />
          <div className="bg-rose-600 text-white font-mono text-[9px] px-1 rounded absolute -top-5 shadow">
            t={currentTick}
          </div>
        </div>

        {/* Segments Flex Bar */}
        <div
          className="h-12 w-full flex rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 relative cursor-pointer shadow-inner"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const targetRatio = Math.max(0, Math.min(1, clickX / rect.width));
            const targetTick = Math.round(targetRatio * totalTime);
            onSeekTick(targetTick);
          }}
        >
          {segments.map((seg, idx) => {
            const widthPercent = (seg.duration / totalTime) * 100;
            const isCursorInside = currentTick >= seg.start_time && currentTick < seg.end_time;

            if (seg.is_idle) {
              return (
                <div
                  key={idx}
                  style={{ width: `${widthPercent}%` }}
                  className={`h-full flex items-center justify-center border-r border-slate-800 bg-slate-900/60 text-slate-500 text-[11px] font-mono transition-opacity ${
                    isCursorInside ? 'ring-2 ring-rose-400/80 z-20' : ''
                  }`}
                  title={`IDLE [${seg.start_time} - ${seg.end_time}]`}
                >
                  <span className="truncate px-1">IDLE ({seg.duration})</span>
                </div>
              );
            }

            if (seg.is_context_switch) {
              return (
                <div
                  key={idx}
                  style={{ width: `${widthPercent}%` }}
                  className={`h-full flex items-center justify-center border-r border-amber-500/50 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-semibold transition-opacity ${
                    isCursorInside ? 'ring-2 ring-rose-400/80 z-20' : ''
                  }`}
                  title={`Context Switch [${seg.start_time} - ${seg.end_time}]`}
                >
                  <span className="truncate px-0.5">CS ({seg.duration})</span>
                </div>
              );
            }

            const color = seg.pid ? getProcessColor(seg.pid) : null;
            return (
              <div
                key={idx}
                style={{ width: `${widthPercent}%` }}
                className={`h-full flex flex-col items-center justify-center border-r border-slate-800 ${
                  color ? color.bg : 'bg-indigo-500/20'
                } ${
                  color ? color.text : 'text-indigo-200'
                } transition-all relative overflow-hidden group ${
                  isCursorInside ? 'ring-2 ring-rose-400/80 z-20 brightness-125' : ''
                }`}
                title={`${seg.pid} [${seg.start_time} - ${seg.end_time}] (${seg.duration} ticks)`}
              >
                <span className="font-bold text-xs tracking-wider">{seg.pid}</span>
                <span className="text-[9px] opacity-75 font-mono">{seg.duration}t</span>
              </div>
            );
          })}
        </div>

        {/* Timeline Axis Ticks */}
        <div className="relative w-full h-4 text-[10px] font-mono text-slate-500 mt-1">
          {segments.map((seg, idx) => {
            const leftPercent = (seg.start_time / totalTime) * 100;
            return (
              <span
                key={idx}
                className="absolute -translate-x-1/2"
                style={{ left: `${leftPercent}%` }}
              >
                {seg.start_time}
              </span>
            );
          })}
          <span className="absolute right-0 translate-x-1/2">{totalTime}</span>
        </div>
      </div>
    </div>
  );
};
