"""Discrete simulation clock."""


class SimulationClock:
    """Monotonically advancing discrete-time clock."""

    def __init__(self, initial_tick: int = 0):
        if initial_tick < 0:
            raise ValueError(f"Initial tick must be >= 0, got {initial_tick}")
        self._current_tick = initial_tick

    @property
    def current_tick(self) -> int:
        return self._current_tick

    def advance(self, delta: int = 1) -> int:
        if delta <= 0:
            raise ValueError(f"Advance delta must be positive, got {delta}")
        self._current_tick += delta
        return self._current_tick

    def reset(self, tick: int = 0):
        if tick < 0:
            raise ValueError(f"Reset tick must be >= 0, got {tick}")
        self._current_tick = tick
