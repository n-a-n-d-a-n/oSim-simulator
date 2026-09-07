"""Canonical educational memory workload presets for OSim Phase 3."""

from dataclasses import dataclass
from typing import List, Dict, Any
from backend.sim_engine.memory.state import MemoryOperation, MemoryOperationType


@dataclass(frozen=True)
class MemoryWorkloadPreset:
    """Standardized educational memory workload preset."""
    id: str
    name: str
    category: str
    description: str
    recommended_algorithm: str
    memory_size: int
    operations: List[MemoryOperation]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "recommended_algorithm": self.recommended_algorithm,
            "memory_size": self.memory_size,
            "operations": [op.to_dict() for op in self.operations],
        }


def get_preset_a_basic() -> MemoryWorkloadPreset:
    """Preset A: Basic Allocation demonstrating sequential First Fit placement."""
    return MemoryWorkloadPreset(
        id="preset-a-basic",
        name="Preset A: Basic Sequential Allocation",
        category="Introductory",
        description="Sequential allocations showing standard contiguous placement and block splitting.",
        recommended_algorithm="FIRST_FIT",
        memory_size=1000,
        operations=[
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=200),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=300),
            MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=150),
            MemoryOperation(tick=3, operation_type=MemoryOperationType.ALLOCATE, request_id="P4", size=250),
        ],
    )


def get_preset_b_first_vs_best() -> MemoryWorkloadPreset:
    """Preset B: First Fit vs Best Fit comparison workload.
    
    Creates free holes of sizes 100, 500, 200, 300.
    A subsequent request of size 180 allocates in the 500 hole for First Fit,
    but in the 200 hole for Best Fit!
    """
    return MemoryWorkloadPreset(
        id="preset-b-first-vs-best",
        name="Preset B: First Fit vs Best Fit Divergence",
        category="Comparison",
        description=(
            "Generates free holes [100, 500, 200, 300]. A subsequent request of size 180 "
            "places into the 500 hole under First Fit, but the tight 200 hole under Best Fit."
        ),
        recommended_algorithm="BEST_FIT",
        memory_size=1600,
        operations=[
            # Setup layout: P1(100), H1(50), P2(500), H2(50), P3(200), H3(50), P4(300), H4(350)
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="FREE_H1", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="HOLD_1", size=50),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="FREE_H2", size=500),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="HOLD_2", size=50),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="FREE_H3", size=200),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="HOLD_3", size=50),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="FREE_H4", size=300),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="HOLD_4", size=350),
            # Release holes at tick 1
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="FREE_H1"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="FREE_H2"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="FREE_H3"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="FREE_H4"),
            # Request of size 180 at tick 2
            MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="TARGET_P", size=180),
        ],
    )


def get_preset_c_worst_fit() -> MemoryWorkloadPreset:
    """Preset C: Worst Fit Demonstration.
    
    Generates free holes [150, 400, 250]. A request of size 100 allocates
    into the largest 400 hole under Worst Fit, leaving a large 300 free remainder.
    """
    return MemoryWorkloadPreset(
        id="preset-c-worst-fit",
        name="Preset C: Worst Fit Largest-Hole Selection",
        category="Comparison",
        description=(
            "Generates free holes [150, 400, 250]. A request of size 100 selects the largest 400 "
            "block under Worst Fit, contrasting with First Fit (150) and Best Fit (150)."
        ),
        recommended_algorithm="WORST_FIT",
        memory_size=1000,
        operations=[
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H1", size=150),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP1", size=50),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H2", size=400),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP2", size=50),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="H3", size=250),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="SEP3", size=100),
            # Free the holes
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H1"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H2"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="H3"),
            # Request
            MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="PROC_X", size=100),
        ],
    )


def get_preset_d_next_fit() -> MemoryWorkloadPreset:
    """Preset D: Next Fit Cursor Progression & Wrap-Around.
    
    Demonstrates that Next Fit starts from where the last allocation occurred,
    progresses through memory, and wraps around to the start.
    """
    return MemoryWorkloadPreset(
        id="preset-d-next-fit",
        name="Preset D: Next Fit Cursor Progression & Wrap",
        category="Advanced",
        description=(
            "Allocates blocks, releases early blocks, and shows that Next Fit continues searching "
            "forward from its cursor rather than restarting at address 0, wrapping around when needed."
        ),
        recommended_algorithm="NEXT_FIT",
        memory_size=1000,
        operations=[
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=200),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=200),
            MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=200),
            MemoryOperation(tick=3, operation_type=MemoryOperationType.ALLOCATE, request_id="P4", size=200),
            # Deallocate P1 at [0, 200) - First Fit would pick this, but Next Fit cursor is at 800!
            MemoryOperation(tick=4, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
            # Next Fit allocates into remaining space [800, 1000)
            MemoryOperation(tick=5, operation_type=MemoryOperationType.ALLOCATE, request_id="P5", size=150),
            # Now memory end is reached, next allocation wraps around to [0, 200)
            MemoryOperation(tick=6, operation_type=MemoryOperationType.ALLOCATE, request_id="P6", size=100),
        ],
    )


def get_preset_e_external_fragmentation() -> MemoryWorkloadPreset:
    """Preset E: External Fragmentation Failure.
    
    Creates interleaved allocations and releases alternating blocks, yielding
    total free memory of 400 units (four 100-unit holes), but no contiguous block >= 250.
    A request for 250 units fails with an educational external fragmentation explanation.
    """
    return MemoryWorkloadPreset(
        id="preset-e-fragmentation",
        name="Preset E: External Fragmentation Failure",
        category="Educational",
        description=(
            "Creates 4 separated 100-unit free holes (total 400 units free). A subsequent "
            "request for 250 units fails because no single contiguous block is large enough."
        ),
        recommended_algorithm="FIRST_FIT",
        memory_size=800,
        operations=[
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="A1", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="B1", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="A2", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="B2", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="A3", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="B3", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="A4", size=100),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="B4", size=100),
            # Free alternating blocks A1..A4 at tick 1
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="A1"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="A2"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="A3"),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.DEALLOCATE, request_id="A4"),
            # Request 250 units at tick 2: total free=400, largest=100 -> FAILS!
            MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="LARGE_P", size=250),
        ],
    )


def get_preset_f_coalescing() -> MemoryWorkloadPreset:
    """Preset F: Block Coalescing (Merging Adjacent Free Blocks).
    
    Allocates blocks P1, P2, P3, P4. Deallocates P2, then P3 (merging with P2),
    then P1 (merging with P2+P3) to restore a large contiguous free space.
    """
    return MemoryWorkloadPreset(
        id="preset-f-coalescing",
        name="Preset F: Adjacent Block Coalescing",
        category="Educational",
        description=(
            "Allocates contiguous blocks and deallocates adjacent neighbors, demonstrating "
            "bidirectional merging of free blocks into a single large partition."
        ),
        recommended_algorithm="FIRST_FIT",
        memory_size=1000,
        operations=[
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=250),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=250),
            MemoryOperation(tick=2, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=250),
            MemoryOperation(tick=3, operation_type=MemoryOperationType.ALLOCATE, request_id="P4", size=250),
            # Deallocate P2: free [250, 500)
            MemoryOperation(tick=4, operation_type=MemoryOperationType.DEALLOCATE, request_id="P2"),
            # Deallocate P3: merges with P2 -> free [250, 750)
            MemoryOperation(tick=5, operation_type=MemoryOperationType.DEALLOCATE, request_id="P3"),
            # Deallocate P1: merges with P2+P3 -> free [0, 750)
            MemoryOperation(tick=6, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
            # Allocate P5 of size 600 into the merged block [0, 750)
            MemoryOperation(tick=7, operation_type=MemoryOperationType.ALLOCATE, request_id="P5", size=600),
        ],
    )


def get_preset_g_stress() -> MemoryWorkloadPreset:
    """Preset G: Complex Multi-Step Stress Workload.
    
    Extensive sequence of allocations, partial deallocations, and reallocations
    exercising fragmentation and coalescing across 10 simulation ticks.
    """
    return MemoryWorkloadPreset(
        id="preset-g-stress",
        name="Preset G: Dynamic Multi-Process Lifecycle",
        category="Comprehensive",
        description="Comprehensive 10-tick sequence of allocations, deallocations, and re-allocations.",
        recommended_algorithm="BEST_FIT",
        memory_size=1200,
        operations=[
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P1", size=150),
            MemoryOperation(tick=0, operation_type=MemoryOperationType.ALLOCATE, request_id="P2", size=250),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P3", size=200),
            MemoryOperation(tick=1, operation_type=MemoryOperationType.ALLOCATE, request_id="P4", size=300),
            MemoryOperation(tick=2, operation_type=MemoryOperationType.DEALLOCATE, request_id="P2"),
            MemoryOperation(tick=3, operation_type=MemoryOperationType.ALLOCATE, request_id="P5", size=100),
            MemoryOperation(tick=4, operation_type=MemoryOperationType.DEALLOCATE, request_id="P3"),
            MemoryOperation(tick=5, operation_type=MemoryOperationType.ALLOCATE, request_id="P6", size=180),
            MemoryOperation(tick=6, operation_type=MemoryOperationType.DEALLOCATE, request_id="P1"),
            MemoryOperation(tick=6, operation_type=MemoryOperationType.DEALLOCATE, request_id="P5"),
            MemoryOperation(tick=7, operation_type=MemoryOperationType.ALLOCATE, request_id="P7", size=220),
            MemoryOperation(tick=8, operation_type=MemoryOperationType.DEALLOCATE, request_id="P4"),
            MemoryOperation(tick=9, operation_type=MemoryOperationType.ALLOCATE, request_id="P8", size=400),
        ],
    )


ALL_MEMORY_PRESETS: List[MemoryWorkloadPreset] = [
    get_preset_a_basic(),
    get_preset_b_first_vs_best(),
    get_preset_c_worst_fit(),
    get_preset_d_next_fit(),
    get_preset_e_external_fragmentation(),
    get_preset_f_coalescing(),
    get_preset_g_stress(),
]


def get_memory_preset_by_id(preset_id: str) -> MemoryWorkloadPreset:
    for p in ALL_MEMORY_PRESETS:
        if p.id == preset_id:
            return p
    raise KeyError(f"Memory preset '{preset_id}' not found.")
