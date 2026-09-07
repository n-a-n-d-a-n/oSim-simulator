# OSim Phase 2 — CPU Scheduling API & Frontend Report

## 1. Executive Summary

Phase 2 expanded the pure-Python simulation engine from Phase 1 into a complete web application. A high-performance **FastAPI** backend exposes the simulation capabilities via RESTful endpoints, while an interactive **React + TypeScript + Vite** frontend delivers real-time visualization of CPU scheduling, timeline playback controls, Gantt charts, ready queue inspections, process state transitions, and performance metrics.

---

## 2. Backend Architecture (`backend/app/`)

The web layer connects HTTP clients to the simulation engine without introducing coupling into `sim_engine`.

### 2.1 API Endpoints
- **`POST /api/v1/cpu/simulate`**:
  - Validates and runs a CPU simulation request.
  - Accepts algorithm name (`FCFS`, `SJF`, `SRTF`, `ROUND_ROBIN`, `PRIORITY`), list of processes, algorithm options (`time_quantum`, `preemptive`, `lower_number_higher_priority`), and `context_switch_overhead`.
  - Returns the complete simulation response: total duration, Gantt chart segments, tick-by-tick system snapshots, event stream, and aggregated metrics.
- **`GET /api/v1/workloads/presets`**:
  - Exposes preconfigured standard workloads (Silberschatz benchmarks and edge cases) for immediate loading.
- **`GET /api/health`**:
  - Application health check returning service status.

### 2.2 Schemas & Data Validation (`backend/app/schemas/cpu.py`)
- Built with Pydantic v2.
- Enforces strict data integrity:
  - Non-negative arrival times ($t \ge 0$).
  - Strictly positive burst times ($b > 0$).
  - Unique PID validation per workload.
  - Required positive `time_quantum` when `ROUND_ROBIN` is requested.
  - Context-switch overhead non-negative integer constraint ($k \ge 0$).

---

## 3. Frontend Architecture (`frontend/src/`)

The frontend is built with React 19, TypeScript, and Vite, organized into modular components and custom hooks.

### 3.1 State Management & Hook (`hooks/useCpuSimulation.ts`)
- Manages current simulation parameters, loading states, and API error states.
- Coordinates playback clock using `requestAnimationFrame` / `setInterval` with tick-stepping logic.
- Supports **Play**, **Pause**, **Step Forward**, **Step Back**, **Reset**, and dynamic speed multipliers ($0.5\times, 1\times, 2\times, 4\times$).
- Provides the currently active `SystemState` snapshot corresponding to the timeline cursor.

### 3.2 Visual Components (`components/cpu/`)
1. **`CpuControls.tsx`**: Algorithm selection, quantum input, preemption toggle, context switch overhead toggle, and execution trigger.
2. **`PresetSelector.tsx`**: Workload presets selector for instant benchmark loading.
3. **`ProcessInput.tsx`**: Dynamic process creation, randomized generation, table editing, and validation.
4. **`GanttChart.tsx`**: Color-coded timeline displaying process execution bursts, idle gaps, and context switches, with a draggable/clickable tick cursor.
5. **`CpuStatus.tsx`**: Active CPU status card showing the current process, remaining burst, and progress indicator.
6. **`ReadyQueue.tsx`**: Live visualization of queued processes waiting for CPU allocation.
7. **`ProcessStatesView.tsx`**: Live process state columns categorized into `READY`, `RUNNING`, and `TERMINATED`.
8. **`ProcessTable.tsx`**: Comprehensive process status table with live state and calculated turnaround/waiting/response times.
9. **`MetricsSummary.tsx`**: Metric indicator cards for CPU Utilization, Average Turnaround Time, Average Waiting Time, Average Response Time, and Throughput.
10. **`EventLog.tsx`**: Chronological simulation event feed with tick badges and filtering.
11. **`TimelineControls.tsx`**: Media control toolbar with playback buttons and timeline slider.

---

## 4. Verification & Validation

### 4.1 Backend Integration Tests (`backend/tests/test_api_cpu.py`)
Nine comprehensive integration tests confirm API functionality:
- `test_api_health`: Health check validation.
- `test_api_fcfs_simulation`: Silberschatz FCFS benchmark via HTTP POST.
- `test_api_sjf_simulation`: SJF execution and metric integrity.
- `test_api_srtf_simulation`: SRTF preemption via API.
- `test_api_round_robin_simulation`: Round Robin quantum execution via API.
- `test_api_priority_simulation`: Priority scheduling via API.
- `test_api_validation_errors`: Validates 422 Unprocessable Entity on invalid inputs.
- `test_api_missing_round_robin_quantum`: Validates requirement of quantum for Round Robin.
- `test_api_presets_retrieval`: Validates preset workload catalog.
- `test_api_deterministic_repeated_requests`: Verifies byte-identical API outputs across repeated calls.

### 4.2 Frontend Build & Typecheck
The frontend codebase was compiled and validated with zero errors:
- Command: `npm run build` (`tsc -b && vite build`)
- Result: Clean build, 0 TypeScript errors, production assets bundled successfully into `frontend/dist/`.

**Overall Status**: Phase 1 + Phase 2 successfully integrated and verified.
