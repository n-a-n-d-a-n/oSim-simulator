"""Memory state models representing immutable snapshots of discrete-time memory simulation."""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Dict, Any
from backend.sim_engine.memory.block import MemoryBlockSnapshot
from backend.sim_engine.memory.metrics import MemoryMetricsSnapshot


class MemoryOperationType(str, Enum):
    ALLOCATE = "ALLOCATE"
    DEALLOCATE = "DEALLOCATE"


@dataclass(frozen=True)
class MemoryOperation:
    """A scheduled memory operation requested at a specific discrete simulation tick."""
    tick: int
    operation_type: MemoryOperationType
    request_id: str
    size: Optional[int] = None  # Required for ALLOCATE, None for DEALLOCATE

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tick": self.tick,
            "operation_type": self.operation_type.value,
            "request_id": self.request_id,
            "size": self.size,
        }


@dataclass(frozen=True)
class OperationResultSnapshot:
    """Immutable record of the outcome of a memory operation."""
    tick: int
    operation_type: str
    request_id: str
    size: Optional[int]
    success: bool
    allocated_start_address: Optional[int] = None
    allocated_size: Optional[int] = None
    reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tick": self.tick,
            "operation_type": self.operation_type,
            "request_id": self.request_id,
            "size": self.size,
            "success": self.success,
            "allocated_start_address": self.allocated_start_address,
            "allocated_size": self.allocated_size,
            "reason": self.reason,
        }


@dataclass(frozen=True)
class MemoryStateSnapshot:
    """Central immutable snapshot of the entire contiguous memory space at a specific tick."""
    tick: int
    total_memory: int
    blocks: List[MemoryBlockSnapshot]
    next_fit_cursor: int  # Integer memory address where Next Fit search begins
    metrics: MemoryMetricsSnapshot
    last_operation_result: Optional[OperationResultSnapshot] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tick": self.tick,
            "total_memory": self.total_memory,
            "blocks": [b.to_dict() for b in self.blocks],
            "next_fit_cursor": self.next_fit_cursor,
            "metrics": self.metrics.to_dict(),
            "last_operation_result": (
                self.last_operation_result.to_dict() if self.last_operation_result else None
            ),
        }
