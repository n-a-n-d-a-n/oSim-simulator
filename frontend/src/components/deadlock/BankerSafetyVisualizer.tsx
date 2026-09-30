import React from 'react';
import type { SafetyStep, DetectionStep } from '../../types/deadlock';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface Props {
  mode: 'BANKER_AVOIDANCE' | 'DEADLOCK_DETECTION';
  isSafe?: boolean | null;
  safeSequence?: string[] | null;
  isDeadlocked?: boolean | null;
  deadlockedProcesses?: string[] | null;
  currentSafetyStep?: SafetyStep | null;
  currentDetectionStep?: DetectionStep | null;
  resourceTypes: string[];
}

export const BankerSafetyVisualizer: React.FC<Props> = ({
  mode,
  isSafe,
  safeSequence,
  isDeadlocked,
  deadlockedProcesses,
  currentSafetyStep,
  currentDetectionStep,
  resourceTypes,
}) => {
  const isBanker = mode === 'BANKER_AVOIDANCE';

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      {/* Header and Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262922] pb-3">
        <div className="flex items-center gap-2">
          {isBanker ? (
            <ShieldCheck className="w-4 h-4 text-[#39FF6A]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-[#E89E39]" />
          )}
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            {isBanker ? "BANKER'S SAFETY ALGORITHM EXECUTION" : 'MATRIX REDUCTION DETECTION'}
          </span>
        </div>

        {/* Status Badge */}
        {isBanker ? (
          isSafe !== undefined && isSafe !== null ? (
            <div
              className={`px-3 py-1 rounded-[3px] text-xs font-bold flex items-center gap-1.5 ${
                isSafe
                  ? 'bg-[#183416] text-[#39FF6A] border border-[#39FF6A]/50'
                  : 'bg-[#3b1717] text-[#FF4C4C] border border-[#FF4C4C]/50'
              }`}
            >
              {isSafe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {isSafe ? 'STATE: SAFE' : 'STATE: UNSAFE'}
            </div>
          ) : null
        ) : isDeadlocked !== undefined && isDeadlocked !== null ? (
          <div
            className={`px-3 py-1 rounded-[3px] text-xs font-bold flex items-center gap-1.5 ${
              isDeadlocked
                ? 'bg-[#3b1717] text-[#FF4C4C] border border-[#FF4C4C]/50'
                : 'bg-[#183416] text-[#39FF6A] border border-[#39FF6A]/50'
            }`}
          >
            {isDeadlocked ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {isDeadlocked ? 'DEADLOCK DETECTED' : 'NO DEADLOCK'}
          </div>
        ) : null}
      </div>

      {/* Main Execution Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Work Vector Progress */}
        <div className="p-3 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#83887E]">
            <span className="text-[#E8F5E9]">WORK VECTOR TRACKER</span>
            <span>
              {isBanker
                ? currentSafetyStep
                  ? `Step ${currentSafetyStep.step_index}`
                  : 'Ready'
                : currentDetectionStep
                ? `Step ${currentDetectionStep.step_index}`
                : 'Ready'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-[#161814] border border-[#262922] rounded">
              <div className="text-[10px] text-[#83887E] font-bold">WORK (BEFORE)</div>
              <div className="text-xs text-[#E8F5E9] font-mono mt-1">
                [
                {(isBanker ? currentSafetyStep?.work_before : currentDetectionStep?.work_before)
                  ?.map((val, i) => `${resourceTypes[i] || i}:${val}`)
                  .join(', ') || 'N/A'}
                ]
              </div>
            </div>
            <div className="p-2 bg-[#161814] border border-[#262922] rounded">
              <div className="text-[10px] text-[#83887E] font-bold">WORK (AFTER)</div>
              <div className="text-xs text-[#39FF6A] font-mono mt-1">
                [
                {(isBanker ? currentSafetyStep?.work_after : currentDetectionStep?.work_after)
                  ?.map((val, i) => `${resourceTypes[i] || i}:${val}`)
                  .join(', ') || 'N/A'}
                ]
              </div>
            </div>
          </div>

          {/* Current Evaluation Details */}
          <div className="p-2 bg-[#141A12] border border-[#262922] rounded text-[11px] text-[#A4AAA0] leading-relaxed">
            {isBanker
              ? currentSafetyStep?.description ||
                'Start or advance timeline playback to trace Banker safety sequence.'
              : currentDetectionStep?.description ||
                'Start or advance timeline playback to trace multi-instance matrix reduction.'}
          </div>
        </div>

        {/* Finish Array & Safe Sequence / Deadlocked Set */}
        <div className="p-3 bg-[#0E100C] border border-[#262922] rounded-[3px] space-y-3">
          {/* Finish Vector Flags */}
          <div>
            <div className="text-[11px] font-bold text-[#83887E] mb-1.5 flex items-center justify-between">
              <span className="text-[#E8F5E9]">FINISH ARRAY FLAGS</span>
              <span className="text-[9px]">
                {isBanker ? 'Finish[i] == True' : 'Reduced == True'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(isBanker
                ? currentSafetyStep?.finish_vector
                : currentDetectionStep?.finish_vector
              )?.map((finished, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1 border rounded text-[10px] font-bold ${
                    finished
                      ? 'bg-[#183416] border-[#39FF6A]/60 text-[#39FF6A]'
                      : 'bg-[#221714] border-[#FF4C4C]/40 text-[#FF4C4C]'
                  }`}
                >
                  P{idx}: {finished ? 'TRUE' : 'FALSE'}
                </div>
              )) || <span className="text-[10px] text-[#83887E]">Not started</span>}
            </div>
          </div>

          {/* Sequence / Deadlock Results */}
          {isBanker ? (
            <div>
              <div className="text-[11px] font-bold text-[#83887E] mb-1">
                <span className="text-[#39FF6A]">SAFE SEQUENCE PROGRESSION</span>
              </div>
              <div className="p-2 bg-[#161814] border border-[#262922] rounded flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-[#E8F5E9]">
                {safeSequence && safeSequence.length > 0 ? (
                  safeSequence.map((proc, idx) => (
                    <React.Fragment key={proc}>
                      <span className="px-2 py-0.5 bg-[#1C2C18] border border-[#39FF6A]/40 text-[#39FF6A] rounded">
                        {proc}
                      </span>
                      {idx < safeSequence.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-[#83887E]" />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-[10px] text-[#83887E]">No safe sequence discovered</span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-bold text-[#83887E] mb-1">
                <span className="text-[#FF4C4C]">DEADLOCKED PROCESS SET</span>
              </div>
              <div className="p-2 bg-[#161814] border border-[#262922] rounded flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                {deadlockedProcesses && deadlockedProcesses.length > 0 ? (
                  deadlockedProcesses.map((proc) => (
                    <span
                      key={proc}
                      className="px-2 py-0.5 bg-[#3b1717] border border-[#FF4C4C]/50 text-[#FF4C4C] rounded"
                    >
                      {proc}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#39FF6A]">
                    Empty set: All processes reduced cleanly
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
