"""Educational preset workloads for Deadlock Detection and Banker's Algorithm."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from backend.sim_engine.deadlock.models import ResourceSystem


@dataclass(frozen=True)
class DeadlockPreset:
    """Pre-configured educational benchmark scenario for Phase 5."""
    id: str
    name: str
    category: str  # "BANKER_AVOIDANCE" | "DEADLOCK_DETECTION"
    description: str
    system: ResourceSystem
    default_request_process_id: Optional[str] = None
    default_request_vector: Optional[List[int]] = None
    expected_is_safe: Optional[bool] = None
    expected_safe_sequence: Optional[List[str]] = None
    expected_is_deadlocked: Optional[bool] = None
    expected_deadlocked_processes: Optional[List[str]] = None
    pedagogical_notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "processes": [p.id for p in self.system.processes],
            "resource_types": [r.id for r in self.system.resource_types],
            "total": list(self.system.total),
            "available": list(self.system.available),
            "allocation": [list(r) for r in self.system.allocation],
            "maximum": [list(r) for r in self.system.maximum],
            "need": [list(r) for r in self.system.need],
            "request": [list(r) for r in self.system.request],
            "default_request_process_id": self.default_request_process_id,
            "default_request_vector": self.default_request_vector,
            "expected_is_safe": self.expected_is_safe,
            "expected_safe_sequence": self.expected_safe_sequence,
            "expected_is_deadlocked": self.expected_is_deadlocked,
            "expected_deadlocked_processes": self.expected_deadlocked_processes,
            "pedagogical_notes": self.pedagogical_notes,
        }


# Preset 1: Silberschatz Chapter 7 Classic Banker Safe State
PRESET_1_CLASSIC_BANKER = DeadlockPreset(
    id="silberschatz_banker_safe",
    name="Silberschatz Ch. 7 Classic Safe State",
    category="BANKER_AVOIDANCE",
    description="Standard 5-process, 3-resource benchmark from Silberschatz Chapter 7.5 proving system safety.",
    system=ResourceSystem.create(
        processes=["P0", "P1", "P2", "P3", "P4"],
        resource_types=["A", "B", "C"],
        total=[10, 5, 7],
        available=[3, 3, 2],
        allocation=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ],
        maximum=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ],
    ),
    expected_is_safe=True,
    expected_safe_sequence=["P1", "P3", "P0", "P2", "P4"],
    pedagogical_notes=(
        "With Available (3, 3, 2), P1's Need (1, 2, 2) <= Available. "
        "Upon P1 finishing and releasing, Work expands to allow P3, P0, P2, and P4 to complete deterministically."
    ),
)

# Preset 2: Silberschatz Ch. 7 Resource Request Granted
PRESET_2_REQUEST_GRANTED = DeadlockPreset(
    id="silberschatz_request_granted",
    name="Resource Request: Granted (P1 [1, 0, 2])",
    category="BANKER_AVOIDANCE",
    description="Process P1 requests (1, 0, 2). The request is tentatively allocated and verified safe, leading to GRANT.",
    system=ResourceSystem.create(
        processes=["P0", "P1", "P2", "P3", "P4"],
        resource_types=["A", "B", "C"],
        total=[10, 5, 7],
        available=[3, 3, 2],
        allocation=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ],
        maximum=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ],
    ),
    default_request_process_id="P1",
    default_request_vector=[1, 0, 2],
    expected_is_safe=True,
    expected_safe_sequence=["P1", "P3", "P0", "P2", "P4"],
    pedagogical_notes=(
        "P1 requests (1, 0, 2) <= Need (1, 2, 2) and <= Available (3, 3, 2). "
        "Tentative Available becomes (2, 3, 0). The safety algorithm finds safe sequence P1 -> P3 -> P0 -> P2 -> P4; request is granted."
    ),
)

# Preset 3: Silberschatz Ch. 7 Resource Request Denied / Rollback
PRESET_3_REQUEST_DENIED = DeadlockPreset(
    id="silberschatz_request_denied",
    name="Resource Request: Denied (P0 [0, 2, 0])",
    category="BANKER_AVOIDANCE",
    description="Starting from state where P1 already holds (3, 0, 2), P0 requests (0, 2, 0). Leaves system unsafe; DENIED & rolled back.",
    system=ResourceSystem.create(
        processes=["P0", "P1", "P2", "P3", "P4"],
        resource_types=["A", "B", "C"],
        total=[10, 5, 7],
        available=[2, 3, 0],
        allocation=[
            [0, 1, 0],
            [3, 0, 2],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2],
        ],
        maximum=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3],
        ],
    ),
    default_request_process_id="P0",
    default_request_vector=[0, 2, 0],
    expected_is_safe=False,
    pedagogical_notes=(
        "P0 requests (0, 2, 0) <= Need (7, 4, 3) and <= Available (2, 3, 0). "
        "Tentative Available becomes (2, 1, 0). No process's Need can now be satisfied. "
        "System is UNSAFE; request is DENIED and state is rolled back cleanly."
    ),
)

# Preset 4: Single-Instance Deadlock Cycle
PRESET_4_SINGLE_INSTANCE_DEADLOCK = DeadlockPreset(
    id="single_instance_deadlock_cycle",
    name="Single-Instance Deadlock: 4-Node Cycle",
    category="DEADLOCK_DETECTION",
    description="4 processes and 4 single-instance resources forming a classic circular wait P0 -> P1 -> P2 -> P3 -> P0.",
    system=ResourceSystem.create(
        processes=["P0", "P1", "P2", "P3"],
        resource_types=["R0", "R1", "R2", "R3"],
        total=[1, 1, 1, 1],
        available=[0, 0, 0, 0],
        allocation=[
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
        request=[
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
            [1, 0, 0, 0],
        ],
    ),
    expected_is_deadlocked=True,
    expected_deadlocked_processes=["P0", "P1", "P2", "P3"],
    pedagogical_notes=(
        "In a single-instance resource system, a cycle in the Wait-For Graph is a necessary and sufficient condition for deadlock. "
        "Cycle: P0 -> P1 -> P2 -> P3 -> P0. All 4 processes are deadlocked."
    ),
)

# Preset 5: Multi-Instance Cycle but NO Deadlock (Counterexample)
PRESET_5_MULTI_INSTANCE_NO_DEADLOCK = DeadlockPreset(
    id="multi_instance_cycle_no_deadlock",
    name="Multi-Instance Cycle with NO Deadlock",
    category="DEADLOCK_DETECTION",
    description="Textbook counterexample: RAG contains a directed cycle, but multi-instance reduction proves NO deadlock.",
    system=ResourceSystem.create(
        processes=["P0", "P1", "P2"],
        resource_types=["R0", "R1"],
        total=[2, 2],
        available=[1, 0],
        allocation=[
            [1, 0],
            [0, 1],
            [0, 1],
        ],
        request=[
            [0, 1],
            [1, 0],
            [0, 0],
        ],
    ),
    expected_is_deadlocked=False,
    expected_deadlocked_processes=[],
    pedagogical_notes=(
        "A cycle P0 -> R1 -> P1 -> R0 -> P0 exists in the RAG. "
        "However, P2 holds an instance of R1 with zero outstanding requests. P2 finishes and releases its instance into Work, "
        "allowing P0 and then P1 to finish. Multi-instance reduction proves NO DEADLOCK. Demonstrates cycle != deadlock."
    ),
)

# Preset 6: Multi-Instance Genuine Deadlock
PRESET_6_MULTI_INSTANCE_DEADLOCK = DeadlockPreset(
    id="multi_instance_genuine_deadlock",
    name="Multi-Instance Genuine Deadlock",
    category="DEADLOCK_DETECTION",
    description="Silberschatz Chapter 7.6.2 benchmark: 5 processes, 3 resource types, where reduction fails for 4 processes.",
    system=ResourceSystem.create(
        processes=["P0", "P1", "P2", "P3", "P4"],
        resource_types=["A", "B", "C"],
        total=[7, 2, 6],
        available=[0, 0, 0],
        allocation=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 3],
            [2, 1, 1],
            [0, 0, 2],
        ],
        request=[
            [0, 0, 0],
            [2, 0, 2],
            [0, 0, 1],
            [1, 0, 0],
            [0, 0, 2],
        ],
    ),
    expected_is_deadlocked=True,
    expected_deadlocked_processes=["P1", "P2", "P3", "P4"],
    pedagogical_notes=(
        "Only P0 (with Request [0, 0, 0]) can be reduced. P0 releases its allocation [0, 1, 0] into Work. "
        "Remaining processes all require instances of A or C (0 available). "
        "Matrix reduction terminates with P1, P2, P3, and P4 unreduced. Exactly these 4 processes are deadlocked."
    ),
)

DEADLOCK_PRESETS: List[DeadlockPreset] = [
    PRESET_1_CLASSIC_BANKER,
    PRESET_2_REQUEST_GRANTED,
    PRESET_3_REQUEST_DENIED,
    PRESET_4_SINGLE_INSTANCE_DEADLOCK,
    PRESET_5_MULTI_INSTANCE_NO_DEADLOCK,
    PRESET_6_MULTI_INSTANCE_DEADLOCK,
]

DEADLOCK_PRESETS_MAP: Dict[str, DeadlockPreset] = {p.id: p for p in DEADLOCK_PRESETS}


def get_deadlock_preset_by_id(preset_id: str) -> DeadlockPreset:
    """Retrieve a deadlock preset by its identifier or raise KeyError."""
    if preset_id not in DEADLOCK_PRESETS_MAP:
        raise KeyError(f"Deadlock preset '{preset_id}' not found.")
    return DEADLOCK_PRESETS_MAP[preset_id]
