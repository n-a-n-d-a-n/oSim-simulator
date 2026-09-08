"""Abstract collector contracts and exceptions for the OSim Live Agent subsystem."""

from abc import ABC, abstractmethod
from typing import Tuple
from backend.live_agent.models import (
    ProcessObservation,
    CPUObservation,
    MemoryObservation,
)


class CollectorError(Exception):
    """Raised when a system observation collector fails fundamentally to gather metrics."""
    def __init__(self, collector_name: str, message: str, original_exception: Exception = None):
        super().__init__(f"[{collector_name}] {message}")
        self.collector_name = collector_name
        self.message = message
        self.original_exception = original_exception


class ProcessCollector(ABC):
    """Contract for enumerating active processes on the host operating system."""

    @abstractmethod
    def collect_processes(self) -> Tuple[ProcessObservation, ...]:
        """Collect and return a tuple of active process observations.
        
        Individual terminated or inaccessible processes should be skipped gracefully.
        Systemic collection failures must raise CollectorError.
        """
        pass


class CPUCollector(ABC):
    """Contract for capturing host CPU utilization and core metrics."""

    @abstractmethod
    def collect_cpu(self) -> CPUObservation:
        """Capture and return real host CPU utilization.
        
        Must handle sampling intervals honestly without fabricating values.
        Systemic failures must raise CollectorError.
        """
        pass


class MemoryCollector(ABC):
    """Contract for capturing host physical and virtual memory utilization."""

    @abstractmethod
    def collect_memory(self) -> MemoryObservation:
        """Capture and return real host memory statistics.
        
        Systemic failures must raise CollectorError.
        """
        pass
