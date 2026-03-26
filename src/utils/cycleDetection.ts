import type { LogicGraph, CycleDetectionResult } from "../types";

/**
 * Detects cycles in the logic graph using iterative Depth-First Search.
 *
 * Algorithm: For each root, we perform a DFS using three coloring states:
 *   - WHITE (0): unvisited
 *   - GRAY  (1): currently in the recursion stack
 *   - BLACK (2): fully processed
 *
 * A back-edge (an edge to a GRAY node) indicates a cycle.
 * When a cycle is found we trace back through the parent map to collect
 * every node that participates in the cycle.
 */
export function detectCycles(graph: LogicGraph): CycleDetectionResult {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  const cycleNodeIds = new Set<string>();
  const cycleEdges: Array<[string, string]> = [];

  for (const id of Object.keys(graph.nodesById)) {
    color[id] = WHITE;
  }

  /** Build adjacency: children + link target */
  function getNeighbors(nodeId: string): string[] {
    const node = graph.nodesById[nodeId];
    if (!node) return [];
    const neighbors = [...node.childIds];
    if (node.linkTargetId && graph.nodesById[node.linkTargetId]) {
      neighbors.push(node.linkTargetId);
    }
    return neighbors;
  }

  /** Trace back from `current` to `ancestor` along the parent map to collect cycle nodes */
  function collectCycleNodes(ancestor: string, current: string): void {
    cycleEdges.push([current, ancestor]);
    cycleNodeIds.add(ancestor);
    let walk: string | null = current;
    while (walk && walk !== ancestor) {
      cycleNodeIds.add(walk);
      walk = parent[walk] ?? null;
    }
  }

  /** Iterative DFS with explicit stack */
  function dfs(startId: string): void {
    const stack: Array<[string, number]> = [[startId, 0]];
    color[startId] = GRAY;
    parent[startId] = null;

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const nodeId = top[0];
      const neighbors = getNeighbors(nodeId);

      if (top[1] < neighbors.length) {
        const neighborId = neighbors[top[1]];
        top[1]++;

        if (color[neighborId] === WHITE) {
          color[neighborId] = GRAY;
          parent[neighborId] = nodeId;
          stack.push([neighborId, 0]);
        } else if (color[neighborId] === GRAY) {
          collectCycleNodes(neighborId, nodeId);
        }
      } else {
        color[nodeId] = BLACK;
        stack.pop();
      }
    }
  }

  for (const id of Object.keys(graph.nodesById)) {
    if (color[id] === WHITE) {
      dfs(id);
    }
  }

  return {
    hasCycle: cycleNodeIds.size > 0,
    cycleNodeIds,
    cycleEdges,
  };
}
