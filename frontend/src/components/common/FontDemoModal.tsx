import React, { useEffect } from 'react';
import { FONT_OPTIONS, type FontOption } from '../../utils/fonts';
import { X, Check, Eye, Type, Sparkles } from 'lucide-react';

interface FontDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFont: FontOption;
  onSelectFont: (font: FontOption) => void;
  onPreviewFont: (font: FontOption) => void;
}

export const FontDemoModal: React.FC<FontDemoModalProps> = ({
  isOpen,
  onClose,
  activeFont,
  onSelectFont,
  onPreviewFont,
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#12130F] border border-[#39FF6A]/40 rounded-[4px] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-[#39FF6A]/10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A26] bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#12130F] border border-[#39FF6A] flex items-center justify-center text-[#39FF6A]">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#E8F5E9] tracking-wider uppercase">
                  SYSTEM TYPOGRAPHY SHOWCASE // FONT DEMO &amp; SELECTION
                </h2>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#12130F] border border-[#39FF6A] text-[#39FF6A]">
                  7 CANDIDATE FONTS
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                Click <span className="text-[#39FF6A]">"Live Preview"</span> to transform the entire OS console behind this window, or click <span className="text-[#DCDCAA]">"Select Font"</span> to lock it in.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#E8F5E9] p-1.5 rounded-[2px] hover:bg-[#2A2A26] transition-colors cursor-pointer"
            title="Close showcase"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FONT_OPTIONS.map((font) => {
              const isCurrent = activeFont.id === font.id;
              return (
                <div
                  key={font.id}
                  style={{ fontFamily: font.fontFamily }}
                  className={`p-4 rounded-[4px] border transition-all ${
                    isCurrent
                      ? 'bg-[#161813] border-[#39FF6A] shadow-lg shadow-[#39FF6A]/10'
                      : 'bg-[#0A0A0A] border-[#2A2A26] hover:border-[#888888]/60'
                  }`}
                >
                  {/* Card Title & Tags */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#E8F5E9] tracking-wide">
                          {font.name}
                        </h3>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#12130F] border border-[#2A2A26] text-[#DCDCAA]">
                          {font.category}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#39FF6A]/20 border border-[#39FF6A] text-[#39FF6A] flex items-center gap-1 font-bold">
                            <Check className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#39FF6A]/90 mt-0.5">
                        {font.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#888888] mb-3 leading-relaxed">
                    {font.description}
                  </p>

                  {/* Character & Numeric Sample */}
                  <div className="bg-[#12130F] border border-[#2A2A26] rounded-[2px] p-2.5 mb-2.5 space-y-1">
                    <div className="text-[11px] text-[#888888] font-bold">GLYPHS &amp; DIGITS:</div>
                    <div className="text-xs tracking-wider text-[#E8F5E9]">
                      0 1 2 3 4 5 6 7 8 9 &bull; + - * / = [ ] { } &lt; &gt;
                    </div>
                    <div className="text-xs tracking-wide text-[#E8F5E9] uppercase">
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ
                    </div>
                  </div>

                  {/* Console Event Trace Demo */}
                  <div className="bg-[#050505] border border-[#2A2A26] rounded-[2px] p-2.5 mb-3 text-xs space-y-1">
                    <div className="text-[10px] text-[#888888] font-bold">TERMINAL SAMPLE:</div>
                    <div className="text-[#39FF6A] truncate">
                      &gt; [T=02] [MEMORY_ALLOCATED] Process &apos;P1&apos; at [0x000, 0x1F4)
                    </div>
                    <div className="text-[#DCDCAA] text-[11px] flex items-center justify-between">
                      <span>CPU LOAD: 94.2%</span>
                      <span>WAIT: 3.25ms</span>
                      <span>QUANTUM: 4T</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onPreviewFont(font)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#12130F] hover:bg-[#1A1C16] text-[#E8F5E9] border border-[#2A2A26] hover:border-[#39FF6A] px-2.5 py-1.5 rounded-[2px] text-xs transition-colors cursor-pointer"
                      title="Preview this font across the entire screen right now"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#39FF6A]" />
                      <span>Live Preview</span>
                    </button>

                    <button
                      onClick={() => onSelectFont(font)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#39FF6A] text-[#0A0A0A] border border-[#39FF6A]'
                          : 'bg-[#12130F] hover:bg-[#39FF6A]/20 text-[#39FF6A] border border-[#39FF6A]'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply to System</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#2A2A26] bg-[#0A0A0A] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[#888888]">
            Current Active System Font:{' '}
            <span className="text-[#39FF6A] font-bold" style={{ fontFamily: activeFont.fontFamily }}>
              {activeFont.name} ({activeFont.category})
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#12130F] hover:bg-[#1A1C16] text-[#E8F5E9] border border-[#2A2A26] px-4 py-1.5 rounded-[2px] font-bold transition-colors cursor-pointer"
          >
            Done / Close Showcase [ESC]
          </button>
        </div>

      </div>
    </div>
  );
};
