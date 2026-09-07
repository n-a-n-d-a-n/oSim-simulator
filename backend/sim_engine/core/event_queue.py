"""Deterministic priority event queue for scheduled discrete events."""

import heapq
from dataclasses import dataclass, field
from typing import Any, List, Optional, Tuple


@dataclass(order=True)
class ScheduledEvent:
    tick: int
    priority: int  # Lower number = higher priority
    insertion_order: int
    event_type: str = field(compare=False)
    payload: Any = field(compare=False)


class EventQueue:
    """Deterministic priority event queue ordered by tick, event priority, and insertion order."""

    def __init__(self):
        self._heap: List[ScheduledEvent] = []
        self._counter: int = 0

    def push(self, tick: int, event_type: str, payload: Any, priority: int = 0) -> None:
        """Schedule an event at a given tick."""
        self._counter += 1
        item = ScheduledEvent(
            tick=tick,
            priority=priority,
            insertion_order=self._counter,
            event_type=event_type,
            payload=payload
        )
        heapq.heappush(self._heap, item)

    def peek_next_tick(self) -> Optional[int]:
        """Return the tick of the earliest scheduled event, or None if empty."""
        if not self._heap:
            return None
        return self._heap[0].tick

    def pop_events_for_tick(self, tick: int) -> List[Tuple[str, Any]]:
        """Pop and return all events scheduled at or before the given tick."""
        events: List[Tuple[str, Any]] = []
        while self._heap and self._heap[0].tick <= tick:
            item = heapq.heappop(self._heap)
            events.append((item.event_type, item.payload))
        return events

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)
