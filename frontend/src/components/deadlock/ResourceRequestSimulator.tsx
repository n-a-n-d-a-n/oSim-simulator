import React, { useState, useEffect } from 'react';
import type { RequestEvaluation } from '../../types/deadlock';
import { Send, RotateCcw, AlertTriangle, CheckCircle, Clock, XOctagon } from 'lucide-react';

interface Props {
  processes: string[];
  resourceTypes: string[];
  defaultProcessId?: string | null;
  defaultRequestVector?: number[] | null;
  onSubmitRequest: (processId: string, requestVector: number[]) => void;
  isLoading: boolean;
  requestResult?: RequestEvaluation | null;
}

export const ResourceRequestSimulator: React.FC<Props> = ({
  processes,
  resourceTypes,
  defaultProcessId,
  defaultRequestVector,
  onSubmitRequest,
  isLoading,
  requestResult,
}) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>(
    defaultProcessId || processes[0] || 'P0'
  );
  const [vectorValues, setVectorValues] = useState<number[]>(
    defaultRequestVector || resourceTypes.map(() => 0)
  );

  useEffect(() => {
    if (defaultProcessId) {
      setSelectedProcessId(defaultProcessId);
    } else if (processes.length > 0 && !processes.includes(selectedProcessId)) {
      setSelectedProcessId(processes[0]);
    }
  }, [defaultProcessId, processes, selectedProcessId]);

  useEffect(() => {
    if (defaultRequestVector && defaultRequestVector.length === resourceTypes.length) {
      setVectorValues(defaultRequestVector);
    } else {
      setVectorValues(resourceTypes.map(() => 0));
    }
  }, [defaultRequestVector, resourceTypes]);

  const handleVectorChange = (index: number, valStr: string) => {
    const val = parseInt(valStr, 10);
    const updated = [...vectorValues];
    updated[index] = isNaN(val) ? 0 : Math.max(0, val);
    setVectorValues(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRequest(selectedProcessId, vectorValues);
  };

  const handleReset = () => {
    if (defaultRequestVector && defaultRequestVector.length === resourceTypes.length) {
      setVectorValues(defaultRequestVector);
    } else {
      setVectorValues(resourceTypes.map(() => 0));
    }
    if (defaultProcessId) {
      setSelectedProcessId(defaultProcessId);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'GRANTED':
        return (
          <div className="px-3 py-1 bg-[#183416] border border-[#39FF6A] text-[#39FF6A] text-xs font-bold rounded flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            OUTCOME: GRANTED
          </div>
        );
      case 'WAITING':
        return (
          <div className="px-3 py-1 bg-[#3a2c16] border border-[#E89E39] text-[#E89E39] text-xs font-bold rounded flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            OUTCOME: WAITING (INSUFFICIENT AVAILABLE)
          </div>
        );
      case 'DENIED':
        return (
          <div className="px-3 py-1 bg-[#3b1717] border border-[#FF4C4C] text-[#FF4C4C] text-xs font-bold rounded flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            OUTCOME: DENIED (UNSAFE TENTATIVE STATE)
          </div>
        );
      case 'ERROR':
      default:
        return (
          <div className="px-3 py-1 bg-[#3b1717] border border-[#FF4C4C] text-[#FF4C4C] text-xs font-bold rounded flex items-center gap-1.5">
            <XOctagon className="w-3.5 h-3.5" />
            OUTCOME: CLAIM EXCEEDED / ERROR
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#262922] pb-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            RESOURCE REQUEST EVALUATOR (BANKER'S AVOIDANCE)
          </span>
        </div>
        <span className="text-[10px] text-[#83887E]">TENTATIVE SAFETY TEST</span>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Process Selector */}
          <div className="flex items-center gap-2 bg-[#0E100C] p-2 border border-[#262922] rounded-[3px]">
            <label htmlFor="proc-select" className="text-xs text-[#83887E] font-bold">
              REQUESTING PID:
            </label>
            <select
              id="proc-select"
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="bg-[#161814] text-[#E8F5E9] text-xs border border-[#262922] rounded px-2 py-1 font-bold outline-none"
            >
              {processes.map((proc) => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Request Vector inputs */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto bg-[#0E100C] p-2 border border-[#262922] rounded-[3px]">
            <span className="text-xs text-[#83887E] font-bold whitespace-nowrap">REQUEST VECTOR:</span>
            {resourceTypes.map((res, idx) => (
              <div key={res} className="flex items-center gap-1">
                <span className="text-[11px] text-[#83887E] font-bold">{res}:</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={vectorValues[idx] ?? 0}
                  onChange={(e) => handleVectorChange(idx, e.target.value)}
                  className="w-12 bg-[#161814] text-[#39FF6A] text-xs border border-[#262922] rounded px-1.5 py-1 text-center font-bold outline-none"
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-3.5 py-2 bg-[#39FF6A] text-[#0A0D08] font-bold text-xs rounded hover:bg-[#32e05d] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading ? 'EVALUATING...' : 'SUBMIT REQUEST'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 bg-[#0E100C] text-[#83887E] hover:text-[#E8F5E9] border border-[#262922] rounded transition-colors"
              title="Reset Vector"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Request Result Display */}
      {requestResult && (
        <div className="p-3 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262922] pb-2">
            <span className="text-xs font-bold text-[#E8F5E9]">
              DECISION FOR {requestResult.process_id} REQUEST [
              {requestResult.request_vector.join(', ')}]
            </span>
            {getDecisionBadge(requestResult.decision)}
          </div>
          <div className="text-xs text-[#A4AAA0] leading-relaxed">{requestResult.reason}</div>
          {requestResult.safe_sequence && requestResult.safe_sequence.length > 0 && (
            <div className="text-[11px] text-[#39FF6A] flex items-center gap-1.5">
              <span>Tentative Safe Sequence:</span>
              <span className="font-bold">{requestResult.safe_sequence.join(' -> ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
