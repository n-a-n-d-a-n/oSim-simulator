# OSim Phase 3 — Contiguous Memory Allocation Report

## 1. Executive Summary

Phase 3 introduces a complete, framework-independent **contiguous memory allocation subsystem** to **OSim**. The module implements core allocation strategies (First Fit, Best Fit, Worst Fit, and Next Fit with address cursor wrap-around), dynamic block splitting, canonical bidirectional coalescing, external fragmentation tracking, educational allocation failure reporting, FastAPI endpoints, and an address-accurate, proportional React + TypeScript visualization with reversible timeline playback.

---

## 2. Memory Model & Address Convention

### 2.1 Single Contiguous Address Space
- Memory spans from address $0$ to $N - 1$, where $N = \text{memory\_size}$.
- Every block occupies a half-open interval $[ \text{start\_address}, \text{end\_address} )$.
- Block size is defined strictly as:
  $$\text{size} = \text{end\_address} - \text{start\_address}$$
- Example: $[0, 200)$ covers byte addresses 0 through 199 with size 200 units.

### 2.2 Invariants Maintained at Every Tick
1. **Address Coverage**:
   $$\text{block}[0].\text{start\_address} = 0 \quad \text{and} \quad \text{block}[-1].\text{end\_address} = \text{memory\_size}$$
2. **Contiguity & Non-Overlapping**:
   $$\text{block}[i].\text{end\_address} = \text{block}[i+1].\text{start\_address} \quad \forall i \in [0, m-2]$$
   There are zero unmapped gaps and zero overlapping partitions.
3. **Conservation of Memory**:
   $$\sum_{i} \text{block}[i].\text{size} = \text{memory\_size}$$
   $$\text{used\_memory} + \text{free\_memory} = \text{memory\_size}$$
4. **Canonical Coalescing**:
   $$\neg (\text{block}[i].\text{is\_free} \land \text{block}[i+1].\text{is\_free}) \quad \forall i$$
   Adjacent free blocks are merged immediately upon deallocation.
5. **Allocation Correctness**:
   For any successful variable-partition allocation, $\text{allocated\_size} = \text{requested\_size}$.

---

## 3. Allocation Strategies & Semantics

### 3.1 First Fit (`FirstFitAllocator`)
- Scans memory blocks in ascending order of `start_address` starting from address 0.
- Selects the first free block satisfying $\text{block.size} \ge \text{requested\_size}$.
- Splits the block if $\text{block.size} > \text{requested\_size}$, returning the remainder to the free pool.

### 3.2 Best Fit (`BestFitAllocator`)
- Scans all free blocks across the entire memory space.
- Selects the eligible block with the minimum size:
  $$\arg\min_{\text{block} \in \text{Free}, \, \text{size} \ge R} \text{block.size}$$
- Deterministic Tie-Breaking: If multiple candidate blocks have the same minimum size, the block with the lowest `start_address` is chosen.

### 3.3 Worst Fit (`WorstFitAllocator`)
- Scans all free blocks across the entire memory space.
- Selects the eligible block with the maximum size:
  $$\arg\max_{\text{block} \in \text{Free}, \, \text{size} \ge R} \text{block.size}$$
- Leaves the largest possible remainder block for subsequent allocations.
- Deterministic Tie-Breaking: If multiple blocks share the same largest size, the block with the lowest `start_address` is chosen.

### 3.4 Next Fit (`NextFitAllocator`) & Cursor Semantics
- `next_fit_cursor` is represented as an integer memory address (initialized to 0).
- Search begins at the cursor address and scans forward toward the end of memory. If no suitable block is found, search wraps around to address 0 and continues up to the cursor.
- **Cursor Advancement**: Upon successful allocation $[\text{start}, \text{end})$, the cursor advances to $\text{end} \pmod N$.
- **Preservation Across Deallocation**: Deallocations do not reset or alter the cursor address.
- **Spanning Block Behavior**: If a free block $[\text{start}, \text{end})$ spans the cursor ($\text{start} \le \text{cursor} < \text{end}$):
  - In the forward pass, available contiguous space from cursor forward is $\text{end} - \text{cursor}$.
  - If $\text{end} - \text{cursor} \ge \text{size}$, allocation occurs at $[\text{cursor}, \text{cursor} + \text{size})$, leaving $[\text{start}, \text{cursor})$ as a leading free block.
  - If $\text{end} - \text{cursor} < \text{size}$, the forward pass continues. During wrap-around, $[\text{start}, \text{cursor})$ is evaluated from its start.

---

## 4. Operation Ordering & Coalescing

### 4.1 Same-Tick Deterministic Ordering
When multiple operations are scheduled at the same discrete simulation tick $t$:
1. All `DEALLOCATE` operations execute first.
2. All `ALLOCATE` operations execute second.

**Architectural Rationale**: Memory released by terminating or deallocating processes at tick $t$ becomes immediately available to allocation requests scheduled for that same tick, preventing spurious allocation failures.

### 4.2 Block Coalescing
Upon `DEALLOCATE(request_id)`:
1. The block owned by `request_id` is identified and marked `is_free = True`, `owner_id = None`.
2. If the successor block is free, it is merged into the current block.
3. If the predecessor block is free, the current block is merged into the predecessor block.
4. Standardized `MEMORY_BLOCK_MERGED` simulation events are emitted.

---

## 5. Fragmentation Modeling & Metrics

### 5.1 External Fragmentation
- External fragmentation occurs when sufficient total free memory exists across memory, but no single contiguous free block is large enough to satisfy a request:
  $$\text{external\_fragmentation} = \text{total\_free\_memory} - \text{largest\_free\_block}$$
  $$\text{external\_fragmentation\_ratio} = \begin{cases} \frac{\text{external\_fragmentation}}{\text{total\_free\_memory}}, & \text{if } \text{total\_free\_memory} > 0 \\ 0.0, & \text{otherwise} \end{cases}$$
- When an allocation fails due to external fragmentation, the simulation engine and UI present clear diagnostics explaining that total free memory was sufficient, but lack of contiguity caused the failure.

### 5.2 Internal Fragmentation
- In pure variable-partition contiguous allocation where blocks are allocated to exact requested byte lengths, internal fragmentation is **0**. Remainder partitions from splits are retained as free blocks, contributing to external fragmentation rather than internal waste.

---

## 6. Architecture & API Endpoints

### 6.1 Framework-Independent Simulation Engine
- `backend/sim_engine/memory/`: Implemented in pure Python (standard library only) with zero external web, HTTP, or UI imports.
- Adheres to the discrete-time state progression:
  $$\text{MemoryState}(t) \xrightarrow{\text{Operations}} \text{SimulationEvents}(t) \xrightarrow{\text{Reducer}} \text{MemoryState}(t+1)$$

### 6.2 FastAPI REST Endpoints
- `POST /api/v1/memory/simulate`: Simulates memory operations and returns tick-by-tick snapshots, events, operation results, and metrics.
- `GET /api/v1/memory/workloads`: Returns the catalog of 7 canonical educational presets:
  - Preset A: Basic Sequential Allocation
  - Preset B: First Fit vs Best Fit Divergence
  - Preset C: Worst Fit Largest-Hole Selection
  - Preset D: Next Fit Cursor Progression & Wrap
  - Preset E: External Fragmentation Failure
  - Preset F: Adjacent Block Coalescing
  - Preset G: Dynamic Multi-Process Lifecycle Stress Workload
- `GET /api/v1/memory/workloads/{preset_id}`: Single preset retrieval.

---

## 7. Frontend Visualization Dashboard

### 7.1 Component Architecture (`frontend/src/components/memory/`)
1. **`MemoryDashboard.tsx`**: Top-level coordinator managing simulation state, preset selection, and subcomponent layout.
2. **`MemoryMap.tsx`**: Address-accurate, proportional memory bar with hover tooltips, block start/end markers, and Next Fit cursor line indicator.
3. **`MemoryMetrics.tsx`**: KPI cards displaying Total, Used, Free, Largest Free Block, External Fragmentation, External Fragmentation Ratio, and Success/Failure counters.
4. **`AllocationResult.tsx`**: Real-time feedback card explaining allocation outcomes and external fragmentation educational insights.
5. **`MemoryTimelineControls.tsx`**: Playback bar with Play, Pause, Step Forward, Step Back, Reset, Speed multipliers (0.5x, 1x, 2x, 4x), and timeline scrubber.
6. **`MemoryEventLog.tsx`**: Filterable event stream with tick tags and category badges.
7. **`MemoryPresetSelector.tsx`**: Quick-loading cards for educational presets A through G.
8. **`MemoryOperationInput.tsx`**: Dynamic operation schedule editor.

---

## 8. Verification & Test Results

### 8.1 Test Summary
- Total Tests: **78 passed in 2.56s** (31 Phase 1 & 2 tests + 47 Phase 3 tests).
- Zero regressions on Phase 1 & 2 CPU simulation engine and API.
- Architectural boundary test confirmed: `sim_engine/memory/` contains zero web/framework imports.
- Frontend compilation (`tsc -b && vite build`): **0 errors**.
- Linter (`oxlint`): **0 errors**.

### 8.2 Known Limitations
1. Memory compaction (relocating active partitions dynamically) is an advanced technique planned for future comparison modes, not implemented in Phase 3.
2. Paging, page tables, TLBs, and virtual memory translation belong strictly to Phase 4.
3. Coupling between CPU execution burst consumption and memory occupancy will be established in Phase 6 (Integrated OS Simulation).
