/**
 * Deterministic visual palette mapping for process IDs and system states.
 * Strictly adheres to the 6 console tokens:
 * - #39FF6A (Running / Phosphor Green)
 * - #DCDCAA (Ready / Amber)
 * - #CE9178 (Terminated / Rust)
 * - #FF6B35 (Warning / Context-Switch)
 * - #B8433A (Punch-Hole Crimson)
 * - #888888 (Muted Text / Labels)
 */

export interface ColorBadge {
  hex: string;
  bg: string;
  border: string;
  text: string;
}

// Deterministic cyclic assignments using exclusively the 6 console tokens & opacity variants
const PROCESS_COLORS: ColorBadge[] = [
  { hex: '#39FF6A', bg: 'bg-[#39FF6A]/10', border: 'border-[#39FF6A]', text: 'text-[#39FF6A]' },
  { hex: '#DCDCAA', bg: 'bg-[#DCDCAA]/10', border: 'border-[#DCDCAA]', text: 'text-[#DCDCAA]' },
  { hex: '#CE9178', bg: 'bg-[#CE9178]/10', border: 'border-[#CE9178]', text: 'text-[#CE9178]' },
  { hex: '#FF6B35', bg: 'bg-[#FF6B35]/10', border: 'border-[#FF6B35]', text: 'text-[#FF6B35]' },
  { hex: '#B8433A', bg: 'bg-[#B8433A]/15', border: 'border-[#B8433A]', text: 'text-[#B8433A]' },
  { hex: '#39FF6A', bg: 'bg-[#39FF6A]/5', border: 'border-[#39FF6A]/60', text: 'text-[#39FF6A]/90' },
  { hex: '#DCDCAA', bg: 'bg-[#DCDCAA]/5', border: 'border-[#DCDCAA]/60', text: 'text-[#DCDCAA]/90' },
  { hex: '#CE9178', bg: 'bg-[#CE9178]/5', border: 'border-[#CE9178]/60', text: 'text-[#CE9178]/90' },
  { hex: '#FF6B35', bg: 'bg-[#FF6B35]/5', border: 'border-[#FF6B35]/60', text: 'text-[#FF6B35]/90' },
  { hex: '#B8433A', bg: 'bg-[#B8433A]/5', border: 'border-[#B8433A]/60', text: 'text-[#B8433A]/90' },
];

export function getProcessColor(pid: string): ColorBadge {
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = (hash << 5) - hash + pid.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PROCESS_COLORS.length;
  return PROCESS_COLORS[index];
}

export function getStateBadgeColor(state: string): { bg: string; text: string; border: string; hex: string } {
  switch (state) {
    case 'RUNNING':
      return { hex: '#39FF6A', bg: 'bg-[#39FF6A]/10', text: 'text-[#39FF6A]', border: 'border-[#39FF6A]' };
    case 'READY':
      return { hex: '#DCDCAA', bg: 'bg-[#DCDCAA]/10', text: 'text-[#DCDCAA]', border: 'border-[#DCDCAA]' };
    case 'WAITING':
      return { hex: '#FF6B35', bg: 'bg-[#FF6B35]/10', text: 'text-[#FF6B35]', border: 'border-[#FF6B35]' };
    case 'TERMINATED':
      return { hex: '#CE9178', bg: 'bg-[#CE9178]/10', text: 'text-[#CE9178]', border: 'border-[#CE9178]' };
    case 'NEW':
      return { hex: '#888888', bg: 'bg-[#888888]/10', text: 'text-[#888888]', border: 'border-[#888888]' };
    default:
      return { hex: '#888888', bg: 'bg-[#888888]/10', text: 'text-[#888888]', border: 'border-[#888888]' };
  }
}
