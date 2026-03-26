/** Represents a single logic node in the tree */
export interface LogicNode {
  id: string;
  condition: string;
  childIds: string[];
  /** If this node links to another existing node (creates a potential cycle) */
  linkTargetId: string | null;
  parentId: string | null;
}

/** Normalized store: all nodes keyed by ID */
export interface LogicGraph {
  nodesById: Record<string, LogicNode>;
  rootIds: string[];
}

/** Result of cycle detection */
export interface CycleDetectionResult {
  hasCycle: boolean;
  /** IDs of all nodes that participate in a cycle */
  cycleNodeIds: Set<string>;
  /** Edges that form cycles: [sourceId, targetId] */
  cycleEdges: Array<[string, string]>;
}

/** Actions for the reducer */
export type GraphAction =
  | { type: "ADD_NODE"; parentId: string | null }
  | { type: "UPDATE_CONDITION"; nodeId: string; condition: string }
  | { type: "DELETE_NODE"; nodeId: string }
  | { type: "LINK_NODE"; sourceId: string; targetId: string }
  | { type: "UNLINK_NODE"; sourceId: string }
  | { type: "MOVE_NODE"; nodeId: string; newParentId: string | null }
  | { type: "RESET" };
