# OSim - Interactive Operating System Resource Management Simulator

## Project Overview

**OSim** is an educational, web-based operating-system simulator designed to visualize core OS resource-management concepts interactively. Through real-time Gantt charts, process state tracking, and playback controls, OSim bridges the gap between theoretical operating system principles and practical runtime behavior.

The simulator allows students, educators, and systems engineers to inspect step-by-step CPU scheduling, simulate context switches, examine ready queues, and analyze performance metrics under textbook workloads and custom edge cases.

---

## Current Implementation Status

### ✅ Phase 1 - Core Engine + CPU Scheduling
- **Discrete-Time Simulation Engine**: Deterministic tick-by-tick simulation cycle with strict temporal ordering.
- **Immutable SystemState Snapshots**: Every discrete tick produces an immutable state snapshot capturing CPU state, ready queue order, and process progress.
- **Standardized SimulationEvent Model**: Structured event stream capturing `PROCESS_ARRIVED`, `PROCESS_SCHEDULED`, `PROCESS_PREEMPTED`, `PROCESS_COMPLETED`, `CPU_IDLE`, and `CONTEXT_SWITCH`.
- **CPU Scheduling Algorithms Implemented**:
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF, Non-Preemptive)
  - Shortest Remaining Time First (SRTF, Preemptive SJF)
  - Round Robin (RR) with configurable time quantum
  - Priority Scheduling (both Preemptive and Non-Preemptive, configurable priority polarity)
- **Deterministic Execution**: Strict tie-breaking rules guarantee identical outputs across repeated runs.
- **Comprehensive Metrics**: Automated calculation of Turnaround Time, Waiting Time, Response Time, CPU Utilization, and Throughput.
- **Context-Switch Modeling**: Configurable context-switch overhead ticks inserted between process switches.
- **Automated Tests**: 31 comprehensive unit and integration tests passing against canonical benchmarks.

### ✅ Phase 2 - CPU Scheduling API + Frontend
- **FastAPI REST API**: High-performance RESTful service exposing CPU simulation execution and benchmark workloads.
- **React + TypeScript Interface**: Modern, responsive dashboard engineered with Vite and TypeScript.
- **CPU Scheduling Controls**: Intuitive UI for selecting algorithms, adjusting quantum, toggling preemption, and configuring context-switch overhead.
- **Process Input**: Dynamic editor to add, edit, randomize, and remove processes (arrival time, burst time, priority).
- **Preset Workloads**: One-click loading of canonical Silberschatz Chapter 5 benchmarks and edge cases.
- **Gantt Chart**: Interactive, color-coded execution timeline displaying process execution bursts, idle gaps, and context-switch blocks with a live scrubber cursor.
- **Process Metrics**: Summary cards and detailed data tables with per-process completion, turnaround, waiting, and response times.
- **CPU State**: Visual card displaying the active process, remaining burst, and progress bar.
- **Ready Queue**: Real-time queue visualizer reflecting current order and arrival status.
- **Process States**: Categorized state columns tracking processes across `READY`, `RUNNING`, and `TERMINATED`.
- **Event Log**: Chronological, searchable audit trail of every simulation event with tick timestamps.
- **Timeline Playback**: Interactive media controller featuring **Play**, **Pause**, **Step Forward**, **Step Back**, **Reset**, timeline slider scrubber, and variable playback speeds (0.5x, 1x, 2x, 4x).

---

## Planned Phases

- ⬜ **Phase 3 - Contiguous Memory Allocation** (Fixed & variable partitioning, First-Fit, Best-Fit, Worst-Fit, external fragmentation & compaction)
- ⬜ **Phase 4 - Virtual Memory + Page Replacement** (Paging, Page Tables, TLB simulation, FIFO, LRU, Optimal page replacement)
- ⬜ **Phase 5 — Deadlock Detection + Banker’s Algorithm** (Resource allocation graphs, cycle detection, safety algorithm, avoidance)
- ⬜ **Phase 6 — Integrated OS Simulation** (Coupled CPU, Memory, and I/O subsystem workflows)
- ⬜ **Phase 7 — Comparison / Benchmarking / Learning Mode** (Side-by-side algorithm benchmarking and interactive student quizzes)

---

## Architecture

OSim follows a strict three-tier layered architecture enforcing clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│        (Vite, TypeScript, Component Dashboard)          │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP / JSON
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI REST API                     │
│      (Pydantic Schemas, API Endpoints, Validation)      │
└───────────────────────────┬─────────────────────────────┘
                            │ Direct Python Invocation
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Pure Python Simulation Engine             │
│    (Discrete Engine, Core Schedulers, Event Models)     │
└─────────────────────────────────────────────────────────┘
```

> **Architectural Boundary Principle**: The core simulation engine (`backend/sim_engine/`) is implemented in pure Python (standard library only) and remains completely decoupled and independent from FastAPI, HTTP protocols, and any UI/web framework. It can be executed in standalone CLI scripts, automated test runners, or imported as a library.

---

## Current Algorithms

| Algorithm | Type | Preemptive | Key Parameters |
| :--- | :--- | :--- | :--- |
| **FCFS** (First-Come, First-Served) | Non-Preemptive | No | Arrival Time, Burst Time |
| **SJF** (Shortest Job First) | Non-Preemptive | No | CPU Burst Time |
| **SRTF** (Shortest Remaining Time First) | Preemptive | Yes | Remaining Burst Time |
| **Round Robin** | Preemptive | Yes | Time Quantum ($q$) |
| **Priority Scheduling** | Preemptive / Non-Preemptive | Configurable | Priority Level, Polarity |

---

## Running the Project

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Install Backend Dependencies
From the repository root:
```bash
pip install -r requirements.txt
```

### 2. Run the Backend API
Start the FastAPI application with Uvicorn:
```bash
uvicorn backend.app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 3. Run the Frontend Application
In a separate terminal, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at the displayed local URL (typically `http://localhost:5173`).

### 4. Run Automated Tests
Execute the full test suite from the repository root:
```bash
pytest
```
To run tests with verbose output:
```bash
pytest -v
```

### 5. Run the CLI Demonstration
To run the terminal-based Silberschatz benchmark suite directly through the core simulation engine:
```bash
python run_demo.py
```
This runs FCFS, SJF, SRTF, Round Robin, Priority, and context-switch overhead demonstrations with deterministic verification.
