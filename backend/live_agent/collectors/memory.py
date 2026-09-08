"""Host memory collector implementation using psutil."""

import time
import psutil

from backend.live_agent.models import MemoryObservation
from backend.live_agent.collectors.base import MemoryCollector, CollectorError


class PsutilMemoryCollector(MemoryCollector):
    """Real system memory collector using psutil."""

    def collect_memory(self) -> MemoryObservation:
        try:
            ts = time.time()
            vm = psutil.virtual_memory()

            return MemoryObservation(
                total_bytes=int(vm.total),
                used_bytes=int(vm.used),
                available_bytes=int(vm.available),
                percent_used=float(vm.percent),
                timestamp=ts,
            )
        except Exception as exc:
            raise CollectorError("MemoryCollector", f"Failed to collect memory observation: {exc}", exc) from exc
