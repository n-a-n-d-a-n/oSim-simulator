"""Educational metrics calculation for virtual memory and page replacement."""

from backend.sim_engine.virtual_memory.state import VirtualMemoryMetricsSnapshot


def compute_vm_metrics(
    total_references: int,
    page_hits: int,
    page_faults: int,
    replacements: int,
    evictions: int,
    free_frames: int,
    resident_pages: int,
    decimal_places: int = 4,
) -> VirtualMemoryMetricsSnapshot:
    """Compute cumulative metrics safely, handling zero-reference boundary conditions."""
    if total_references > 0:
        hit_ratio = round(page_hits / total_references, decimal_places)
        fault_ratio = round(page_faults / total_references, decimal_places)
    else:
        hit_ratio = 0.0
        fault_ratio = 0.0

    return VirtualMemoryMetricsSnapshot(
        total_references=total_references,
        page_hits=page_hits,
        page_faults=page_faults,
        hit_ratio=hit_ratio,
        fault_ratio=fault_ratio,
        total_translations=total_references,
        replacements=replacements,
        evictions=evictions,
        free_frames=free_frames,
        resident_pages=resident_pages,
    )
