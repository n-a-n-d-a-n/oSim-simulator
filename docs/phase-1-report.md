# OSim Phase 1 — Core Engine & CPU Scheduling Report

## 1. Executive Summary

Phase 1 established the foundation for **OSim**, implementing a standalone, deterministic, discrete-time simulation engine and canonical CPU scheduling algorithms in pure Python. The simulation engine adheres to strict modularity boundaries, ensuring zero dependencies on web frameworks or user interfaces.

---

## 2. Architecture & Core Components

The core engine is located in `backend/sim_engine/` and consists of three modular packages:

### 2.1 Core Simulation Engine (`backend/sim_engine/core/`)
- **`process.py`**: Models the `Process` entity, tracking attributes such as PID, arrival time, burst time, priority, remaining burst time, state (`NEW`, `READY`, `RUNNING`, `TERMINATED`), start time, completion time, and context switch count.
- **`state.py`**: Defines immutable snapshots (`SystemState`, `ProcessSnapshot`, `GanttSegment`) capturing the system at every discrete tick $t$, enabling deterministic timeline scrub and replay.
- **`events.py`**: Defines the `SimulationEvent` model and event types (`PROCESS_ARRIVED`, `PROCESS_SCHEDULED`, `PROCESS_PREEMPTED`, `PROCESS_COMPLETED`, `CPU_IDLE`, `CONTEXT_SWITCH`).
- **`base_scheduler.py`**: Abstract base class `BaseScheduler` specifying standard scheduling hooks (`add_process`, `schedule_next`, `on_tick`, `is_empty`, `get_ready_pids`).
- **`metrics.py`**: Aggregates per-process metrics (Waiting Time, Turnaround Time, Response Time) and holistic system metrics (CPU Utilization, Throughput).
- **`engine.py`**: Orchestrates the discrete-time simulation loop (`CPUSimulationEngine`), managing process arrivals, CPU execution, context-switch cycles, state snapshot collection, and completion termination.

### 2.2 Schedulers (`backend/sim_engine/cpu/`)
1. **FCFS (`fcfs.py`)**: First-Come, First-Served queue ordering by arrival time and arrival sequence.
2. **SJF (`sjf.py`)**: Non-preemptive Shortest Job First selecting processes by minimum burst time, breaking ties deterministically by arrival time and PID.
3. **SRTF (`srtf.py`)**: Shortest Remaining Time First (preemptive SJF), evaluating preemption at every arrival and tick boundary.
4. **Round Robin (`round_robin.py`)**: Circular queue scheduling with configurable time quantum $q$, tracking slice consumption and rotating preempted processes to the rear of the ready queue.
5. **Priority Scheduler (`priority.py`)**: Supports both non-preemptive and preemptive priority scheduling, with configurable polarity (lower number represents higher priority by default).

### 2.3 Benchmark Presets (`backend/sim_engine/workload/presets.py`)
Provides reference workloads directly sourced from *Silberschatz, Galvin, and Gagne: Operating System Concepts (Chapter 5)*:
- FCFS & SJF Benchmark: $P_1(24), P_2(3), P_3(3)$ at $t=0$.
- SRTF Benchmark: $P_1(8@0), P_2(4@1), P_3(9@2), P_4(5@3)$.
- Round Robin ($q=4$) Benchmark: $P_1(24@0), P_2(3@0), P_3(3@0)$.
- Priority Benchmark: $P_1(10, \text{prio } 3), P_2(1, \text{prio } 1), P_3(2, \text{prio } 3), P_4(1, \text{prio } 4), P_5(5, \text{prio } 2)$.

---

## 3. Key Engine Capabilities

1. **Deterministic Execution**:
   Deterministic tie-breaking rules (first by arrival time, then alphabetically by PID) ensure identical outputs across repeated runs with identical inputs.
2. **Context-Switch Overhead Modeling**:
   Engine supports specifying an integer context-switch cost ($k$ ticks). When the running process changes, the CPU enters a dedicated `CONTEXT_SWITCH` state for $k$ ticks before the next process runs.
3. **Discrete-Time Step Safety**:
   Protected by a configurable `max_ticks` threshold to prevent infinite simulation loops from misbehaving inputs.
4. **Boundary Isolation**:
   Pure Python implementation requiring only the Python standard library.

---

## 4. Verification & Test Results

A test suite of 22 dedicated Phase 1 tests verifies all edge cases, benchmarks, and architectural boundaries:

| Test Module | Coverage Area | Tests | Status |
| :--- | :--- | :---: | :---: |
| `test_fcfs.py` | Single process, Silberschatz benchmark, staggered arrivals, tie-breaks | 4 | PASSED |
| `test_sjf.py` | Silberschatz benchmark, staggered arrivals | 2 | PASSED |
| `test_srtf.py` | Silberschatz benchmark, preemption criteria, non-preemption on equal remaining time | 2 | PASSED |
| `test_round_robin.py` | Silberschatz benchmark, quantum=1, large quantum matches FCFS | 3 | PASSED |
| `test_priority.py` | Silberschatz non-preemptive benchmark, preemptive staggered, tie-breaks | 3 | PASSED |
| `test_engine_invariants_and_edges.py` | CPU idle gaps, context-switch overhead, zero-burst processes, max ticks safeguard, determinism repeatability, event stream integrity | 7 | PASSED |
| `test_architecture_boundaries.py` | Verification that `sim_engine` imports zero web/fastapi modules | 1 | PASSED |

**Total Phase 1 Tests**: 22 passed.
