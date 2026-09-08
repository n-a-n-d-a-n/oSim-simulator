import React, { useRef } from 'react';
import type { GanttSegment } from '../../types/cpu';

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
  const containerRef = useRef<HTMLDivElement>(null);

  if (totalTime <= 0 || segments.length === 0) {
    return (
      <div className="bg-[#12130F] border border-[#2A2A26] rounded-[4px] p-6 text-center text-[#888888] text-xs font-mono">
        NO SIGNAL // RUN SIMULATION TO ENGAGE OSCILLOSCOPE
      </div>
    );
  }

  const svgWidth = 1000;
  const svgHeight = 140;
  const paddingX = 20;
  const plotWidth = svgWidth - paddingX * 2;
  const baselineY = 110;
  const activeY = 38;

  // Build the continuous oscilloscope step-line path
  let pathD = '';
  let lastY = baselineY;

  // We also track context-switch markers and process labels
  const csMarkers: { x: number; duration: number; start: number }[] = [];
  const processLabels: { x: number; pid: string; start: number; end: number }[] = [];

  segments.forEach((seg, idx) => {
    const startX = paddingX + (seg.start_time / totalTime) * plotWidth;
    const endX = paddingX + (seg.end_time / totalTime) * plotWidth;

    let targetY = baselineY;
    if (seg.is_context_switch) {
      targetY = baselineY;
      csMarkers.push({ x: (startX + endX) / 2, duration: seg.duration, start: seg.start_time });
    } else if (!seg.is_idle && seg.pid) {
      // Deterministic Y level offset per PID for multi-process distinct voltage levels
      const pidNum = parseInt(seg.pid.replace(/\D/g, ''), 10) || 1;
      const levelOffset = ((pidNum - 1) % 4) * 12;
      targetY = activeY + levelOffset;
      processLabels.push({ x: (startX + endX) / 2, pid: seg.pid, start: seg.start_time, end: seg.end_time });
    }

    if (idx === 0) {
      pathD += `M ${startX.toFixed(1)} ${targetY.toFixed(1)}`;
    } else {
      // Step: vertical edge from lastY to targetY, then horizontal to endX
      pathD += ` L ${startX.toFixed(1)} ${targetY.toFixed(1)}`;
    }
    pathD += ` L ${endX.toFixed(1)} ${targetY.toFixed(1)}`;
    lastY = targetY;
  });

  // Current scanline cursor X position
  const cursorX = paddingX + (Math.min(currentTick, totalTime) / totalTime) * plotWidth;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTick = Math.round(clickRatio * totalTime);
    onSeekTick(targetTick);
  };

  return (
    <div className="retro-panel p-4 select-none">
      {/* Instrument Header / Channel Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-[#262922] pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#39FF6A] inline-block animate-pulse shadow-[0_0_8px_#39FF6A]" />
          <span className="font-bold text-[#E8F5E9] tracking-wider uppercase">
            OSCILLOSCOPE // CH1: CPU_EXEC_SIGNAL
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#83887E] text-[11px]">
          <div>
            TRACE: <span className="text-[#39FF6A] font-semibold">ACTIVE EXECUTION</span>
          </div>
          <div>
            MARKER: <span className="text-[#FF6B35] font-semibold">CS OVERHEAD</span>
          </div>
          <div>
            SPAN: <span className="text-[#E8F5E9] font-bold">{totalTime}</span> TICKS
          </div>
        </div>
      </div>

      {/* CRT Display Frame */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative bg-[#060705] border border-[#262922] rounded-[3px] p-1 cursor-crosshair overflow-hidden shadow-inner"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-36 block"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="reticleGrid" width="40" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="40" y2="0" stroke="#181C14" strokeWidth="1" />
              <line x1="0" y1="0" x2="0" y2="20" stroke="#181C14" strokeWidth="1" />
            </pattern>
            {/* Subtle phosphor trail glow under signal */}
            <linearGradient id="traceFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39FF6A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#39FF6A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* CRT Reticle Grid */}
          <rect x={paddingX} y="8" width={plotWidth} height={svgHeight - 16} fill="url(#reticleGrid)" />

          {/* Horizontal Reference Voltages / States */}
          <line
            x1={paddingX}
            y1={activeY}
            x2={svgWidth - paddingX}
            y2={activeY}
            stroke="#262922"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={baselineY}
            x2={svgWidth - paddingX}
            y2={baselineY}
            stroke="#262922"
            strokeWidth="1"
          />

          {/* Y-Axis Labels */}
          <text x={paddingX - 4} y={activeY + 3} textAnchor="end" fill="#83887E" fontSize="8" fontFamily="monospace" fontWeight="bold">
            BUSY
          </text>
          <text x={paddingX - 4} y={baselineY + 3} textAnchor="end" fill="#83887E" fontSize="8" fontFamily="monospace">
            IDLE
          </text>

          {/* Context-Switch Overhead Markers */}
          {csMarkers.map((cs, idx) => (
            <g key={`cs-${idx}`}>
              <line
                x1={cs.x}
                y1={12}
                x2={cs.x}
                y2={baselineY + 8}
                stroke="#FF6B35"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <rect x={cs.x - 12} y={10} width="24" height="12" fill="#12130F" stroke="#FF6B35" strokeWidth="1" rx="1" />
              <text
                x={cs.x}
                y={19}
                textAnchor="middle"
                fill="#FF6B35"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                CS
              </text>
            </g>
          ))}

          {/* Stepped Phosphor Green Oscilloscope Trace */}
          <path
            d={`${pathD} L ${paddingX + plotWidth} ${baselineY} L ${paddingX} ${baselineY} Z`}
            fill="url(#traceFade)"
          />

          {/* Sharp phosphor step trace with dual glow filter */}
          <path
            d={pathD}
            fill="none"
            stroke="#39FF6A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 3px #39FF6A) drop-shadow(0 0 10px rgba(57,255,106,0.5))' }}
          />

          {/* Process Labels on the Waveform Pulses */}
          {processLabels.map((pl, idx) => (
            <g key={`pl-${idx}`}>
              <text
                x={pl.x}
                y={24}
                textAnchor="middle"
                fill="#39FF6A"
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="bold"
                style={{ filter: 'drop-shadow(0 0 2px #39FF6A)' }}
              >
                {pl.pid}
              </text>
            </g>
          ))}

          {/* Live Scanline / Sweep Cursor at currentTick */}
          <line
            x1={cursorX}
            y1={8}
            x2={cursorX}
            y2={svgHeight - 10}
            stroke="#39FF6A"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 6px #39FF6A)' }}
          />
          {/* Reticle pip at trace height */}
          <circle cx={cursorX} cy={lastY} r="3.5" fill="#39FF6A" stroke="#080907" strokeWidth="1.5" />

          {/* Top cursor readout badge */}
          <g transform={`translate(${Math.max(paddingX, Math.min(cursorX - 25, svgWidth - paddingX - 50))}, 2)`}>
            <rect width="50" height="13" fill="#11130E" stroke="#39FF6A" strokeWidth="1" rx="2" />
            <text x="25" y="9.5" textAnchor="middle" fill="#39FF6A" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
              T={currentTick}
            </text>
          </g>
        </svg>

        {/* Scanline Sweep Animation Indicator */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none transition-all duration-75"
          style={{
            left: `${((Math.min(currentTick, totalTime) / totalTime) * 100).toFixed(2)}%`,
          }}
        >
          <div className="w-[1px] h-full bg-[#39FF6A] opacity-40" />
        </div>
      </div>

      {/* Axis Scale and Diagnostic Readings */}
      <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-[#888888]">
        <div>
          SCALE: <span className="text-[#E8F5E9]">1 TICK/DIV</span>
        </div>
        <div className="flex items-center gap-3">
          <span>0T</span>
          <span>&larr; TIMELINE SPAN &rarr;</span>
          <span>{totalTime}T</span>
        </div>
        <div>
          SCAN_POS: <span className="text-[#39FF6A]">t={currentTick}</span>
        </div>
      </div>
    </div>
  );
};

