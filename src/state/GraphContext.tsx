import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import type { LogicGraph, GraphAction, CycleDetectionResult } from "../types";
import { graphReducer, createInitialGraph } from "./graphReducer";
import { detectCycles } from "../utils/cycleDetection";

interface GraphContextValue {
  graph: LogicGraph;
  dispatch: Dispatch<GraphAction>;
  cycleResult: CycleDetectionResult;
  /** Get a flattened list of all node IDs and their labels (for link picker) */
  allNodeOptions: Array<{ id: string; label: string }>;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [graph, dispatch] = useReducer(graphReducer, null, createInitialGraph);

  const cycleResult = useMemo(() => detectCycles(graph), [graph]);

  const allNodeOptions = useMemo(() => {
    return Object.values(graph.nodesById).map((node) => ({
      id: node.id,
      label: node.condition || `Node ${node.id.slice(0, 6)}`,
    }));
  }, [graph.nodesById]);

  const value = useMemo(
    () => ({ graph, dispatch, cycleResult, allNodeOptions }),
    [graph, dispatch, cycleResult, allNodeOptions]
  );

  return (
    <GraphContext.Provider value={value}>{children}</GraphContext.Provider>
  );
}

export function useGraph(): GraphContextValue {
  const ctx = useContext(GraphContext);
  if (!ctx) throw new Error("useGraph must be used within a GraphProvider");
  return ctx;
}

export function useNode(nodeId: string) {
  const { graph } = useGraph();
  return graph.nodesById[nodeId] ?? null;
}
