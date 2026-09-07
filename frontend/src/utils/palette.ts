/**
 * Deterministic visual palette mapping for process IDs and system states.
 * Keeps core domain models free of presentation-specific styling.
 */

export interface ColorBadge {
  bg: string;
  border: string;
  text: string;
  glow: string;
}

const PROCESS_COLORS: ColorBadge[] = [
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/60', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/60', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500/60', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/60', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/60', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/60', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/60', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500/60', text: 'text-teal-400', glow: 'shadow-teal-500/20' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/60', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/60', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
];

export function getProcessColor(pid: string): ColorBadge {
  // Simple deterministic hash based on PID characters
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = (hash << 5) - hash + pid.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PROCESS_COLORS.length;
  return PROCESS_COLORS[index];
}

export function getStateBadgeColor(state: string): { bg: string; text: string; border: string } {
  switch (state) {
    case 'RUNNING':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' };
    case 'READY':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/50' };
    case 'WAITING':
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50' };
    case 'TERMINATED':
      return { bg: 'bg-slate-700/50', text: 'text-slate-400', border: 'border-slate-600/50' };
    case 'NEW':
      return { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/50' };
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
  }
}
