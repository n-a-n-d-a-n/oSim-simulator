"""Standardized virtual memory simulation events."""

from enum import Enum
from typing import Dict, Any, Optional
from backend.sim_engine.core.event import SimulationEvent


class VirtualMemoryEventType(str, Enum):
    VIRTUAL_ADDRESS_REFERENCED = "VIRTUAL_ADDRESS_REFERENCED"
    PAGE_TABLE_LOOKUP = "PAGE_TABLE_LOOKUP"
    PAGE_HIT = "PAGE_HIT"
    PAGE_FAULT = "PAGE_FAULT"
    FREE_FRAME_SELECTED = "FREE_FRAME_SELECTED"
    PAGE_EVICTION_STARTED = "PAGE_EVICTION_STARTED"
    PAGE_EVICTED = "PAGE_EVICTED"
    PAGE_LOADED = "PAGE_LOADED"
    PAGE_TABLE_UPDATED = "PAGE_TABLE_UPDATED"
    ADDRESS_TRANSLATED = "ADDRESS_TRANSLATED"
    MEMORY_STATE_CHANGED = "MEMORY_STATE_CHANGED"


def create_vm_event(
    tick: int,
    event_type: VirtualMemoryEventType,
    description: str,
    details: Optional[Dict[str, Any]] = None,
    event_id: Optional[str] = None,
) -> SimulationEvent:
    """Construct a standardized SimulationEvent for the virtual memory subsystem."""
    # Deterministic event ID based on tick and event type name
    generated_id = event_id or f"vm_evt_{tick}_{event_type.value.lower()}"
    return SimulationEvent(
        event_id=generated_id,
        tick=tick,
        event_type=event_type,
        component="VIRTUAL_MEMORY",
        description=description,
        details=details or {},
    )
