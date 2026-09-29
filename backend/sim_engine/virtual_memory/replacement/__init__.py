"""Page replacement strategy registry and factory."""

from backend.sim_engine.virtual_memory.replacement.base import BasePageReplacementAlgorithm
from backend.sim_engine.virtual_memory.replacement.fifo import FIFOReplacement
from backend.sim_engine.virtual_memory.replacement.lru import LRUReplacement
from backend.sim_engine.virtual_memory.replacement.optimal import OptimalReplacement
from backend.sim_engine.virtual_memory.replacement.clock import ClockReplacement


def get_replacement_algorithm(name: str) -> BasePageReplacementAlgorithm:
    """Factory helper to instantiate page replacement strategy by name."""
    normalized = name.strip().upper()
    if normalized == "FIFO":
        return FIFOReplacement()
    elif normalized == "LRU":
        return LRUReplacement()
    elif normalized in ("OPTIMAL", "OPT"):
        return OptimalReplacement()
    elif normalized in ("CLOCK", "SECOND_CHANCE"):
        return ClockReplacement()
    else:
        raise ValueError(
            f"Unsupported page replacement algorithm '{name}'. "
            f"Supported algorithms: FIFO, LRU, OPTIMAL, CLOCK."
        )


__all__ = [
    "BasePageReplacementAlgorithm",
    "FIFOReplacement",
    "LRUReplacement",
    "OptimalReplacement",
    "ClockReplacement",
    "get_replacement_algorithm",
]
