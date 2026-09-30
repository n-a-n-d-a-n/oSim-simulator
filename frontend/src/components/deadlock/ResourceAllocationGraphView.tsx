import React, { useState } from 'react';
import type { GraphSnapshot } from '../../types/deadlock';
import { GitCommit, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Props {
  ragSnapshot?: GraphSnapshot | null;
  wfgSnapshot?: GraphSnapshot | null;
  isSingleInstance: boolean;
  isDeadlocked?: boolean | null;
  deadlockedProcesses?: string[] | null;
}

export const ResourceAllocationGraphView: React.FC<Props> = ({
  ragSnapshot,
  wfgSnapshot,
  isSingleInstance,
  isDeadlocked,
  deadlockedProcesses = [],
}) => {
  const [showWfg, setShowWfg] = useState<boolean>(false);

  const activeGraph = showWfg && wfgSnapshot ? wfgSnapshot : ragSnapshot;

  if (!activeGraph || activeGraph.nodes.length === 0) {
    return (
      <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] font-mono text-center text-xs text-[#83887E]">
        NO GRAPH SNAPSHOT AVAILABLE
      </div>
    );
  }

  // Build node positions deterministically around an ellipse or two bipartite columns
  const width = 640;
  const height = 360;
  const centerX = width / 2;
  const centerY = height / 2;

  const nodeMap = new Map<string, { x: number; y: number; node: typeof activeGraph.nodes[0] }>();

  if (activeGraph.is_wfg) {
    // Circle layout for Wait-For Graph
    const count = activeGraph.nodes.length;
    const radius = Math.min(centerX, centerY) - 50;
    activeGraph.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      nodeMap.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        node,
      });
    });
  } else {
    // Bipartite columns for RAG: Processes on left, Resources on right
    const procNodes = activeGraph.nodes.filter((n) => n.node_type === 'PROCESS');
    const resNodes = activeGraph.nodes.filter((n) => n.node_type === 'RESOURCE');

    const procSpacing = height / (procNodes.length + 1);
    procNodes.forEach((node, i) => {
      nodeMap.set(node.id, {
        x: 140,
        y: procSpacing * (i + 1),
        node,
      });
    });

    const resSpacing = height / (resNodes.length + 1);
    resNodes.forEach((node, i) => {
      nodeMap.set(node.id, {
        x: width - 140,
        y: resSpacing * (i + 1),
        node,
      });
    });
  }

  // Collect cycle edges
  const cycleEdges = new Set<string>();
  if (activeGraph.has_cycle && activeGraph.cycles.length > 0) {
    for (const cycle of activeGraph.cycles) {
      for (let i = 0; i < cycle.length; i++) {
        const u = cycle[i];
        const v = cycle[(i + 1) % cycle.length];
        cycleEdges.add(`${u}->${v}`);
      }
    }
  }

  const deadlockedSet = new Set(deadlockedProcesses || []);

  return (
    <div className="p-4 bg-[#11130E] border border-[#262922] rounded-[4px] space-y-4 font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262922] pb-3">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#39FF6A]" />
          <span className="text-xs font-bold text-[#E8F5E9] tracking-wider uppercase">
            {activeGraph.is_wfg
              ? 'WAIT-FOR GRAPH (WFG: SINGLE-INSTANCE ONLY)'
              : 'RESOURCE ALLOCATION GRAPH (RAG)'}
          </span>
        </div>

        {/* WFG switch (only if single-instance system has wfg) */}
        {wfgSnapshot && isSingleInstance && (
          <div className="flex items-center gap-1.5 bg-[#0E100C] p-1 border border-[#262922] rounded-[3px]">
            <button
              type="button"
              onClick={() => setShowWfg(false)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors ${
                !showWfg ? 'bg-[#39FF6A] text-[#0A0D08]' : 'text-[#83887E] hover:text-[#E8F5E9]'
              }`}
            >
              RAG BIPARTITE
            </button>
            <button
              type="button"
              onClick={() => setShowWfg(true)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors ${
                showWfg ? 'bg-[#39FF6A] text-[#0A0D08]' : 'text-[#83887E] hover:text-[#E8F5E9]'
              }`}
            >
              WFG REDUCED
            </button>
          </div>
        )}
      </div>

      {/* Cycle / Deadlock Rule Educational Banner */}
      <div
        className={`p-2.5 rounded-[3px] border text-[11px] flex items-center justify-between gap-3 ${
          activeGraph.has_cycle
            ? isSingleInstance
              ? 'bg-[#3b1717] border-[#FF4C4C]/60 text-[#FF8585]'
              : 'bg-[#382b13] border-[#E89E39]/60 text-[#F5C26B]'
            : 'bg-[#183416] border-[#39FF6A]/40 text-[#A4ECA4]'
        }`}
      >
        <div className="flex items-center gap-2">
          {activeGraph.has_cycle ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0 text-[#39FF6A]" />
          )}
          <span>
            {activeGraph.has_cycle ? (
              isSingleInstance ? (
                <strong>SINGLE-INSTANCE: Cycle detected in graph =&gt; SYSTEM IS DEADLOCKED.</strong>
              ) : isDeadlocked ? (
                <strong>
                  MULTI-INSTANCE: Cycle detected AND genuine deadlock confirmed via matrix reduction.
                </strong>
              ) : (
                <strong>
                  MULTI-INSTANCE: Cycle detected in RAG =&gt; CYCLE ALONE DOES NOT PROVE DEADLOCK.
                  (Matrix reduction proved NO DEADLOCK!)
                </strong>
              )
            ) : (
              <span>GRAPH IS ACYCLIC =&gt; No circular wait conditions detected.</span>
            )}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase whitespace-nowrap">
          {activeGraph.has_cycle ? `${activeGraph.cycles.length} CYCLE(S)` : 'ACYCLIC'}
        </span>
      </div>

      {/* Interactive SVG Diagram */}
      <div className="w-full overflow-x-auto bg-[#0A0C08] border border-[#262922] rounded-[3px] p-2 flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[640px] h-[340px] select-none"
        >
          <defs>
            {/* Standard arrow marker */}
            <marker
              id="arrow-assignment"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#39FF6A" />
            </marker>
            <marker
              id="arrow-request"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#E89E39" />
            </marker>
            <marker
              id="arrow-cycle"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FF4C4C" />
            </marker>
          </defs>

          {/* Edges */}
          {activeGraph.edges.map((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const isCycleEdge = cycleEdges.has(`${edge.source}->${edge.target}`);
            const isAssignment = edge.edge_type === 'ASSIGNMENT';

            let strokeColor = isAssignment ? '#39FF6A' : '#E89E39';
            let marker = isAssignment ? 'url(#arrow-assignment)' : 'url(#arrow-request)';

            if (isCycleEdge) {
              strokeColor = '#FF4C4C';
              marker = 'url(#arrow-cycle)';
            }

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={strokeColor}
                  strokeWidth={isCycleEdge ? 2.5 : 1.5}
                  strokeDasharray={edge.edge_type === 'REQUEST' ? '4 3' : undefined}
                  markerEnd={marker}
                  opacity={isCycleEdge ? 1 : 0.75}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {activeGraph.nodes.map((node) => {
            const pos = nodeMap.get(node.id);
            if (!pos) return null;

            const isProcess = node.node_type === 'PROCESS';
            const isDeadlocked = deadlockedSet.has(node.id);

            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                {isProcess ? (
                  // Process Node: Circle
                  <circle
                    r={20}
                    className={`transition-colors ${
                      isDeadlocked
                        ? 'fill-[#3b1717] stroke-[#FF4C4C] stroke-[2.5]'
                        : 'fill-[#121E10] stroke-[#39FF6A] stroke-[1.8]'
                    }`}
                  />
                ) : (
                  // Resource Node: Rounded Rectangle with capacity dots
                  <rect
                    x={-24}
                    y={-18}
                    width={48}
                    height={36}
                    rx={4}
                    className="fill-[#1A1812] stroke-[#E89E39] stroke-[1.8]"
                  />
                )}

                {/* Node Label */}
                <text
                  textAnchor="middle"
                  dy={isProcess ? 4 : 4}
                  className={`text-[11px] font-bold font-mono pointer-events-none ${
                    isProcess
                      ? isDeadlocked
                        ? 'fill-[#FF8585]'
                        : 'fill-[#39FF6A]'
                      : 'fill-[#F5C26B]'
                  }`}
                >
                  {node.label}
                </text>

                {/* Resource Capacity/Available sub-label */}
                {!isProcess && node.capacity !== undefined && node.capacity !== null && (
                  <text
                    textAnchor="middle"
                    dy={26}
                    className="text-[9px] fill-[#83887E] font-mono pointer-events-none"
                  >
                    Avail: {node.available}/{node.capacity}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#83887E] pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#121E10] border border-[#39FF6A]" />
            <span>Process Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded bg-[#1A1812] border border-[#E89E39]" />
            <span>Resource Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#39FF6A]" />
            <span>Assignment (R -&gt; P)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b border-dashed border-[#E89E39]" />
            <span>Request (P -&gt; R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#FF4C4C]" />
            <span>Cycle Edge</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#A4AAA0]">
          <Info className="w-3 h-3 text-[#39FF6A]" />
          <span>Bipartite layout: Left = Processes, Right = Resources</span>
        </div>
      </div>
    </div>
  );
};
