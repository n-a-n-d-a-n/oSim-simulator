"""Educational virtual memory benchmark presets."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from backend.sim_engine.virtual_memory.state import InputMode


@dataclass(frozen=True)
class VirtualMemoryPreset:
    """Definition of an educational virtual memory benchmark preset."""
    id: str
    name: str
    category: str
    description: str
    recommended_algorithm: str
    frame_count: int
    page_size: int
    virtual_page_count: int
    input_mode: InputMode
    raw_references: List[int]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "recommended_algorithm": self.recommended_algorithm,
            "frame_count": self.frame_count,
            "page_size": self.page_size,
            "virtual_page_count": self.virtual_page_count,
            "input_mode": self.input_mode.value,
            "raw_references": self.raw_references,
        }


PRESET_SILBERSCHATZ = VirtualMemoryPreset(
    id="vm-silberschatz-benchmark",
    name="Silberschatz Canonical Reference Trace",
    category="Textbook Baseline",
    description=(
        "Classic Silberschatz Operating System Concepts (Chapter 9) benchmark comparing "
        "FIFO (15 faults), LRU (12 faults), and Optimal (9 faults) on 3 physical frames."
    ),
    recommended_algorithm="LRU",
    frame_count=3,
    page_size=4096,
    virtual_page_count=16,
    input_mode=InputMode.PAGE_REFERENCE,
    raw_references=[7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
)

PRESET_BELADY = VirtualMemoryPreset(
    id="vm-belady-anomaly",
    name="Belady's Anomaly Demonstration",
    category="Anomaly Analysis",
    description=(
        "Demonstrates Belady's anomaly where increasing allocated frames from 3 to 4 "
        "actually increases page faults under FIFO (9 faults with 3 frames vs 10 faults with 4 frames)."
    ),
    recommended_algorithm="FIFO",
    frame_count=3,
    page_size=4096,
    virtual_page_count=16,
    input_mode=InputMode.PAGE_REFERENCE,
    raw_references=[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
)

PRESET_CLOCK = VirtualMemoryPreset(
    id="vm-clock-second-chance",
    name="Second-Chance (Clock) Circular Scan",
    category="Hardware Approximation",
    description=(
        "Demonstrates reference bit clearing and second-chance survival during circular Clock hand revolutions."
    ),
    recommended_algorithm="CLOCK",
    frame_count=3,
    page_size=4096,
    virtual_page_count=16,
    input_mode=InputMode.PAGE_REFERENCE,
    raw_references=[0, 1, 2, 3, 0, 1, 4, 0, 1, 2, 3, 4],
)

PRESET_LOCALITY = VirtualMemoryPreset(
    id="vm-locality-phases",
    name="Temporal & Spatial Locality Shifts",
    category="Locality of Reference",
    description=(
        "Simulates program execution with strong temporal locality shifting from initial loop working set "
        "[0, 1, 2] to subroutine working set [8, 9, 10]."
    ),
    recommended_algorithm="LRU",
    frame_count=4,
    page_size=4096,
    virtual_page_count=16,
    input_mode=InputMode.PAGE_REFERENCE,
    raw_references=[0, 1, 0, 1, 2, 1, 0, 2, 8, 9, 8, 9, 10, 8, 9, 0, 1, 2],
)

PRESET_THRASHING = VirtualMemoryPreset(
    id="vm-thrashing-loop",
    name="Working Set Thrashing Pattern",
    category="Pathological Behavior",
    description=(
        "Cyclic reference sequence whose working set strictly exceeds physical frame capacity, "
        "inducing near 100% page fault rate."
    ),
    recommended_algorithm="FIFO",
    frame_count=3,
    page_size=4096,
    virtual_page_count=16,
    input_mode=InputMode.PAGE_REFERENCE,
    raw_references=[0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1, 2, 3, 4],
)

PRESET_ADDRESS_MODE = VirtualMemoryPreset(
    id="vm-virtual-address-translation",
    name="Byte Virtual Address Translation Mode",
    category="Address Translation",
    description=(
        "Real byte virtual address stream decomposing hexadecimal and decimal addresses into page numbers and offsets."
    ),
    recommended_algorithm="LRU",
    frame_count=4,
    page_size=4096,
    virtual_page_count=16,
    input_mode=InputMode.VIRTUAL_ADDRESS,
    raw_references=[0, 4096, 8192, 12, 5000, 4100, 16384, 8200, 20480, 50],
)

ALL_VM_PRESETS: List[VirtualMemoryPreset] = [
    PRESET_SILBERSCHATZ,
    PRESET_BELADY,
    PRESET_CLOCK,
    PRESET_LOCALITY,
    PRESET_THRASHING,
    PRESET_ADDRESS_MODE,
]

_VM_PRESET_MAP: Dict[str, VirtualMemoryPreset] = {p.id: p for p in ALL_VM_PRESETS}


def get_vm_preset_by_id(preset_id: str) -> VirtualMemoryPreset:
    """Lookup virtual memory preset by unique id."""
    if preset_id not in _VM_PRESET_MAP:
        raise KeyError(f"Virtual memory preset '{preset_id}' not found.")
    return _VM_PRESET_MAP[preset_id]
