# OSim — Live System Observation Foundation Architecture

## 1. Vision & Educational Motivation

Operating system courses traditionally teach resource management using clean, idealized models:
- Processes arrive at integer timestamps with predefined CPU burst durations.
- Schedulers operate in discrete ticks with zero or fixed context-switch overheads.
- Memory allocation acts upon perfectly known partition requests in contiguous blocks.

In contrast, real operating systems operate amidst dynamic chaos:
- Bursts are unknown in advance and must be estimated or observed retrospectively.
- Hundreds of threads contend for hardware resources across asymmetric cores.
- Memory pages are shared, cached, mapped, and swapped dynamically.

**OSim Live System Observation** bridges this divide. It introduces a non-invasive, read-only instrumentation subsystem that captures real telemetry from the host operating system, visualizes active processes and hardware utilization, and establishes the foundation for synthesizing educational workloads that can be fed into OSim's deterministic simulation engine (`sim_engine`).

---

## 2. Architectural Boundaries & Isolation

A cornerstone requirement of OSim is **strict architectural decoupling**. The discrete-time simulation engine (`backend/sim_engine/`) must remain pure, deterministic, and free of side effects.

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│        (Oscilloscope Traces, Memory Map, Live Dash)     │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP / JSON
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI REST API                     │
│               (/api/v1/cpu, /memory, /live)             │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│   Pure Simulation Engine  │ │    Live System Agent      │
│  (sim_engine: CPU/Memory) │ │ (live_agent: psutil/host) │
│                           │ │                           │
│  • Pure Python stdlib     │ │  • Read-only observation  │
│  • Deterministic ticks    │ │  • Real-time sampling     │
│  • Zero psutil / OS deps  │ │  • One-shot snapshot API  │
│  • Zero network/FastAPI   │ │  • Zero state mutation    │
└───────────────────────────┘ └───────────────────────────┘
```

### Architectural Invariants
1. **Zero Contamination**: `backend/sim_engine/` has **zero imports** of `backend.live_agent`, `psutil`, `fastapi`, or OS observation APIs. This is verified automatically in the CI test suite via AST analysis (`backend/tests/test_architecture_boundaries.py`).
2. **Independent Testability**: `sim_engine` tests execute with deterministic inputs without requiring host system privileges, network access, or `psutil`.
3. **Mockable Collectors**: All live telemetry collection in `backend/live_agent/` is mediated through abstract collector interfaces, enabling unit testing with deterministic mock telemetry.

---

## 3. Data Models & Immutability

Live system models reside in [backend/live_agent/models.py](file:///c:/Users/kabra/OneDrive/Desktop/oSim/backend/live_agent/models.py). All models are implemented as immutable (frozen) Python dataclasses to guarantee thread safety and prevent unintentional mutation.

### Core Dataclasses

#### `ProcessObservation`
Represents point-in-time observed telemetry of a single OS process:
- `pid: int` (Positive process identifier; 0 permitted on Windows for System Idle)
- `name: str` (Executable or process name)
- `status: str` (Normalized state: `running`, `sleeping`, `disk_sleep`, `stopped`, `zombie`, `idle`, `unknown`)
- `cpu_percent: float` (Observed CPU utilization percentage `[0.0, 100.0 * num_cores]`)
- `memory_rss_bytes: int` (Resident Set Size in bytes, non-negative)
- `memory_vms_bytes: int` (Virtual Memory Size in bytes, non-negative)
- `memory_percent: float` (RAM utilization percentage `[0.0, 100.0]`)
- `num_threads: int` (Observed thread count $\ge 0$)
- `create_time: float` (POSIX creation timestamp $\ge 0.0$)
- `username: Optional[str]` (Process owner; `None` if inaccessible or restricted)

#### `CPUObservation`
Represents host-level processor utilization:
- `utilization_percent: float` (Total CPU utilization `[0.0, 100.0]`)
- `per_core_percent: tuple[float, ...]` (Per-core utilization percentages)
- `logical_core_count: int` (Count of logical execution cores $\ge 1$)
- `physical_core_count: Optional[int]` (Count of physical CPU cores, or `None` if unavailable)
- `frequency_current_mhz: Optional[float]` (Current processor clock rate, or `None`)
- `frequency_max_mhz: Optional[float]` (Maximum rated clock rate, or `None`)

#### `MemoryObservation`
Represents host-level physical and virtual memory telemetry:
- `total_bytes: int` (Total physical memory in bytes $> 0$)
- `available_bytes: int` (Physical memory available for allocation $\ge 0$)
- `used_bytes: int` (Physical memory currently utilized $\ge 0$)
- `percent: float` (RAM utilization percentage `[0.0, 100.0]`)
- `swap_total_bytes: int` (Total configured swap/paging space $\ge 0$)
- `swap_used_bytes: int` (Active swap space utilized $\ge 0$)
- `swap_percent: float` (Swap utilization percentage `[0.0, 100.0]`)

#### `SystemSnapshot`
An aggregate point-in-time observation of the host operating system:
- `snapshot_id: str` (Unique UUIDv4 string)
- `timestamp: float` (UTC POSIX timestamp of capture)
- `cpu: CPUObservation`
- `memory: MemoryObservation`
- `processes: tuple[ProcessObservation, ...]` (Sorted deterministically by PID ascending)
- `process_count: int` (Total processes captured in snapshot)
- `platform: str` (Host platform identifier: `windows`, `linux`, `darwin`)

---

## 4. Collector Architecture & Semantics

Telemetry collection is decoupled from `psutil` using abstract base interfaces defined in [backend/live_agent/collectors/base.py](file:///c:/Users/kabra/OneDrive/Desktop/oSim/backend/live_agent/collectors/base.py).

### Collector Contracts
- `CPUCollector.collect_cpu() -> CPUObservation`
- `MemoryCollector.collect_memory() -> MemoryObservation`
- `ProcessCollector.collect_processes() -> list[ProcessObservation]`

### Failure Handling Semantics
Real operating systems are dynamic. Processes terminate, fork, and restrict access continuously:
1. **Ephemeral Process Skip**: When enumerating processes, if an individual process terminates or denies access (`psutil.NoSuchProcess`, `psutil.AccessDenied`, `psutil.ZombieProcess`), it is **gracefully skipped**. The collector logs or skips without aborting the snapshot.
2. **Collector Error Surfacing**: If host telemetry collection encounters an unrecoverable system-level failure, a `CollectorError` is raised and translated into an explicit HTTP 503 error with diagnostic details.
3. **No Zero Fabrication**: Never replace unavailable real telemetry with fabricated zeros. If a property is not supported on a platform or is restricted, it is represented honestly as `None`.
4. **Honest CPU Sampling**: CPU percentage requires a time delta. `PsutilCPUCollector` configures a measured interval (`sample_interval=0.1s`) and seeds initial measurement so that user-triggered snapshots reflect true CPU activity rather than artificial zeroes.

---

## 5. Telemetry Semantics: Real vs. Estimated vs. Simulated

OSim maintains strict distinctions between data tiers to prevent student misconceptions:

| Category | Definition | Examples | Constraints in LIVE-1 |
| :--- | :--- | :--- | :--- |
| **REAL** | Measured directly from the host operating system via OS counters. | PID, RSS bytes, CPU utilization, thread count. | Always genuine; never faked; `None` if inaccessible. |
| **ESTIMATED** | Derived through statistical modeling or heuristic analysis over real metrics. | Moving average CPU demand, estimated remaining burst, working set size. | **Not present in LIVE-1**. Reserved for future phases. |
| **SIMULATED** | Synthetic parameters chosen for theoretical study within `sim_engine`. | Configured burst time, integer arrival tick, priority level, time quantum. | Handled exclusively inside `sim_engine`. Never mixed into `live_agent`. |

> **Critical Rule**: A real OS process does **NOT** possess an inherent "CPU burst time". In real computing, burst times are unpredictable future quantities. Therefore, `ProcessObservation` strictly **omits** any burst time field.

---

## 6. Safety & Security Boundary (Read-Only Contract)

The Live System subsystem operates under a non-negotiable **read-only safety contract**:

1. **No Process Termination**: No calls to `terminate()`, `kill()`, `taskkill`, or `SIGKILL`.
2. **No Priority Alteration**: No calls to `nice()`, `SetPriorityClass()`, or thread priority APIs.
3. **No Process Suspension**: No `suspend()`, `resume()`, `SIGSTOP`, or `SIGCONT`.
4. **No CPU Affinity Manipulation**: No modifying affinity masks or process bindings.
5. **No Host Modification**: No creating files, altering registries, changing environment variables, or mounting filesystems.
6. **No Arbitrary Execution**: No running shell commands (`subprocess.Popen`, `os.system`) on the host.
7. **No Telemetry Upload**: Telemetry is strictly retained on `localhost`. No data is uploaded or transmitted externally.

---

## 7. Real-Time Continuous Monitoring (LIVE-2)

OSim LIVE-2 introduces continuous, real-time host observability inspired by desktop systems consoles (Windows Task Manager, Linux `htop`).

### Polling Architecture & Cadence Control
Rather than introducing background Python server threads or persistent stateful WebSocket/SSE channels, LIVE-2 employs **Frontend-Driven Auto-Refresh Polling** against the standard `GET /api/v1/live/snapshot` REST endpoint:
- **Modes**: `PAUSED` (default upon initial load), `1s` (~1000ms), `2s` (~2000ms), `5s` (~5000ms).
- **Initial Load**: Captures an initial baseline snapshot upon mounting, then remains in `PAUSED` mode until the user explicitly selects an interval.
- **Overlap Protection**: An in-flight request ref (`isRequestInFlightRef`) ensures that if an OS sample takes longer than the interval, subsequent ticks are skipped safely rather than queueing stacked concurrent requests.
- **Clean Unmount**: React `useEffect` cleanups explicitly invoke `clearInterval()` when navigating away from the Live tab, guaranteeing zero background CPU consumption.

### Discrete Rolling History Buffer (60 Seconds)
- Stored exclusively in transient frontend component state (`rollingHistory`).
- **Bounded Window**: Retains discrete real observations where $\text{timestamp} \ge \text{current\_timestamp} - 60.0\text{s}$ (capped at 65 entries).
- **Oscilloscope Sparklines**: Discrete SVG step lines render directly from discrete snapshots with the newest observation on the right edge. No continuous animation or interpolated synthetic values are fabricated between samples.
- **Transient Only**: Discarded upon tab refresh; never persisted to disk or SQLite in LIVE-2.

### Task Manager / htop-Style Process Table
- Real-time search filter matching process executable names or PIDs.
- Dynamic column sorting across PID, Name, CPU %, Memory (RSS), and Thread count.
- Enriched process telemetry display including Parent PID (`PPID`) and accumulated user/system CPU execution time (`CPU TIME`).
- Virtualized top-50 row rendering to preserve smooth 60 FPS performance without browser DOM thrashing.

---

## 8. Current Limitations & Scope Exclusions

LIVE-2 is strictly bounded:
- ❌ No WebSockets or Server-Sent Events (SSE).
- ❌ No background daemon threads or schedulers in Python backend.
- ❌ No process control: no kill, suspend, resume, priority, or CPU affinity modification.
- ❌ No historical database or disk persistence.
- ❌ No event detection or automated anomaly alerting.
- ❌ No Live → Simulation workload synthesis.
- ❌ No Phase 4 Virtual Memory / Page Replacement implementation.

---

## 9. Future Roadmap

With LIVE-1 and LIVE-2 established, subsequent phases will introduce:

1. **Phase LIVE-3: Event Detection & Heuristics**
   - Detection of notable OS events: CPU saturation spikes, process spawn bursts, memory pressure.
2. **Phase LIVE-4: Educational Workload Synthesis**
   - Analyzing real process execution histories to derive synthetic arrival times and estimated burst durations.
   - Producing validated `CPUSimulateRequest` payloads from real host activity.
3. **Phase LIVE-5: Comparative Simulation Mode**
   - Replaying live-derived workloads across OSim schedulers (FCFS, Round Robin, SRTF, Priority) to study how different scheduling policies would have managed the observed host workload.
