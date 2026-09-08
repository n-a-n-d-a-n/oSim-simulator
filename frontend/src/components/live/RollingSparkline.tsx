import React from 'react';

interface RollingSparklineProps {
  /** Array of values from oldest (index 0) to newest (index length - 1) */
  values: number[];
  color: string;
  max?: number;
  height?: number;
  label: string;
  unit?: string;
  currentValue?: number;
}

export const RollingSparkline: React.FC<RollingSparklineProps> = ({
  values,
  color,
  max = 100,
  height = 54,
  label,
  unit = '%',
  currentValue,
}) => {
  const width = 240;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  // Discrete points calculation: newest observation at the right edge (x = width)
  const currentVal = currentValue !== undefined ? currentValue : (values.length > 0 ? values[values.length - 1] : 0);

  // Build SVG path
  let pathD = '';
  let areaD = '';

  if (values.length > 1) {
    const stepX = width / Math.max(values.length - 1, 1);
    const coords = values.map((val, idx) => {
      const clamped = Math.max(0, Math.min(val, max));
      const x = idx * stepX;
      const y = height - paddingY - (clamped / max) * usableHeight;
      return { x, y };
    });

    pathD = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Area fill under curve
    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const bottomY = height - paddingY;
    areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  } else if (values.length === 1) {
    const clamped = Math.max(0, Math.min(values[0], max));
    const y = height - paddingY - (clamped / max) * usableHeight;
    pathD = `M 0 ${y} L ${width} ${y}`;
  }

  // Rightmost point position for current indicator dot
  const clampedCurrent = Math.max(0, Math.min(currentVal, max));
  const currentY = height - paddingY - (clampedCurrent / max) * usableHeight;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-[#83887E]">
        <span className="uppercase font-semibold tracking-wider">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {currentVal.toFixed(1)}
          {unit}
        </span>
      </div>

      <div className="relative border border-[#262922] bg-[#0A0C08] rounded-[2px] p-1 overflow-hidden">
        {/* Retro Oscilloscope Background Grid */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          style={{ maxHeight: `${height}px` }}
        >
          <defs>
            <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines at 25%, 50%, 75% */}
          <line
            x1="0"
            y1={paddingY + usableHeight * 0.25}
            x2={width}
            y2={paddingY + usableHeight * 0.25}
            stroke="#1A1D15"
            strokeDasharray="2 3"
            strokeWidth="0.75"
          />
          <line
            x1="0"
            y1={paddingY + usableHeight * 0.5}
            x2={width}
            y2={paddingY + usableHeight * 0.5}
            stroke="#1E2319"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={paddingY + usableHeight * 0.75}
            x2={width}
            y2={paddingY + usableHeight * 0.75}
            stroke="#1A1D15"
            strokeDasharray="2 3"
            strokeWidth="0.75"
          />

          {/* Area Fill */}
          {areaD && <path d={areaD} fill={`url(#grad-${label.replace(/\s+/g, '')})`} />}

          {/* Stepped Observation Trace (Discrete observations, newest at right edge) */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current Observation Indicator Dot on Right Edge */}
          {values.length > 0 && (
            <circle
              cx={width}
              cy={currentY}
              r="2.5"
              fill={color}
              className="animate-pulse"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          )}
        </svg>

        <div className="flex justify-between items-center text-[9px] text-[#555A4F] px-0.5 mt-0.5 font-mono">
          <span>-60s</span>
          <span>DISCRETE TELEMETRY TRACE</span>
          <span>NOW</span>
        </div>
      </div>
    </div>
  );
};
