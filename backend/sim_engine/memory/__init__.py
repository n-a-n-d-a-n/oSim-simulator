"""OSim Memory Simulation Subsystem (Phase 3)."""

from backend.sim_engine.memory.block import MemoryBlock, MemoryBlockSnapshot
from backend.sim_engine.memory.allocator import (
    BaseAllocator,
    AllocationOutcome,
    DeallocationOutcome,
)
from backend.sim_engine.memory.first_fit import FirstFitAllocator
from backend.sim_engine.memory.best_fit import BestFitAllocator
from backend.sim_engine.memory.worst_fit import WorstFitAllocator
from backend.sim_engine.memory.next_fit import NextFitAllocator
from backend.sim_engine.memory.metrics import MemoryMetricsSnapshot, compute_memory_metrics
from backend.sim_engine.memory.state import (
    MemoryOperation,
    MemoryOperationType,
    MemoryStateSnapshot,
    OperationResultSnapshot,
)
from backend.sim_engine.memory.engine import MemorySimulationEngine, MemorySimulationResult
from backend.sim_engine.memory.presets import (
    MemoryWorkloadPreset,
    ALL_MEMORY_PRESETS,
    get_memory_preset_by_id,
)

__all__ = [
    "MemoryBlock",
    "MemoryBlockSnapshot",
    "BaseAllocator",
    "AllocationOutcome",
    "DeallocationOutcome",
    "FirstFitAllocator",
    "BestFitAllocator",
    "WorstFitAllocator",
    "NextFitAllocator",
    "MemoryMetricsSnapshot",
    "compute_memory_metrics",
    "MemoryOperation",
    "MemoryOperationType",
    "MemoryStateSnapshot",
    "OperationResultSnapshot",
    "MemorySimulationEngine",
    "MemorySimulationResult",
    "MemoryWorkloadPreset",
    "ALL_MEMORY_PRESETS",
    "get_memory_preset_by_id",
]
