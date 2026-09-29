# OSim Phase 4 — Virtual Memory & Page Replacement Report

## 1. Executive Summary & Objective

Phase 4 introduces a complete, framework-independent **Virtual Memory & Page Replacement simulation subsystem** to **OSim**. The module implements single-level paging, mathematical address decomposition and physical address translation, physical frame allocation and eviction, core page replacement algorithms (FIFO, LRU, Optimal/Belady's MIN, and Second-Chance Clock), deterministic page fault lifecycles, structured educational simulation events, cumulative metrics, FastAPI endpoints, and an address-accurate React + TypeScript dashboard with reversible timeline playback.

---

## 2. Conceptual Architecture & Purity

The architecture maintains strict decoupling between the deterministic simulation engine, the REST API, and host observations:

```
React / TypeScript Systems Console
               │
               ▼  (HTTP REST JSON)
         FastAPI Layer
     (backend/app/api/v1/virtual_memory.py)
               │
               ▼  (Pure Domain Invocations)
  Deterministic Simulation Engine
(backend/sim_engine/virtual_memory/)
  ├── address.py       (Address decomposition & translation)
  ├── page_table.py    (SingleLevelPageTable & PageTableEntry)
  ├── frame.py         (PhysicalMemoryPool & PhysicalFrame)
  ├── state.py         (MemoryReference & immutable VirtualMemorySnapshot)
  ├── event.py         (VirtualMemoryEventType & create_vm_event)
  ├── metrics.py       (compute_vm_metrics)
  ├── presets.py       (Textbook benchmarks & Belady anomaly presets)
  ├── engine.py        (VirtualMemorySimulationEngine & SimulationResult)
  └── replacement/     (Strategy pattern: FIFO, LRU, Optimal, Clock)
```

### Architectural Boundaries
- `backend/sim_engine/` is pure Python standard library only.
- It contains **zero** imports of `fastapi`, `starlette`, `pydantic`, `psutil`, `backend.live_agent`, or UI frameworks.
- Verified by automated AST syntax tree architecture boundary tests.

---

## 3. Address Model & Mathematical Translation

Address translation maps a virtual address space $V$ to physical memory $P$ using a fixed page size $S$:

1. **Parameters:**
   - Page Size: $S = 2^k$ bytes (e.g., $1024, 2048, 4096, 8192$; default $4096$).
   - Virtual Page Count: $N_v = 2^m$ pages (default $16$ pages, yielding virtual address space $V = S \times N_v = 65,536$ bytes).
   - Physical Frame Count: $N_f$ frames (default $3$ or $4$ frames, yielding RAM capacity $P = S \times N_f$).

2. **Mathematical Decomposition:**
   $$\text{Offset } d = \text{virtual\_address} \pmod S = \text{virtual\_address} \ \& \ (S - 1)$$
   $$\text{Page Number } p = \lfloor \text{virtual\_address} / S \rfloor = \text{virtual\_address} \gg k$$

3. **Physical Address Construction:**
   $$\text{Physical Address} = (f \times S) + d$$
   where $f$ is the physical frame allocated to page $p$.

4. **Input Modes:**
   - **Mode A (PAGE_REFERENCE):** References represent virtual page numbers directly (e.g., `[7, 0, 1, 2, 0, 3...]`). Offset defaults to $0$.
   - **Mode B (VIRTUAL_ADDRESS):** References represent byte virtual addresses (e.g., `[0, 4096, 5000, 8192...]`). The engine decomposes each address dynamically into page number and offset using the configured page size.

---

## 4. Single-Level Page Table & Residency Semantics

The subsystem implements a strict **Single-Level Page Table** mapping $p \to \text{entry}$:

### Presence Semantics
- In accordance with OS design principles, residency is explicitly modeled with:
  ```python
  is_present: bool
  ```
  - `True`: Page currently occupies an allocated physical frame in RAM.
  - `False`: Page is non-resident (triggers a Page Fault upon access).
- The ambiguous `"is_valid"` terminology is deliberately avoided for residency.

### Invariants Enforced at Every Step
1. **Uniqueness of Frame Allocation:** No two present page table entries may map to the same physical frame simultaneously.
2. **Page-Frame Bidirectional Consistency:** If page table entry $p$ maps to frame $f$ with `is_present=True`, frame $f$ must record `page_number=p` and `is_occupied=True`.
3. **Non-Resident Constraint:** If `is_present=False`, `frame_number` must be `None`.

---

## 5. Physical Memory Pool & Frame Management

Physical memory consists of an indexed pool of physical frames:
$$\text{Frames} = [0, 1, \dots, N_f - 1]$$

### Free Frame Discovery
- When a page fault occurs, the engine first queries `find_free_frame()`.
- Free frames are discovered in deterministic ascending index order ($0 \dots N_f - 1$).
- If an unoccupied frame exists, the page is loaded immediately **without invoking page replacement**.

---

## 6. Page Replacement Policies

When a page fault occurs and all physical frames are occupied, the engine delegates victim selection to the configured replacement strategy:

### 6.1 First-In, First-Out (`FIFOReplacement`)
- **Victim Selection:** Selects the frame with the earliest `loaded_at_tick`:
  $$\arg\min_{f \in \text{Frames}} f.\text{loaded\_at\_tick}$$
- **Tie-Breaking:** Deterministically by lowest `frame_number`.
- **Hit Behavior:** Memory hits do **not** modify `loaded_at_tick`.
- **Anomaly:** Subject to Belady's Anomaly (verified: sequence `[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]` yields 9 faults with 3 frames, but 10 faults with 4 frames).

### 6.2 Least Recently Used (`LRUReplacement`)
- **Victim Selection:** Selects the frame with the earliest `last_accessed_tick`:
  $$\arg\min_{f \in \text{Frames}} f.\text{last\_accessed\_tick}$$
- **Tie-Breaking:** Deterministically by lowest `frame_number`.
- **Hit & Load Behavior:** Updates `last_accessed_tick = current_tick`.
- **Stack Property:** LRU satisfies the inclusion property and is provably immune to Belady's Anomaly.

### 6.3 Optimal / Belady's MIN (`OptimalReplacement`)
- **Theoretical Benchmark:** Requires knowledge of future reference trace. Real operating systems cannot know future references online.
- **Victim Selection:**
  1. Priority 1: Resident pages that are **never referenced again** in the remaining sequence (infinite forward distance).
  2. Priority 2: Resident pages whose next reference occurs farthest in the future.
- **Tie-Breaking:** Deterministically by lowest `page_number`, then lowest `frame_number`.
- **Minimal Faults:** Produces the theoretical lower bound on page faults (9 faults on Silberschatz benchmark).

### 6.4 Second-Chance / Clock (`ClockReplacement`)
- **Hardware Approximation of LRU:**
  - Maintains a circular `clock_hand` cursor ($0 \le \text{hand} < N_f$) that **persists across references and replacements**.
  - Each resident frame maintains a hardware `reference_bit` ($0$ or $1$).
- **Hit Behavior:** Sets `reference_bit = 1`.
- **Replacement Scan:**
  1. Inspect frame at `clock_hand`.
  2. If `reference_bit == 1`: clear bit to $0$, advance `clock_hand = (clock_hand + 1) % N_f`, and repeat scan (second chance granted).
  3. If `reference_bit == 0`: select frame as victim, advance `clock_hand = (clock_hand + 1) % N_f`, and conclude replacement.

---

## 7. Deterministic Page Fault Lifecycle

Every memory access executes the following atomic lifecycle:

```
Step 1: Receive MemoryReference (Page p, Offset d)
Step 2: Lookup Page Table Entry p
Step 3: Check Residency (is_present)
  ├─► Present == True: [PAGE HIT]
  │     - Touch page table & frame (update recency / reference bit)
  │     - Translate physical address: (frame * page_size) + d
  │     - Emit PAGE_HIT & ADDRESS_TRANSLATED events
  │
  └─► Present == False: [PAGE FAULT]
        - Emit PAGE_FAULT event
        - Check for free frame:
            ├─► Free frame available:
            │     - Allocate lowest-index free frame f
            │     - Emit FREE_FRAME_SELECTED event
            │
            └─► Physical memory full:
                  - Invoke replacement algorithm
                  - Select victim frame f containing page v
                  - Emit PAGE_EVICTION_STARTED & PAGE_EVICTED events
                  - Unmap victim page v (set is_present=False)
                  - Clear frame f
        - Load requested page p into frame f
        - Update page table entry p (set is_present=True, frame=f)
        - Update replacement algorithm hooks (on_page_loaded)
        - Emit PAGE_LOADED & PAGE_TABLE_UPDATED events
        - Translate physical address: (f * page_size) + d
        - Emit ADDRESS_TRANSLATED event
Step 4: Validate Invariants
Step 5: Emit True Immutable VirtualMemorySnapshot
Step 6: Advance Simulation Clock
```

---

## 8. Immutable Timeline Architecture

To guarantee safe reversible playback in the UI and prevent mutation leakage:
- `VirtualMemorySnapshot` is a frozen dataclass (`frozen=True`).
- Page table and frame collections are exported as **defensive immutable tuples** of frozen entry snapshots.
- Cumulative metrics are calculated and frozen at each step.
- An explicit regression test (`test_engine_snapshot_immutability`) proves that mutating internal engine structures post-run has zero effect on earlier timeline snapshots.

---

## 9. Educational Workload Catalog

| Preset ID | Preset Name | Frame Count | Algorithm | Benchmark Significance |
|---|---|---|---|---|
| `vm-silberschatz-benchmark` | Silberschatz Benchmark | 3 | LRU | Canonical Chapter 9 sequence: FIFO (15), LRU (12), Optimal (9). |
| `vm-belady-anomaly` | Belady's Anomaly Demo | 3 vs 4 | FIFO | Classic demonstration where 4 frames produce more faults (10) than 3 frames (9) under FIFO. |
| `vm-clock-second-chance` | Second-Chance Clock Loop | 3 | CLOCK | Multi-revolution scan exercising reference bit clearing and hand movement. |
| `vm-locality-phases` | Locality Shifts | 4 | LRU | Working set transitions between distinct subroutine loops. |
| `vm-thrashing-loop` | Thrashing Sequence | 3 | FIFO | Working set larger than physical frame capacity inducing near 100% faults. |
| `vm-virtual-address-translation` | Byte Address Mode | 4 | LRU | Hexadecimal and decimal byte addresses decomposing into page and offset. |

---

## 10. REST API Specification

### Endpoints
- `POST /api/v1/virtual-memory/simulate`
- `GET /api/v1/virtual-memory/workloads`
- `GET /api/v1/virtual-memory/workloads/{preset_id}`

### Sample Simulation Request
```json
{
  "algorithm": "LRU",
  "frame_count": 3,
  "page_size": 4096,
  "virtual_page_count": 16,
  "input_mode": "PAGE_REFERENCE",
  "references": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
}
```

### Sample Simulation Response
```json
{
  "algorithm_name": "LRU",
  "num_frames": 3,
  "page_size": 4096,
  "virtual_page_count": 16,
  "input_mode": "PAGE_REFERENCE",
  "terminated_normally": true,
  "timeline": [ ... ],
  "events": [ ... ],
  "final_metrics": {
    "total_references": 20,
    "page_hits": 8,
    "page_faults": 12,
    "hit_ratio": 0.4,
    "fault_ratio": 0.6,
    "total_translations": 20,
    "replacements": 9,
    "evictions": 9,
    "free_frames": 0,
    "resident_pages": 3
  }
}
```

---

## 11. Retro Systems Console UI

The React + TypeScript frontend integrates Virtual Memory into the systems console under the `[VIRTUAL MEMORY (PHASE 4)]` tab:
1. **Paging Controls & Reference Stream Input:** Real-time selectors for algorithm, frames, page size, virtual page count, and input mode.
2. **Preset Selector:** One-click loading of textbook benchmarks.
3. **Page Fault / Hit Oscilloscope Banner:** High-visibility green/crimson alert banner displaying current reference resolution and replacement reasoning.
4. **MMU Address Translation Pipeline:** Visual decomposition: Virtual Address $\to$ Page Number + Offset $\to$ Physical Address.
5. **Physical Hardware Frames (RAM):** Indexed physical frame cards with occupancy status, loaded timestamp, access timestamp, and the animated `[CLOCK HAND ➜]` badge.
6. **Single-Level Page Table:** Complete tabular page mapping showing residency (`YES`/`NO`), allocated frame, reference bit, and timestamps.
7. **Reversible Timeline Controller:** Play, Pause, Step Backward, Step Forward, Reset, Scrubber slider, and variable playback speed (0.5x, 1x, 2x, 4x).
8. **Paging Metrics:** KPI summary cards for Hits, Faults, Hit Rate %, Fault Rate %, Replacements, and Evictions.
9. **Scrolling Event Log:** TTY audit trail with event filtering.

---

## 12. Deliberate Scope Exclusions

The following concepts were deliberately excluded to maintain educational clarity and system modularity:
- **Dirty Bits & Backing Store:** Disk write-back and swapfile simulation are omitted to focus on replacement algorithms.
- **Inverted or Multi-Level Page Directories:** Kept as a pure single-level page table to maximize viva clarity.
- **Hardware TLB Cache Timing:** Hardware cycle delays and TLB misses belong to low-level hardware simulations.
- **Live System Observation Coupling:** Live host telemetry (`live_agent`) remains strictly read-only and decoupled.

---

## 13. Preparation for Future Phases

Phase 4 establishes the fundamental paging and memory-management primitives required for:
- **Phase 5 (Deadlock Management):** Resource allocation graph and Banker's algorithm.
- **Phase 6 (Integrated OS Simulation):** Unifying the CPU scheduler (Phase 1) with virtual memory paging (Phase 4) and contiguous partitions (Phase 3) into an integrated operating system kernel simulation.
