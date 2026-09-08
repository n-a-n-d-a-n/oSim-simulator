export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  category: 'Monospace' | 'Sans-Serif';
  tagline: string;
  description: string;
  previewPrompt: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    fontFamily: "'IBM Plex Mono', monospace",
    category: 'Monospace',
    tagline: 'Classic IBM Engineering & Mainframe Terminal',
    description: 'Crisp, industrial-grade monospace with engineered proportions and exceptional clarity.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: "'Fira Code', monospace",
    category: 'Monospace',
    tagline: 'Modern Programmer Monospace',
    description: 'Sharp technical letterforms, distinct punctuation, and dotted zero glyphs.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    fontFamily: "'Space Mono', monospace",
    category: 'Monospace',
    tagline: 'Geometric Retro-Futuristic Console',
    description: 'High-contrast, quirky geometric letterforms reminiscent of 1960s/70s space consoles.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
  {
    id: 'share-tech-mono',
    name: 'Share Tech Mono',
    fontFamily: "'Share Tech Mono', monospace",
    category: 'Monospace',
    tagline: 'Vintage Sci-Fi CRT Interface',
    description: 'Authentic cyberpunk HUD terminal aesthetic with narrow condensed tracking.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
  {
    id: 'vt323',
    name: 'VT323',
    fontFamily: "'VT323', monospace",
    category: 'Monospace',
    tagline: '1982 DEC VT220 Dot-Matrix Terminal',
    description: 'Authentic 80s glowing phosphor dot-matrix pixel font from early UNIX terminals.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: "'JetBrains Mono', monospace",
    category: 'Monospace',
    tagline: 'Default Modern Developer Monospace',
    description: 'Tall lowercase height, distinct punctuation, and maximum readability for dense code.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    category: 'Sans-Serif',
    tagline: 'Ultra-Clean Modern UI Typography',
    description: 'Ultra-clean modern interface typography for high-density dashboards.',
    previewPrompt: '> [T=02] [MEMORY_ALLOCATED] Process \'P1\' at [0x000, 0x1F4) -> 250 units',
  },
];

const STORAGE_KEY = 'osim_selected_font';

export function getInitialFont(): FontOption {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = FONT_OPTIONS.find((f) => f.id === saved);
      if (found) return found;
    }
  }
  // Default to JetBrains Mono
  return FONT_OPTIONS.find((f) => f.id === 'jetbrains-mono') || FONT_OPTIONS[0];
}

export function applyFontToSystem(font: FontOption): void {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--font-system', font.fontFamily);
    document.body.style.fontFamily = font.fontFamily;
    localStorage.setItem(STORAGE_KEY, font.id);
  }
}
