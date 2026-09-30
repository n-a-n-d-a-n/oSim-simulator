"""Resource Allocation Graph (RAG) and Wait-For Graph (WFG) modeling with deterministic cycle detection."""

from dataclasses import dataclass
from typing import List, Dict, Any, Set, Tuple, Optional
from backend.sim_engine.deadlock.models import ResourceSystem


@dataclass(frozen=True)
class GraphNode:
    id: str
    label: str
    node_type: str  # "PROCESS" or "RESOURCE"
    capacity: Optional[int] = None
    available: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "node_type": self.node_type,
            "capacity": self.capacity,
            "available": self.available,
        }


@dataclass(frozen=True)
class GraphEdge:
    source: str
    target: str
    edge_type: str  # "REQUEST" (P -> R or P -> P in WFG) or "ASSIGNMENT" (R -> P)
    weight: int = 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "target": self.target,
            "edge_type": self.edge_type,
            "weight": self.weight,
        }


@dataclass(frozen=True)
class GraphSnapshot:
    nodes: Tuple[GraphNode, ...]
    edges: Tuple[GraphEdge, ...]
    has_cycle: bool
    cycles: Tuple[Tuple[str, ...], ...]
    is_wfg: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "has_cycle": self.has_cycle,
            "cycles": [list(c) for c in self.cycles],
            "is_wfg": self.is_wfg,
        }


class GraphAnalyzer:
    """Constructs RAG and WFG graphs from ResourceSystem state and executes deterministic cycle detection."""

    @staticmethod
    def build_rag(system: ResourceSystem) -> GraphSnapshot:
        """Builds a bipartite Resource Allocation Graph (Processes and Resources)."""
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # Process nodes
        for p in system.processes:
            nodes.append(GraphNode(id=p.id, label=p.id, node_type="PROCESS"))

        # Resource nodes
        for r in system.resource_types:
            nodes.append(
                GraphNode(
                    id=r.id,
                    label=f"{r.id} ({system.available[r.index]}/{r.total_instances})",
                    node_type="RESOURCE",
                    capacity=r.total_instances,
                    available=system.available[r.index],
                )
            )

        # Assignment edges: Resource -> Process
        for i, p in enumerate(system.processes):
            for j, r in enumerate(system.resource_types):
                alloc_val = system.allocation[i][j]
                if alloc_val > 0:
                    edges.append(
                        GraphEdge(
                            source=r.id,
                            target=p.id,
                            edge_type="ASSIGNMENT",
                            weight=alloc_val,
                        )
                    )

        # Request edges: Process -> Resource
        for i, p in enumerate(system.processes):
            for j, r in enumerate(system.resource_types):
                req_val = system.request[i][j]
                if req_val > 0:
                    edges.append(
                        GraphEdge(
                            source=p.id,
                            target=r.id,
                            edge_type="REQUEST",
                            weight=req_val,
                        )
                    )

        # Detect cycles in the bipartite RAG
        has_cycle, cycles = GraphAnalyzer.find_cycles(
            [n.id for n in nodes],
            [(e.source, e.target) for e in edges],
        )

        return GraphSnapshot(
            nodes=tuple(nodes),
            edges=tuple(edges),
            has_cycle=has_cycle,
            cycles=tuple(tuple(c) for c in cycles),
            is_wfg=False,
        )

    @staticmethod
    def build_wfg(system: ResourceSystem) -> GraphSnapshot:
        """Constructs a Wait-For Graph (WFG) for single-instance resource relationships.
        
        Pi -> Pk if Pi is waiting for a single-instance resource held by Pk.
        """
        nodes: List[GraphNode] = [
            GraphNode(id=p.id, label=p.id, node_type="PROCESS") for p in system.processes
        ]
        edges: List[GraphEdge] = []

        # Find who holds single-instance resources
        holder_of_resource: Dict[int, int] = {}
        for j, r in enumerate(system.resource_types):
            if r.total_instances == 1:
                for i in range(system.process_count):
                    if system.allocation[i][j] > 0:
                        holder_of_resource[j] = i
                        break

        # If Pi requests Rj and Rj is held by Pk (with i != k), Pi -> Pk
        for i, p_req in enumerate(system.processes):
            for j, r in enumerate(system.resource_types):
                if r.total_instances == 1 and system.request[i][j] > 0:
                    holder_idx = holder_of_resource.get(j)
                    if holder_idx is not None and holder_idx != i:
                        p_holder = system.processes[holder_idx]
                        edges.append(
                            GraphEdge(
                                source=p_req.id,
                                target=p_holder.id,
                                edge_type="REQUEST",
                                weight=1,
                            )
                        )

        has_cycle, cycles = GraphAnalyzer.find_cycles(
            [n.id for n in nodes],
            [(e.source, e.target) for e in edges],
        )

        return GraphSnapshot(
            nodes=tuple(nodes),
            edges=tuple(edges),
            has_cycle=has_cycle,
            cycles=tuple(tuple(c) for c in cycles),
            is_wfg=True,
        )

    @staticmethod
    def find_cycles(
        node_ids: List[str],
        edges: List[Tuple[str, str]],
    ) -> Tuple[bool, List[List[str]]]:
        """Deterministic DFS cycle detection using 3-color node classification (WHITE=0, GRAY=1, BLACK=2)."""
        adjacency: Dict[str, List[str]] = {n: [] for n in node_ids}
        for src, dst in edges:
            if src in adjacency and dst in adjacency:
                if dst not in adjacency[src]:
                    adjacency[src].append(dst)

        # Sort adjacency lists for strict determinism
        for n in adjacency:
            adjacency[n].sort()

        color: Dict[str, int] = {n: 0 for n in node_ids}  # 0: WHITE, 1: GRAY, 2: BLACK
        parent_path: List[str] = []
        cycles: List[List[str]] = []

        def dfs(u: str):
            color[u] = 1
            parent_path.append(u)

            for v in adjacency[u]:
                if color[v] == 1:
                    # Back-edge found: reconstruct cycle
                    try:
                        idx = parent_path.index(v)
                        cycle = parent_path[idx:] + [v]
                        # Canonicalize cycle: start with smallest element for deterministic deduplication
                        if cycle not in cycles:
                            cycles.append(cycle)
                    except ValueError:
                        pass
                elif color[v] == 0:
                    dfs(v)

            parent_path.pop()
            color[u] = 2

        # Order top-level exploration deterministically by node_ids order
        for node in node_ids:
            if color[node] == 0:
                dfs(node)

        # Deduplicate and sort cycles deterministically
        unique_cycles: List[List[str]] = []
        seen_cycle_sets = set()

        for c in cycles:
            cycle_nodes = frozenset(c[:-1])
            if cycle_nodes not in seen_cycle_sets:
                seen_cycle_sets.add(cycle_nodes)
                unique_cycles.append(c)

        return len(unique_cycles) > 0, unique_cycles
