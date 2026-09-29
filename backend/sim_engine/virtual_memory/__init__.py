"""Virtual Memory and Page Replacement simulation subsystem for OSim."""

from backend.sim_engine.virtual_memory.address import (
    VirtualAddress,
    PhysicalAddress,
    decompose_virtual_address,
    compute_physical_address,
    is_power_of_two,
    validate_address_parameters,
)
from backend.sim_engine.virtual_memory.page_table import (
    PageTableEntry,
    SingleLevelPageTable,
)
from backend.sim_engine.virtual_memory.frame import (
    PhysicalFrame,
    PhysicalMemoryPool,
)
from backend.sim_engine.virtual_memory.state import (
    InputMode,
    MemoryReference,
    PageTableEntrySnapshot,
    FrameSnapshot,
    ReplacementDecision,
    VirtualMemoryMetricsSnapshot,
    VirtualMemorySnapshot,
)
from backend.sim_engine.virtual_memory.event import (
    VirtualMemoryEventType,
    create_vm_event,
)
from backend.sim_engine.virtual_memory.metrics import compute_vm_metrics
from backend.sim_engine.virtual_memory.presets import (
    VirtualMemoryPreset,
    ALL_VM_PRESETS,
    get_vm_preset_by_id,
)
from backend.sim_engine.virtual_memory.replacement import (
    BasePageReplacementAlgorithm,
    FIFOReplacement,
    LRUReplacement,
    OptimalReplacement,
    ClockReplacement,
    get_replacement_algorithm,
)
from backend.sim_engine.virtual_memory.engine import (
    VirtualMemorySimulationEngine,
    VirtualMemorySimulationResult,
)

__all__ = [
    "VirtualAddress",
    "PhysicalAddress",
    "decompose_virtual_address",
    "compute_physical_address",
    "is_power_of_two",
    "validate_address_parameters",
    "PageTableEntry",
    "SingleLevelPageTable",
    "PhysicalFrame",
    "PhysicalMemoryPool",
    "InputMode",
    "MemoryReference",
    "PageTableEntrySnapshot",
    "FrameSnapshot",
    "ReplacementDecision",
    "VirtualMemoryMetricsSnapshot",
    "VirtualMemorySnapshot",
    "VirtualMemoryEventType",
    "create_vm_event",
    "compute_vm_metrics",
    "VirtualMemoryPreset",
    "ALL_VM_PRESETS",
    "get_vm_preset_by_id",
    "BasePageReplacementAlgorithm",
    "FIFOReplacement",
    "LRUReplacement",
    "OptimalReplacement",
    "ClockReplacement",
    "get_replacement_algorithm",
    "VirtualMemorySimulationEngine",
    "VirtualMemorySimulationResult",
]
