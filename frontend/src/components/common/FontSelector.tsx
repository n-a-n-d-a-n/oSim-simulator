import React from 'react';
import { FONT_OPTIONS, type FontOption } from '../../utils/fonts';
import { Type, Sparkles } from 'lucide-react';

interface FontSelectorProps {
  activeFont: FontOption;
  onSelectFont: (font: FontOption) => void;
  onOpenDemo: () => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  activeFont,
  onSelectFont,
  onOpenDemo,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Quick Dropdown */}
      <div className="flex items-center gap-1.5 bg-[#12130F] border border-[#2A2A26] px-2 py-1 rounded-[2px] text-xs">
        <Type className="w-3.5 h-3.5 text-[#39FF6A]" />
        <span className="text-[#888888] text-[10px] uppercase font-bold hidden sm:inline">FONT:</span>
        <select
          value={activeFont.id}
          onChange={(e) => {
            const chosen = FONT_OPTIONS.find((f) => f.id === e.target.value);
            if (chosen) onSelectFont(chosen);
          }}
          className="bg-transparent text-[#E8F5E9] text-xs outline-none cursor-pointer pr-1"
          style={{ fontFamily: activeFont.fontFamily }}
          title="Change active system typography font"
        >
          {FONT_OPTIONS.map((font) => (
            <option
              key={font.id}
              value={font.id}
              className="bg-[#12130F] text-[#E8F5E9]"
            >
              {font.name} ({font.category === 'Monospace' ? 'Mono' : 'Sans'})
            </option>
          ))}
        </select>
      </div>

      {/* Demo All Fonts Button */}
      <button
        onClick={onOpenDemo}
        className="flex items-center gap-1.5 bg-[#12130F] hover:bg-[#39FF6A]/10 text-[#39FF6A] border border-[#39FF6A]/60 hover:border-[#39FF6A] px-2.5 py-1 rounded-[2px] text-xs font-bold transition-colors cursor-pointer"
        title="Open interactive side-by-side font showcase & comparison"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden md:inline">DEMO ALL FONTS</span>
        <span className="md:hidden">DEMO</span>
      </button>
    </div>
  );
};
