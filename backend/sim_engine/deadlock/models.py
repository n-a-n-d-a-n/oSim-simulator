"""Domain models and mathematical invariants for resource allocation, deadlock detection, and Banker's algorithm."""

from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict, Any


class DomainValidationError(ValueError):
    """Raised when resource system dimensions or mathematical invariants are violated."""
    pass


@dataclass(frozen=True)
class Process:
    """A process participating in resource allocation or deadlock contention."""
    id: str
    name: Optional[str] = None
    index: int = 0


@dataclass(frozen=True)
class ResourceType:
    """A distinct resource type with a defined total instance capacity."""
    id: str
    total_instances: int
    name: Optional[str] = None
    index: int = 0

    def __post_init__(self):
        if self.total_instances <= 0:
            raise DomainValidationError(
                f"Resource '{self.id}' total instances must be positive (> 0), got {self.total_instances}."
            )


@dataclass(frozen=True)
class ResourceSystem:
    """Immutable domain representation of a multi-resource, multi-process allocation system.
    
    Attributes:
        processes: Tuple of Process objects (length n)
        resource_types: Tuple of ResourceType objects (length m)
        total: Vector E of total instances [E0, E1, ... Em-1]
        available: Vector A of currently free instances [A0, A1, ... Am-1]
        allocation: Matrix Alloc (n x m) of instances currently held by Pi
        maximum: Matrix Max (n x m) of maximum instances Pi may declare
        need: Matrix Need (n x m) where Need[i][j] = Max[i][j] - Alloc[i][j]
        request: Optional Matrix Req (n x m) representing outstanding blocked requests
    """
    processes: Tuple[Process, ...]
    resource_types: Tuple[ResourceType, ...]
    total: Tuple[int, ...]
    available: Tuple[int, ...]
    allocation: Tuple[Tuple[int, ...], ...]
    maximum: Tuple[Tuple[int, ...], ...]
    need: Tuple[Tuple[int, ...], ...]
    request: Tuple[Tuple[int, ...], ...]

    @classmethod
    def create(
        cls,
        processes: List[str],
        resource_types: List[str],
        total: List[int],
        available: List[int],
        allocation: List[List[int]],
        maximum: Optional[List[List[int]]] = None,
        request: Optional[List[List[int]]] = None,
        explicit_need: Optional[List[List[int]]] = None,
    ) -> "ResourceSystem":

        """Factory validating all mathematical invariants and constructing an immutable ResourceSystem."""
        n = len(processes)
        m = len(resource_types)

        if n == 0:
            raise DomainValidationError("At least one process must be defined in the system.")
        if m == 0:
            raise DomainValidationError("At least one resource type must be defined in the system.")

        if len(total) != m:
            raise DomainValidationError(f"Total vector length ({len(total)}) must match resource type count ({m}).")
        for j, t in enumerate(total):
            if t <= 0:
                raise DomainValidationError(f"Resource '{resource_types[j]}' total instances must be > 0, got {t}.")

        if len(available) != m:
            raise DomainValidationError(f"Available vector length ({len(available)}) must match resource type count ({m}).")
        for j, a in enumerate(available):
            if a < 0:
                raise DomainValidationError(f"Available instances for resource '{resource_types[j]}' cannot be negative ({a}).")

        if len(allocation) != n:
            raise DomainValidationError(f"Allocation matrix row count ({len(allocation)}) must match process count ({n}).")
        for i, row in enumerate(allocation):
            if len(row) != m:
                raise DomainValidationError(f"Allocation row {i} length ({len(row)}) must match resource count ({m}).")
            for j, val in enumerate(row):
                if val < 0:
                    raise DomainValidationError(f"Allocation[{processes[i]}][{resource_types[j]}] cannot be negative ({val}).")

        # Invariant: Conservation of instances (sum(Alloc[i][j]) + Available[j] == Total[j])
        for j in range(m):
            alloc_sum = sum(allocation[i][j] for i in range(n))
            if alloc_sum + available[j] != total[j]:
                raise DomainValidationError(
                    f"Conservation violation for resource '{resource_types[j]}': "
                    f"Allocated sum ({alloc_sum}) + Available ({available[j]}) != Total ({total[j]})."
                )

        # Handle Maximum and compute Need
        computed_max: List[List[int]]
        computed_need: List[List[int]]

        if maximum is not None:
            if len(maximum) != n:
                raise DomainValidationError(f"Maximum matrix row count ({len(maximum)}) must match process count ({n}).")
            computed_max = []
            computed_need = []
            for i, row in enumerate(maximum):
                if len(row) != m:
                    raise DomainValidationError(f"Maximum row {i} length ({len(row)}) must match resource count ({m}).")
                max_row = []
                need_row = []
                for j, val in enumerate(row):
                    if val < 0:
                        raise DomainValidationError(f"Maximum[{processes[i]}][{resource_types[j]}] cannot be negative ({val}).")
                    if allocation[i][j] > val:
                        raise DomainValidationError(
                            f"Claim violation: Allocation[{processes[i]}][{resource_types[j]}] ({allocation[i][j]}) "
                            f"exceeds Maximum ({val})."
                        )
                    need_val = val - allocation[i][j]
                    max_row.append(val)
                    need_row.append(need_val)
                computed_max.append(max_row)
                computed_need.append(need_row)

            # Validate explicit need if supplied
            if explicit_need is not None:
                if len(explicit_need) != n:
                    raise DomainValidationError(f"Explicit Need row count ({len(explicit_need)}) != process count ({n}).")
                for i in range(n):
                    if len(explicit_need[i]) != m:
                        raise DomainValidationError(f"Explicit Need row {i} length ({len(explicit_need[i])}) != resource count ({m}).")
                    for j in range(m):
                        if explicit_need[i][j] != computed_need[i][j]:
                            raise DomainValidationError(
                                f"Inconsistent Need provided at [{processes[i]}][{resource_types[j]}]: "
                                f"provided {explicit_need[i][j]} != computed (Max {computed_max[i][j]} - Alloc {allocation[i][j]} = {computed_need[i][j]})."
                            )
        else:
            # When maximum is omitted (e.g. pure detection problem with request matrix only)
            computed_max = [[allocation[i][j] for j in range(m)] for i in range(n)]
            computed_need = [[0 for _ in range(m)] for _ in range(n)]

        # Handle Request matrix
        computed_request: List[List[int]]
        if request is not None:
            if len(request) != n:
                raise DomainValidationError(f"Request matrix row count ({len(request)}) must match process count ({n}).")
            computed_request = []
            for i, row in enumerate(request):
                if len(row) != m:
                    raise DomainValidationError(f"Request row {i} length ({len(row)}) must match resource count ({m}).")
                req_row = []
                for j, val in enumerate(row):
                    if val < 0:
                        raise DomainValidationError(f"Request[{processes[i]}][{resource_types[j]}] cannot be negative ({val}).")
                    req_row.append(val)
                computed_request.append(req_row)
        else:
            # Default request matrix is all zeros
            computed_request = [[0 for _ in range(m)] for _ in range(n)]

        proc_objs = tuple(Process(id=p_id, index=idx) for idx, p_id in enumerate(processes))
        res_objs = tuple(ResourceType(id=r_id, total_instances=total[idx], index=idx) for idx, r_id in enumerate(resource_types))

        return cls(
            processes=proc_objs,
            resource_types=res_objs,
            total=tuple(total),
            available=tuple(available),
            allocation=tuple(tuple(r) for r in allocation),
            maximum=tuple(tuple(r) for r in computed_max),
            need=tuple(tuple(r) for r in computed_need),
            request=tuple(tuple(r) for r in computed_request),
        )

    @property
    def process_count(self) -> int:
        return len(self.processes)

    @property
    def resource_count(self) -> int:
        return len(self.resource_types)

    @property
    def is_single_instance_system(self) -> bool:
        """Returns True if every resource type has strictly 1 total instance."""
        return all(t == 1 for t in self.total)

    def get_process_index(self, process_id: str) -> int:
        for p in self.processes:
            if p.id == process_id:
                return p.index
        raise DomainValidationError(f"Process ID '{process_id}' not found in system.")

    def get_resource_index(self, resource_id: str) -> int:
        for r in self.resource_types:
            if r.id == resource_id:
                return r.index
        raise DomainValidationError(f"Resource ID '{resource_id}' not found in system.")

ResourceSystem.from_vectors = ResourceSystem.create

