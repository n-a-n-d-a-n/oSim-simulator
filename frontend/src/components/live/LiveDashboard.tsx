import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  SystemSnapshot,
  LiveStatus,
  AutoRefreshMode,
  TelemetryHistoryPoint,
  ProcessObservation,
} from '../../types/live';
import { fetchLiveStatus, fetchLiveSnapshot } from '../../services/liveApi';
import { RollingSparkline } from './RollingSparkline';
import { CoreLoadMatrix } from './CoreLoadMatrix';
import {
  Activity,
  ShieldCheck,
  RefreshCw,
  Cpu,
  HardDrive,
  AlertCircle,
  Search,
  ArrowUpDown,
  Radio,
  Clock,
} from 'lucide-react';

export const LiveDashboard: React.FC = () => {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [refreshMode, setRefreshMode] = useState<AutoRefreshMode>('PAUSED');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null);

  // Discrete Rolling History Buffer (retained in frontend state for approximately 60 seconds)
  const [rollingHistory, setRollingHistory] = useState<TelemetryHistoryPoint[]>([]);

  // Table filtering and sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'pid' | 'threads' | 'name'>('cpu');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Overlap guard ref to prevent stacked requests if previous capture is still unresolved
  const isRequestInFlightRef = useRef<boolean>(false);

  // Core capture function
  const executeCapture = useCallback(async (isAuto = false) => {
    // Overlap prevention: skip tick if previous request is still in flight
    if (isRequestInFlightRef.current) {
      return;
    }

    isRequestInFlightRef.current = true;
    if (!isAuto) {
      setIsCapturing(true);
    }

    try {
      const snap = await fetchLiveSnapshot();
      const now = new Date();
      setSnapshot(snap);
      setLastCaptureTime(now);
      setError(null);

      // Append discrete observation to 60s rolling history buffer
      setRollingHistory((prev) => {
        const newPoint: TelemetryHistoryPoint = {
          timestamp: snap.timestamp,
          cpu_percent: snap.cpu.total_cpu_percent,
          memory_percent: snap.memory.percent_used,
        };

        const updated = [...prev, newPoint];
        // Bounded retention window: keep observations from approximately the last 60 seconds
        const cutoff = snap.timestamp - 60.0;
        const filtered = updated.filter((p) => p.timestamp >= cutoff);

        // Safeguard cap at 65 points
        return filtered.length > 65 ? filtered.slice(-65) : filtered;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to capture real host snapshot.');
    } finally {
      isRequestInFlightRef.current = false;
      if (!isAuto) {
        setIsCapturing(false);
      }
      setIsLoading(false);
    }
  }, []);

  // Initial load: fetch status and capture one initial baseline snapshot (starts in PAUSED mode)
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      setIsLoading(true);
      setError(null);
      try {
        const liveStat = await fetchLiveStatus();
        if (isMounted) {
          setStatus(liveStat);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to connect to Live Observation subsystem.');
        }
      }

      if (isMounted) {
        await executeCapture(false);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [executeCapture]);

  // Auto-Refresh Polling Lifecycle with clean unmount and overlap protection
  useEffect(() => {
    if (refreshMode === 'PAUSED') {
      return;
    }

    let intervalMs = 2000;
    if (refreshMode === '1s') intervalMs = 1000;
    else if (refreshMode === '2s') intervalMs = 2000;
    else if (refreshMode === '5s') intervalMs = 5000;

    const timerId = window.setInterval(() => {
      executeCapture(true);
    }, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [refreshMode, executeCapture]);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(2)} GB`;
    }
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${bytes} B`;
  };

  // Format accumulated CPU time helper (seconds -> HH:MM:SS)
  const formatCpuTime = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return '—';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered and sorted processes (memoized)
  const processedList = useMemo(() => {
    if (!snapshot || !snapshot.processes) return [];

    let list = [...snapshot.processes];

    // Filter by query (name or PID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.pid.toString().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'cpu':
          cmp = a.cpu_percent - b.cpu_percent;
          break;
        case 'memory':
          cmp = a.memory_bytes - b.memory_bytes;
          break;
        case 'pid':
          cmp = a.pid - b.pid;
          break;
        case 'threads':
          cmp = (a.thread_count ?? 0) - (b.thread_count ?? 0);
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [snapshot, searchQuery, sortBy, sortAsc]);

  const handleSort = (field: 'cpu' | 'memory' | 'pid' | 'threads' | 'name') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  // Sparkline arrays from discrete history buffer
  const cpuHistoryValues = useMemo(
    () => rollingHistory.map((h) => h.cpu_percent),
    [rollingHistory]
  );
  const memoryHistoryValues = useMemo(
    () => rollingHistory.map((h) => h.memory_percent),
    [rollingHistory]
  );

  return (
    <div className="space-y-5 font-mono">
      {/* Console Header Banner & Telemetry Controls */}
      <div className="retro-panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-[#39FF6A]" />
            <h2 className="text-sm sm:text-base font-bold text-[#E8F5E9] tracking-wider uppercase glow-text-green">
              OSIM // LIVE SYSTEM OBSERVATION [REAL-TIME MONITOR]
            </h2>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#161912] border border-[#383D33] text-[#39FF6A] font-bold">
              READ-ONLY
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#121A12] border border-[#39FF6A]/40 text-[#DCDCAA] font-bold">
              REAL TELEMETRY
            </span>
          </div>
          <p className="text-xs text-[#83887E] mt-1">
            Continuous real-time performance telemetry observed non-invasively from host operating system.
          </p>
        </div>

        {/* Real-Time Polling Switch + Capture Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto-Refresh Segmented Switch */}
          <div className="flex items-center bg-[#0E110A] border border-[#262922] rounded-[3px] p-0.5 text-xs">
            <span className="px-2 py-1 text-[10px] text-[#83887E] font-bold flex items-center gap-1 border-r border-[#262922]">
              <Radio className={`w-3 h-3 ${refreshMode !== 'PAUSED' ? 'text-[#39FF6A] animate-pulse' : 'text-[#83887E]'}`} />
              REFRESH:
            </span>
            {(['PAUSED', '1s', '2s', '5s'] as AutoRefreshMode[]).map((mode) => {
              const isActive = refreshMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setRefreshMode(mode)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-[2px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#182317] text-[#39FF6A] border border-[#39FF6A]/60 shadow-[0_0_8px_rgba(57,255,106,0.2)]'
                      : 'text-[#83887E] hover:text-[#E8F5E9] border border-transparent'
                  }`}
                  title={mode === 'PAUSED' ? 'Halt automatic polling' : `Poll every ${mode}`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Manual One-Shot Capture Button */}
          <button
            onClick={() => executeCapture(false)}
            disabled={isCapturing || isLoading}
            className="flex items-center gap-1.5 bg-[#122214] hover:bg-[#182F1C] active:scale-95 disabled:opacity-40 text-[#39FF6A] border border-[#39FF6A] px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all shadow-[0_0_12px_rgba(57,255,106,0.2)] cursor-pointer"
            title="Execute manual snapshot capture"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
            <span>{isCapturing ? 'CAPTURING...' : '[CAPTURE SNAPSHOT]'}</span>
          </button>
        </div>
      </div>

      {/* Timestamp, Cadence & Freshness Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs bg-[#0A0C08] border border-[#262922] px-3 py-2 rounded-[3px] gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#83887E]">
            <Clock className="w-3.5 h-3.5 text-[#DCDCAA]" />
            <span>LAST CAPTURE:</span>
            <span className="font-bold text-[#E8F5E9]">
              {lastCaptureTime ? lastCaptureTime.toLocaleTimeString() : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[#83887E]">MODE:</span>
            <span className={`font-bold ${refreshMode === 'PAUSED' ? 'text-[#83887E]' : 'text-[#39FF6A]'}`}>
              {refreshMode === 'PAUSED' ? 'PAUSED' : `AUTO (${refreshMode})`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-[#B8433A] font-bold text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> STALE / CONNECTION INTERRUPTED
            </span>
          ) : isCapturing ? (
            <span className="text-[#39FF6A] font-bold text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#39FF6A] animate-ping" /> SAMPLING...
            </span>
          ) : (
            <span className="text-[#83887E] text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#39FF6A]" /> FRESH SNAPSHOT
            </span>
          )}

          {status?.platform && (
            <span className="text-[10px] text-[#83887E] uppercase border-l border-[#262922] pl-2">
              HOST: {status.platform}
            </span>
          )}
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

      {/* Primary KPI & Discrete Oscilloscope Cards */}
      {snapshot && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Telemetry + Rolling Sparkline */}
          <div className="retro-panel p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-[#83887E] mb-1">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#39FF6A]" /> REAL CPU UTILIZATION
                </span>
                <span className="text-[10px] text-[#39FF6A] border border-[#39FF6A]/30 px-1 rounded-[2px]">
                  {snapshot.cpu.logical_cpu_count} CORES
                </span>
              </div>
              <div className="text-3xl font-bold text-[#39FF6A] tracking-tight glow-text-green">
                {snapshot.cpu.total_cpu_percent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#83887E] mt-0.5">
                HOST TOTAL SAMPLED ACROSS ALL LOGICAL CORES
              </div>
            </div>

            {/* Rolling Sparkline (60s discrete observations, newest at right edge) */}
            <RollingSparkline
              values={cpuHistoryValues}
              color="#39FF6A"
              label="CPU HISTORICAL TRACE (60S)"
              currentValue={snapshot.cpu.total_cpu_percent}
              max={100}
            />
          </div>

          {/* Memory Telemetry + Rolling Sparkline */}
          <div className="retro-panel p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-[#83887E] mb-1">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#DCDCAA]" /> REAL MEMORY USAGE
                </span>
                <span className="text-[10px] text-[#DCDCAA] border border-[#DCDCAA]/30 px-1 rounded-[2px]">
                  {formatBytes(snapshot.memory.total_bytes)}
                </span>
              </div>
              <div className="text-3xl font-bold text-[#DCDCAA] tracking-tight glow-text-amber">
                {snapshot.memory.percent_used.toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#83887E] mt-0.5">
                USED: {formatBytes(snapshot.memory.used_bytes)} &bull; AVAIL: {formatBytes(snapshot.memory.available_bytes)}
              </div>
            </div>

            {/* Rolling Sparkline (60s discrete observations, newest at right edge) */}
            <RollingSparkline
              values={memoryHistoryValues}
              color="#DCDCAA"
              label="RAM HISTORICAL TRACE (60S)"
              currentValue={snapshot.memory.percent_used}
              max={100}
            />
          </div>

          {/* Process Count & Snapshot Identification */}
          <div className="retro-panel p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-[#83887E] mb-1">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#4EC9B0]" /> OBSERVED PROCESSES
                </span>
                <span className="text-[10px] text-[#4EC9B0] border border-[#4EC9B0]/30 px-1 rounded-[2px]">
                  PID ENUMERATION
                </span>
              </div>
              <div className="text-3xl font-bold text-[#4EC9B0] tracking-tight">
                {snapshot.process_count}
              </div>
              <div className="text-[10px] text-[#83887E] mt-0.5 truncate" title={snapshot.snapshot_id}>
                ID: {snapshot.snapshot_id}
              </div>
            </div>

            {/* Observational Cadence Card */}
            <div className="bg-[#0A0C08] border border-[#262922] p-2.5 rounded-[2px] space-y-1.5 text-[10px]">
              <div className="flex justify-between text-[#83887E]">
                <span>BUFFER SAMPLES:</span>
                <span className="font-bold text-[#E8F5E9]">{rollingHistory.length} / 60</span>
              </div>
              <div className="flex justify-between text-[#83887E]">
                <span>STREAM PROTOCOL:</span>
                <span className="font-bold text-[#39FF6A]">HTTP NONCE-POLL</span>
              </div>
              <div className="flex justify-between text-[#83887E]">
                <span>PROCESS ACCESS:</span>
                <span className="font-bold text-[#4EC9B0]">LOCAL STRICT READ-ONLY</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logical Core Load Distribution Matrix */}
      {snapshot && snapshot.cpu.per_cpu_percent && (
        <div className="retro-panel p-4">
          <CoreLoadMatrix perCpuPercent={snapshot.cpu.per_cpu_percent} />
        </div>
      )}

      {/* Real-Time Process Table (htop / Task Manager Style) */}
      {snapshot && (
        <div className="retro-panel p-4 space-y-3">
          {/* Table Header Controls: Search & Row Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262922] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#39FF6A] font-bold">&gt;&gt;</span>
              <h3 className="font-bold text-[#E8F5E9] tracking-wider uppercase">
                ACTIVE_PROCESS_TABLE
              </h3>
              <span className="text-[10px] text-[#83887E] bg-[#161912] border border-[#262922] px-1.5 py-0.5 rounded-[2px]">
                SHOWING {Math.min(processedList.length, 50)} OF {snapshot.process_count}
              </span>
            </div>

            {/* Search Filter Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#83887E] absolute left-2.5" />
              <input
                type="text"
                placeholder="Filter by name or PID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0A0C08] border border-[#262922] focus:border-[#39FF6A] rounded-[2px] pl-8 pr-3 py-1 text-xs text-[#E8F5E9] placeholder-[#555A4F] outline-none transition-colors w-full sm:w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-[#83887E] hover:text-[#E8F5E9] absolute right-2"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#262922] text-[#83887E] text-[10px] uppercase">
                  <th
                    className="py-1.5 px-2 cursor-pointer hover:text-[#E8F5E9] select-none"
                    onClick={() => handleSort('pid')}
                  >
                    <div className="flex items-center gap-1">
                      <span>PID</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    className="py-1.5 px-2 cursor-pointer hover:text-[#E8F5E9] select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>PROCESS NAME</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-2">PPID</th>
                  <th className="py-1.5 px-2">STATUS</th>
                  <th
                    className="py-1.5 px-2 text-right cursor-pointer hover:text-[#E8F5E9] select-none"
                    onClick={() => handleSort('cpu')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>CPU %</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    className="py-1.5 px-2 text-right cursor-pointer hover:text-[#E8F5E9] select-none"
                    onClick={() => handleSort('memory')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>MEMORY (RSS)</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    className="py-1.5 px-2 text-right cursor-pointer hover:text-[#E8F5E9] select-none"
                    onClick={() => handleSort('threads')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>THREADS</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="py-1.5 px-2 text-right">CPU TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1C16]">
                {processedList.slice(0, 50).map((p: ProcessObservation) => {
                  const isHighCpu = p.cpu_percent > 10.0;
                  return (
                    <tr
                      key={p.pid}
                      className={`hover:bg-[#161912] transition-colors ${
                        isHighCpu ? 'bg-[#141A12]/40' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 text-[#39FF6A] font-bold">{p.pid}</td>
                      <td className="py-1.5 px-2 text-[#E8F5E9] font-medium truncate max-w-xs" title={p.name}>
                        {p.name}
                      </td>
                      <td className="py-1.5 px-2 text-[#83887E]">{p.parent_pid ?? '—'}</td>
                      <td className="py-1.5 px-2 text-[#DCDCAA] text-[10px] uppercase">
                        <span className="px-1 py-0.5 rounded-[1px] bg-[#161811] border border-[#262922]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        <span className={isHighCpu ? 'text-[#39FF6A] glow-text-green' : 'text-[#E8F5E9]'}>
                          {p.cpu_percent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#DCDCAA]">
                        {formatBytes(p.memory_bytes)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#83887E]">
                        {p.thread_count ?? '—'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#83887E]">
                        {formatCpuTime(p.cpu_time_seconds)}
                      </td>
                    </tr>
                  );
                })}

                {processedList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-xs text-[#83887E]">
                      No processes match the query &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security & Architectural Boundary Note */}
      <div className="bg-[#0A0C08] border border-[#262922] rounded-[4px] p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#39FF6A] font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>SECURITY &amp; ARCHITECTURAL BOUNDARY GUARANTEES</span>
        </div>
        <p className="text-[#83887E] leading-relaxed">
          <strong className="text-[#E8F5E9]">READ-ONLY:</strong> OSim will never terminate, suspend, alter priority, or modify CPU affinity for any process on your system. Telemetry is inspected locally via <code className="text-[#39FF6A]">psutil</code> and is never uploaded externally.
        </p>
        <p className="text-[#83887E] leading-relaxed">
          <strong className="text-[#E8F5E9]">REAL vs ESTIMATED vs SIMULATED:</strong> The values shown above are <span className="text-[#39FF6A]">REAL</span> observations gathered directly from your OS. They are intentionally kept decoupled from OSim&apos;s discrete <span className="text-[#DCDCAA]">SIMULATED</span> engine (<code className="text-[#DCDCAA]">sim_engine</code>).
        </p>
      </div>
    </div>
  );
};
