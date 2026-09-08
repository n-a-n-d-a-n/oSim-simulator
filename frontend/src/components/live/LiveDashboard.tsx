import React, { useState, useEffect } from 'react';
import type { SystemSnapshot, LiveStatus } from '../../types/live';
import { fetchLiveStatus, fetchLiveSnapshot } from '../../services/liveApi';
import { Activity, ShieldCheck, RefreshCw, Cpu, HardDrive, AlertCircle } from 'lucide-react';

export const LiveDashboard: React.FC = () => {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial one-shot load of status and initial baseline snapshot
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setIsLoading(true);
      setError(null);
      try {
        const liveStat = await fetchLiveStatus();
        if (isMounted) setStatus(liveStat);

        const snap = await fetchLiveSnapshot();
        if (isMounted) setSnapshot(snap);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to connect to Live Observation subsystem.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Explicit user-triggered one-shot capture (NO background polling or timer loop)
  const handleCaptureSnapshot = async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const snap = await fetchLiveSnapshot();
      setSnapshot(snap);
    } catch (err: any) {
      setError(err.message || 'Failed to capture real host snapshot.');
    } finally {
      setIsCapturing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(2)} GB`;
    }
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${bytes} B`;
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Header Banner */}
      <div className="retro-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#39FF6A]" />
            <h2 className="text-sm sm:text-base font-bold text-[#E8F5E9] tracking-wider uppercase glow-text-green">
              OSIM // LIVE SYSTEM OBSERVATION [FOUNDATION]
            </h2>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#161912] border border-[#383D33] text-[#39FF6A] font-bold">
              READ-ONLY
            </span>
          </div>
          <p className="text-xs text-[#83887E] mt-1">
            Non-invasive point-in-time telemetry observed directly from host operating system.
          </p>
        </div>

        {/* Status & Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#0A0C08] border border-[#262922] px-2.5 py-1 rounded-[3px] text-xs">
            <span className={`w-2 h-2 rounded-full ${status?.available ? 'bg-[#39FF6A] animate-pulse shadow-[0_0_6px_#39FF6A]' : 'bg-[#B8433A]'}`} />
            <span className="text-[#83887E]">STATUS:</span>
            <span className={`font-bold ${status?.available ? 'text-[#39FF6A]' : 'text-[#B8433A]'}`}>
              {status ? (status.available ? 'ONLINE' : 'OFFLINE') : 'CONNECTING...'}
            </span>
            {status?.platform && (
              <span className="text-[10px] text-[#83887E] uppercase border-l border-[#262922] pl-1.5">
                {status.platform}
              </span>
            )}
          </div>

          <button
            onClick={handleCaptureSnapshot}
            disabled={isCapturing || isLoading}
            className="flex items-center gap-1.5 bg-[#122214] hover:bg-[#182F1C] active:scale-95 disabled:opacity-40 text-[#39FF6A] border border-[#39FF6A] px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all shadow-[0_0_12px_rgba(57,255,106,0.2)] cursor-pointer"
            title="Execute on-demand snapshot capture"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
            <span>{isCapturing ? 'CAPTURING...' : '[CAPTURE SNAPSHOT]'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-[#B8433A]/10 border border-[#B8433A] rounded-[3px] p-3 flex items-center gap-3 text-xs text-[#E8F5E9]">
          <AlertCircle className="w-4 h-4 text-[#B8433A] shrink-0" />
          <div>
            <span className="font-bold text-[#B8433A]">OBSERVATION ERROR: </span>
            {error}
          </div>
        </div>
      )}

      {/* KPI Cards: REAL Telemetry */}
      {snapshot && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CPU KPI */}
          <div className="retro-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#83887E] mb-2">
              <span className="uppercase font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#39FF6A]" /> REAL CPU UTILIZATION
              </span>
              <span className="text-[10px] text-[#39FF6A] border border-[#39FF6A]/30 px-1 rounded-[2px]">
                {snapshot.cpu.logical_cpu_count} CORES
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#39FF6A] tracking-tight glow-text-green">
                {snapshot.cpu.total_cpu_percent.toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#83887E] mt-1">
                HOST TOTAL SAMPLED ACROSS ALL LOGICAL CORES
              </div>
            </div>
          </div>

          {/* Memory KPI */}
          <div className="retro-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#83887E] mb-2">
              <span className="uppercase font-semibold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#DCDCAA]" /> REAL MEMORY USAGE
              </span>
              <span className="text-[10px] text-[#DCDCAA] border border-[#DCDCAA]/30 px-1 rounded-[2px]">
                {formatBytes(snapshot.memory.total_bytes)}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#DCDCAA] tracking-tight glow-text-amber">
                {snapshot.memory.percent_used.toFixed(1)}%
              </div>
              <div className="text-[11px] text-[#83887E] mt-1">
                USED: {formatBytes(snapshot.memory.used_bytes)} &bull; AVAIL: {formatBytes(snapshot.memory.available_bytes)}
              </div>
            </div>
          </div>

          {/* Processes KPI */}
          <div className="retro-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#83887E] mb-2">
              <span className="uppercase font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#4EC9B0]" /> OBSERVED PROCESSES
              </span>
              <span className="text-[10px] text-[#4EC9B0] border border-[#4EC9B0]/30 px-1 rounded-[2px]">
                PID COUNT
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#4EC9B0] tracking-tight">
                {snapshot.process_count}
              </div>
              <div className="text-[11px] text-[#83887E] mt-1 truncate">
                SNAPSHOT ID: {snapshot.snapshot_id}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Process Table (First 15 observed processes) */}
      {snapshot && snapshot.processes.length > 0 && (
        <div className="retro-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#262922] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#39FF6A] font-bold">&gt;&gt;</span>
              <h3 className="font-bold text-[#E8F5E9] tracking-wider uppercase">
                OBSERVED_PROCESS_TABLE [FIRST 15 ENUMERATED]
              </h3>
            </div>
            <span className="text-[11px] text-[#83887E]">
              TOTAL OBSERVED: <span className="text-[#E8F5E9] font-bold">{snapshot.process_count}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#262922] text-[#83887E] text-[10px] uppercase">
                  <th className="py-1.5 px-2">PID</th>
                  <th className="py-1.5 px-2">PROCESS NAME</th>
                  <th className="py-1.5 px-2">STATUS</th>
                  <th className="py-1.5 px-2 text-right">CPU %</th>
                  <th className="py-1.5 px-2 text-right">MEMORY (RSS)</th>
                  <th className="py-1.5 px-2 text-right">THREADS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1C16]">
                {snapshot.processes.slice(0, 15).map((p) => (
                  <tr key={p.pid} className="hover:bg-[#161912] transition-colors">
                    <td className="py-1.5 px-2 text-[#39FF6A] font-bold">{p.pid}</td>
                    <td className="py-1.5 px-2 text-[#E8F5E9] truncate max-w-xs">{p.name}</td>
                    <td className="py-1.5 px-2 text-[#DCDCAA] text-[11px] uppercase">{p.status}</td>
                    <td className="py-1.5 px-2 text-right text-[#E8F5E9]">{p.cpu_percent.toFixed(1)}%</td>
                    <td className="py-1.5 px-2 text-right text-[#83887E]">{formatBytes(p.memory_bytes)}</td>
                    <td className="py-1.5 px-2 text-right text-[#83887E]">{p.thread_count ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety & Semantic Boundary Note */}
      <div className="bg-[#0A0C08] border border-[#262922] rounded-[4px] p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#39FF6A] font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>SECURITY &amp; ARCHITECTURAL BOUNDARY GUARANTEES</span>
        </div>
        <p className="text-[#83887E] leading-relaxed">
          <strong className="text-[#E8F5E9]">READ-ONLY:</strong> OSim will never terminate, suspend, alter priority, or modify CPU affinity for any process on your system. Telemetry is inspected locally and is never uploaded externally.
        </p>
        <p className="text-[#83887E] leading-relaxed">
          <strong className="text-[#E8F5E9]">REAL vs ESTIMATED vs SIMULATED:</strong> The values shown above are <span className="text-[#39FF6A]">REAL</span> observations directly gathered from your OS. They are intentionally kept decoupled from OSim&apos;s discrete <span className="text-[#DCDCAA]">SIMULATED</span> engine (`sim_engine`).
        </p>
      </div>
    </div>
  );
};
