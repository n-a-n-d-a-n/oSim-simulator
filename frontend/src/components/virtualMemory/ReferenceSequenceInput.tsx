import React, { useState, useEffect } from 'react';
import type { InputMode } from '../../types/virtualMemory';
import { Edit3, Shuffle } from 'lucide-react';

interface Props {
  references: number[];
  onChangeReferences: (refs: number[]) => void;
  inputMode: InputMode;
  virtualPageCount: number;
  pageSize: number;
}

export const ReferenceSequenceInput: React.FC<Props> = ({
  references,
  onChangeReferences,
  inputMode,
  virtualPageCount,
  pageSize,
}) => {
  const [textValue, setTextValue] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (inputMode === 'VIRTUAL_ADDRESS') {
      setTextValue(references.map((r) => `0x${r.toString(16).toUpperCase()}`).join(', '));
    } else {
      setTextValue(references.join(', '));
    }
  }, [references, inputMode]);

  const handleApply = (rawText: string) => {
    setInputError(null);
    const tokens = rawText
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const parsed: number[] = [];
    const maxAddress = pageSize * virtualPageCount;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      let val: number;
      if (tok.startsWith('0x') || tok.startsWith('0X')) {
        val = parseInt(tok, 16);
      } else {
        val = parseInt(tok, 10);
      }

      if (isNaN(val) || val < 0) {
        setInputError(`Invalid token "${tok}" at index ${i}`);
        return;
      }

      if (inputMode === 'PAGE_REFERENCE') {
        if (val >= virtualPageCount) {
          setInputError(
            `Page ${val} exceeds virtual page limit [0, ${virtualPageCount - 1}]`
          );
          return;
        }
      } else {
        if (val >= maxAddress) {
          setInputError(
            `Address ${val} exceeds address space bound [0, ${maxAddress - 1}]`
          );
          return;
        }
      }

      parsed.push(val);
    }

    if (parsed.length === 0) {
      setInputError('Reference sequence cannot be empty');
      return;
    }

    onChangeReferences(parsed);
  };

  const handleRandomize = () => {
    const len = 15;
    const randomRefs: number[] = [];

    for (let i = 0; i < len; i++) {
      if (inputMode === 'PAGE_REFERENCE') {
        randomRefs.push(Math.floor(Math.random() * Math.min(8, virtualPageCount)));
      } else {
        const randPage = Math.floor(Math.random() * Math.min(8, virtualPageCount));
        const randOffset = Math.floor(Math.random() * pageSize);
        randomRefs.push(randPage * pageSize + randOffset);
      }
    }
    onChangeReferences(randomRefs);
  };

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#4EC9B0]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            REFERENCE STREAM INPUT ({inputMode === 'PAGE_REFERENCE' ? 'PAGES' : 'BYTE ADDR'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-[2px] bg-[#161912] border border-[#262922] text-[#DCDCAA] hover:text-[#E8F5E9] hover:border-[#383D33] cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            <span>RANDOMIZE</span>
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <textarea
          rows={2}
          value={textValue}
          onChange={(e) => {
            setTextValue(e.target.value);
            handleApply(e.target.value);
          }}
          placeholder={
            inputMode === 'PAGE_REFERENCE'
              ? 'e.g. 7, 0, 1, 2, 0, 3, 0, 4...'
              : 'e.g. 0x0000, 0x1000, 0x1388, 0x2000...'
          }
          className="w-full bg-[#080907] border border-[#262922] rounded-[3px] p-2 text-xs text-[#39FF6A] font-mono tracking-wider focus:border-[#4EC9B0] outline-none"
        />
        {inputError && (
          <div className="text-[11px] text-[#B8433A] font-bold">
            ⚠ {inputError}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#83887E]">
        <span>TOTAL REFERENCES: {references.length}</span>
        <span className="truncate max-w-[300px]">
          [COMMA OR SPACE SEPARATED STREAM]
        </span>
      </div>
    </div>
  );
};
