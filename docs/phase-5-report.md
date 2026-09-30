# Phase 5 Implementation Report: Deadlock Detection & Banker's Algorithm

## 1. Executive Summary & Problem Definition

In multitasking operating systems, resource allocation and concurrency management are prone to **deadlock**—a condition where a set of processes is permanently blocked because each process holds resources and waits for resources held by other processes in the set.

Phase 5 introduces a comprehensive, mathematically rigorous **Deadlock Management Subsystem** into OSim. The subsystem incorporates:
1. **Deadlock Avoidance (Banker's Algorithm)**: Proactive evaluation of resource claims ($Max$) and remaining needs ($Need$) before granting requests, guaranteeing that the system remains in a **Safe State** where at least one execution sequence exists allowing all processes to complete.
2. **Deadlock Detection**: Reactive discovery of deadlocks using the actual outstanding $Request$ matrix and available instances ($Available$) via Silberschatz/Coffman row-reduction.
3. **Graph Models**:
   - **Resource Allocation Graph (RAG)**: Bipartite directed graph representing processes, resources, assignments, and requests.
   - **Wait-For Graph (WFG)**: Reduced directed graph for single-instance resource systems.
4. **Deterministic Simulation Engine**: Pure Python, strictly decoupled simulation orchestrator generating immutable timeline snapshots, discrete events, and metrics.
5. **Interactive Retro Console Visualization**: React 19 + TypeScript dashboard enabling real-time inspection of matrices, timeline playback, interactive resource requests, and visual cycle tracing.

---

## 2. Theoretical Foundations & Deadlock Conditions

### Coffman's Four Necessary Conditions for Deadlock
A deadlock can arise if and only if four conditions hold simultaneously in a system:
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must hold at least one resource and be waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be preempted; a resource can only be released voluntarily by the process holding it after task completion.
4. **Circular Wait**: A closed chain of processes $\{P_0, P_1, \dots, P_{n-1}\}$ exists such that $P_0$ waits for a resource held by $P_1$, $P_1$ waits for $P_2$, and $P_{n-1}$ waits for $P_0$.

---

## 3. Mathematical Notation & Resource Domain Model

Let $n$ be the number of processes $\{P_0, P_1, \dots, P_{n-1}\}$ and $m$ be the number of distinct resource types $\{R_0, R_1, \dots, R_{m-1}\}$.

### Vectors & Matrices
- **Total Capacity Vector ($E \in \mathbb{N}^m$)**: $E[j]$ is the total instance capacity of resource type $R_j$.
- **Available Vector ($A \in \mathbb{N}^m$)**: $A[j]$ is the number of unallocated instances of resource type $R_j$.
- **Allocation Matrix ($Alloc \in \mathbb{N}^{n \times m}$)**: $Alloc[i][j]$ is the number of instances of $R_j$ currently allocated to process $P_i$.
- **Maximum Claim Matrix ($Max \in \mathbb{N}^{n \times m}$)**: $Max[i][j]$ is the maximum number of instances of $R_j$ that $P_i$ may ever claim.
- **Need Matrix ($Need \in \mathbb{N}^{n \times m}$)**: $Need[i][j]$ is the remaining instances of $R_j$ that $P_i$ may request to complete its execution:
  $$Need[i][j] = Max[i][j] - Alloc[i][j]$$
- **Request Matrix ($Request \in \mathbb{N}^{n \times m}$)**: $Request[i][j]$ is the number of instances of $R_j$ currently requested and awaited by process $P_i$.

### Invariants & Conservation Laws
1. **Non-negativity**:
   $$\forall i, j: \quad Alloc[i][j] \ge 0, \quad Max[i][j] \ge 0, \quad A[j] \ge 0, \quad E[j] > 0$$
2. **Claim Bound**:
   $$\forall i, j: \quad Alloc[i][j] \le Max[i][j] \implies Need[i][j] \ge 0$$
3. **Conservation of Instances**:
   $$\forall j \in \{0, \dots, m-1\}: \quad A[j] + \sum_{i=0}^{n-1} Alloc[i][j] = E[j]$$

---

## 4. Distinction: Banker's Avoidance vs Deadlock Detection

A critical conceptual distinction is enforced across the architecture, code, API, and UI:

| Dimension | Banker's Algorithm (Avoidance) | Deadlock Detection |
| :--- | :--- | :--- |
| **Purpose** | Proactive avoidance of unsafe states | Reactive detection of existing circular waits |
| **Demand Input** | **$Need$ matrix** ($Max - Alloc$) | **$Request$ matrix** (actual blocked requests) |
| **Philosophy** | Pessimistic: Assumes each process might request its maximum claim | Realistic: Only examines currently blocked requests |
| **Initial Finish Flag** | $Finish[i] = \text{False}$ for all $i$ | $Finish[i] = \text{True}$ if $Alloc[i] == \vec{0}$, else $\text{False}$ |
| **Work Update** | $Work \leftarrow Work + Alloc[i]$ when $Need[i] \le Work$ | $Work \leftarrow Work + Alloc[i]$ when $Request[i] \le Work$ |
| **Outcome** | SAFE sequence or UNSAFE | NO DEADLOCK or DEADLOCK DETECTED |

---

## 5. Algorithms Implemented

### 5.1 Banker's Safety Algorithm
1. Let $Work = Available$ and $Finish[i] = False$ for $i = 0, 1, \dots, n-1$.
2. Repeatedly find the lowest index $i$ such that:
   $$Finish[i] == False \quad \text{and} \quad Need[i] \le Work$$
3. If such an $i$ exists:
   $$Work \leftarrow Work + Alloc[i]$$
   $$Finish[i] \leftarrow True$$
   $$\text{Append } P_i \text{ to } SafeSequence$$
   Repeat step 2.
4. If $Finish[i] == True$ for all $i$, the system is in a **SAFE** state with sequence $SafeSequence$. Otherwise, the system is **UNSAFE**.

### 5.2 Resource-Request Algorithm (Banker's Avoidance)
For a process $P_i$ requesting vector $Request_i$:
1. **Claim Check**: If $Request_i \le Need_i$ is false, raise `ERROR / CLAIM_EXCEEDED`.
2. **Availability Check**: If $Request_i \le Available$ is false, return `WAITING / INSUFFICIENT_AVAILABLE` (do not alter state).
3. **Tentative Allocation**:
   $$Available' = Available - Request_i$$
   $$Alloc'[i] = Alloc[i] + Request_i$$
   $$Need'[i] = Need[i] - Request_i$$
4. **Safety Analysis**: Run Banker's Safety Algorithm on tentative state.
   - If **SAFE**: Commit tentative state and return `GRANTED`.
   - If **UNSAFE**: Perform complete structural rollback to original state and return `DENIED`.

### 5.3 Multi-Instance Deadlock Detection Algorithm
1. Let $Work = Available$.
2. For $i = 0, \dots, n-1$:
   $$Finish[i] = \begin{cases} True & \text{if } Alloc[i] == \vec{0} \\ False & \text{otherwise} \end{cases}$$
3. Repeatedly find lowest index $i$ such that:
   $$Finish[i] == False \quad \text{and} \quad Request[i] \le Work$$
4. If found:
   $$Work \leftarrow Work + Alloc[i]$$
   $$Finish[i] \leftarrow True$$
   Repeat step 3.
5. If $\exists i$ where $Finish[i] == False$, **DEADLOCK DETECTED**. The deadlocked set is $\{P_i \mid Finish[i] == False\}$.

---

## 6. Graph Representations: RAG & WFG

### Resource Allocation Graph (RAG)
- Bipartite directed graph $G = (V, E)$ where $V = P \cup R$.
- Directed edges:
  - **Request edge**: $P_i \to R_j$ ($P_i$ waiting for an instance of $R_j$).
  - **Assignment edge**: $R_j \to P_i$ (an instance of $R_j$ is allocated to $P_i$).

### Wait-For Graph (WFG)
- Constructed only for **single-instance** resource systems ($E[j] = 1$ for all $j$).
- If $P_i \to R_j$ and $R_j \to P_k$, reduced edge $P_i \to P_k$ is formed.
- **Cycle Theorem for Single-Instance Systems**: A cycle in WFG is necessary AND sufficient for deadlock.
- **Multi-Instance Rule**: A cycle in RAG is necessary but NOT sufficient for deadlock.

---

## 7. Educational Presets & Mathematically Verified Results

### Preset 1: Classic Banker Safe State (Silberschatz Ch. 7)
- $E = [10, 5, 7]$, $A = [3, 3, 2]$
- Allocation: $P_0(0,1,0), P_1(2,0,0), P_2(3,0,2), P_3(2,1,1), P_4(0,0,2)$
- Maximum: $P_0(7,5,3), P_1(3,2,2), P_2(9,0,2), P_3(2,2,2), P_4(4,3,3)$
- Need: $P_0(7,4,3), P_1(1,2,2), P_2(6,0,0), P_3(0,1,1), P_4(4,3,1)$
- **Result**: `STATE: SAFE`. Deterministic sequence under lowest-index tie-breaking:
  $$\langle P_1, P_3, P_0, P_2, P_4 \rangle$$

### Preset 2: Granted Resource Request
- Starting from Preset 1 baseline, $P_1$ requests $(1, 0, 2)$.
- $Request \le Need_1$ ($[1,0,2] \le [1,2,2]$) and $Request \le Available$ ($[1,0,2] \le [3,3,2]$).
- Tentative $Available' = [2, 3, 0]$.
- Safety test passes with sequence $\langle P_1, P_3, P_0, P_2, P_4 \rangle$.
- **Result**: `GRANTED`.

### Preset 3: Unsafe Resource Request (Denied & Rolled Back)
- Starting from Preset 2 post-state, $P_0$ requests $(0, 2, 0)$.
- Tentative $Available' = [2, 1, 0]$.
- No process can satisfy $Need \le Work$.
- **Result**: `DENIED (UNSAFE TENTATIVE STATE)`. System rolled back exactly.

### Preset 4: Single-Instance Ring Deadlock
- 4 processes $\{P_0, P_1, P_2, P_3\}$, 4 single-instance resources $\{R_0, R_1, R_2, R_3\}$.
- Allocations: $P_0 \to R_0, P_1 \to R_1, P_2 \to R_2, P_3 \to R_3$.
- Requests: $P_0 \to R_1, P_1 \to R_2, P_2 \to R_3, P_3 \to R_0$.
- WFG: $P_0 \to P_1 \to P_2 \to P_3 \to P_0$.
- **Result**: `DEADLOCK DETECTED`. Deadlocked processes: $\{P_0, P_1, P_2, P_3\}$.

### Preset 5: Multi-Instance Cycle with NO Deadlock (Counterexample)
- $E = [2, 2]$, $A = [0, 0]$
- Allocation: $P_0(1, 0), P_1(0, 1), P_2(1, 1)$
- Request: $P_0(0, 1), P_1(1, 0), P_2(0, 0)$
- RAG contains circular wait: $P_0 \to R_1 \to P_1 \to R_0 \to P_0$.
- However, $P_2$ has $Request = [0, 0] \le Work [0, 0]$.
- $P_2$ reduces first, releasing $[1, 1]$ into $Work \implies Work = [1, 1]$.
- Then both $P_0$ and $P_1$ reduce cleanly.
- **Result**: `NO DEADLOCK` (Proving that in multi-instance systems, cycle alone does not imply deadlock).

### Preset 6: Genuine Multi-Instance Deadlock (Silberschatz 7.6.2 Benchmark)
- 5 processes $\{P_0, P_1, P_2, P_3, P_4\}$, 3 resource types $A=7, B=2, C=6$.
- Initial $Available = [0, 0, 0]$.
- Requests: $P_0(0,0,0), P_1(2,0,2), P_2(0,0,1), P_3(1,0,0), P_4(0,0,2)$.
- Allocations: $P_0(0,1,0), P_1(2,0,0), P_2(3,0,3), P_3(2,1,1), P_4(0,0,2)$.
- $P_0$ has zero request and finishes, making $Work = [0, 1, 0]$.
- No other process has $Request \le Work$.
- **Result**: `DEADLOCK DETECTED`. Deadlocked processes: $\{P_1, P_2, P_3, P_4\}$.

---

## 8. Architecture & Subsystem Boundaries

The engine follows strict domain boundaries:
- `backend/sim_engine/deadlock/`: Pure Python algorithms with zero external dependencies (no FastAPI, Pydantic, psutil, asyncio).
- `backend/app/schemas/deadlock.py`: Pydantic boundary validation for input payloads and API responses.
- `backend/app/api/v1/deadlock.py`: FastAPI route handlers mounted at `/api/v1/deadlock/`.
- `frontend/src/`: React 19 + TypeScript retro UI consuming API endpoints without local algorithm re-computation.

---

## 9. Test Results & Quality Metrics

1. **Full Regression Suite**: 160 passing tests (125 baseline + 35 Phase 5 tests).
2. **Architecture Boundaries**: Passed with 0 forbidden imports.
3. **Frontend Build**: `tsc -b && vite build` passed with 0 errors in 1.20s.
4. **Frontend Lint**: `oxlint` passed with 0 errors across 64 files.
5. **Live Runtime Tests**: Verified against live uvicorn server on all 6 presets and regression endpoints.
