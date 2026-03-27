import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { LogicGraph, GraphAction, CycleDetectionResult } from "../types";
import { graphReducer, createInitialGraph } from "./graphReducer";
import { detectCycles } from "../utils/cycleDetection";

const STORAGE_KEY = "logic-flow-mapper-graph";
const MAX_HISTORY = 50;

function loadGraph(): LogicGraph {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LogicGraph;
      if (parsed.nodesById && parsed.rootIds) return parsed;
    }
  } catch { /* ignore corrupt data */ }
  return createInitialGraph();
}

function saveGraph(graph: LogicGraph): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
  } catch { /* storage full — silently skip */ }
}

interface HistoryState {
  past: LogicGraph[];
  present: LogicGraph;
  future: LogicGraph[];
}

type HistoryAction =
  | { type: "DISPATCH"; action: GraphAction }
  | { type: "UNDO" }
  | { type: "REDO" };

function historyReducer(state: HistoryState, historyAction: HistoryAction): HistoryState {
  switch (historyAction.type) {
    case "DISPATCH": {
      const next = graphReducer(state.present, historyAction.action);
      if (next === state.present) return state;

      const past = [...state.past, state.present].slice(-MAX_HISTORY);
      return { past, present: next, future: [] };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

interface GraphContextValue {
  graph: LogicGraph;
  dispatch: (action: GraphAction) => void;
  cycleResult: CycleDetectionResult;
  /** Get a flattened list of all node IDs and their labels (for link picker) */
  allNodeOptions: Array<{ id: string; label: string }>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [history, rawDispatch] = useReducer(historyReducer, null, () => ({
    past: [],
    present: loadGraph(),
    future: [],
  }));

  const graph = history.present;

  useEffect(() => {
    saveGraph(graph);
  }, [graph]);

  const dispatch = useCallback(
    (action: GraphAction) => rawDispatch({ type: "DISPATCH", action }),
    []
  );

  const undo = useCallback(() => rawDispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => rawDispatch({ type: "REDO" }), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const cycleResult = useMemo(() => detectCycles(graph), [graph]);

  const allNodeOptions = useMemo(() => {
    return Object.values(graph.nodesById).map((node) => ({
      id: node.id,
      label: node.condition || `Node ${node.id.slice(0, 6)}`,
    }));
  }, [graph.nodesById]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const value = useMemo(
    () => ({ graph, dispatch, cycleResult, allNodeOptions, undo, redo, canUndo, canRedo }),
    [graph, dispatch, cycleResult, allNodeOptions, undo, redo, canUndo, canRedo]
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
