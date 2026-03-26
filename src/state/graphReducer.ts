import { v4 as uuidv4 } from "uuid";
import type { LogicGraph, GraphAction, LogicNode } from "../types";

export function createNode(parentId: string | null): LogicNode {
  return {
    id: uuidv4(),
    condition: "",
    childIds: [],
    linkTargetId: null,
    parentId,
  };
}

export function createInitialGraph(): LogicGraph {
  const root = createNode(null);
  return {
    nodesById: { [root.id]: root },
    rootIds: [root.id],
  };
}

/**
 * Recursively collects a node and all its descendants (by childIds).
 * Returns an array of node IDs to remove.
 */
function collectDescendants(
  graph: LogicGraph,
  nodeId: string
): string[] {
  const result: string[] = [nodeId];
  const node = graph.nodesById[nodeId];
  if (!node) return result;
  for (const childId of node.childIds) {
    result.push(...collectDescendants(graph, childId));
  }
  return result;
}

export function graphReducer(
  state: LogicGraph,
  action: GraphAction
): LogicGraph {
  switch (action.type) {
    case "ADD_NODE": {
      const newNode = createNode(action.parentId);
      const nodesById = { ...state.nodesById, [newNode.id]: newNode };

      if (action.parentId === null) {
        return {
          nodesById,
          rootIds: [...state.rootIds, newNode.id],
        };
      }

      const parent = state.nodesById[action.parentId];
      if (!parent) return state;

      nodesById[parent.id] = {
        ...parent,
        childIds: [...parent.childIds, newNode.id],
      };

      return { ...state, nodesById };
    }

    case "UPDATE_CONDITION": {
      const node = state.nodesById[action.nodeId];
      if (!node) return state;
      return {
        ...state,
        nodesById: {
          ...state.nodesById,
          [action.nodeId]: { ...node, condition: action.condition },
        },
      };
    }

    case "DELETE_NODE": {
      const node = state.nodesById[action.nodeId];
      if (!node) return state;

      const idsToRemove = new Set(collectDescendants(state, action.nodeId));

      const nodesById: Record<string, LogicNode> = {};
      for (const [id, n] of Object.entries(state.nodesById)) {
        if (idsToRemove.has(id)) continue;

        let updated = n;

        if (n.childIds.some((cid) => idsToRemove.has(cid))) {
          updated = {
            ...updated,
            childIds: updated.childIds.filter((cid) => !idsToRemove.has(cid)),
          };
        }

        if (updated.linkTargetId && idsToRemove.has(updated.linkTargetId)) {
          updated = { ...updated, linkTargetId: null };
        }

        nodesById[id] = updated;
      }

      const rootIds = state.rootIds.filter((rid) => !idsToRemove.has(rid));

      return { nodesById, rootIds };
    }

    case "LINK_NODE": {
      const source = state.nodesById[action.sourceId];
      if (!source) return state;
      if (!state.nodesById[action.targetId]) return state;

      return {
        ...state,
        nodesById: {
          ...state.nodesById,
          [action.sourceId]: { ...source, linkTargetId: action.targetId },
        },
      };
    }

    case "UNLINK_NODE": {
      const source = state.nodesById[action.sourceId];
      if (!source) return state;

      return {
        ...state,
        nodesById: {
          ...state.nodesById,
          [action.sourceId]: { ...source, linkTargetId: null },
        },
      };
    }

    case "MOVE_NODE": {
      const node = state.nodesById[action.nodeId];
      if (!node) return state;

      const nodesById = { ...state.nodesById };
      let rootIds = [...state.rootIds];

      if (node.parentId) {
        const oldParent = nodesById[node.parentId];
        if (oldParent) {
          nodesById[oldParent.id] = {
            ...oldParent,
            childIds: oldParent.childIds.filter((id) => id !== action.nodeId),
          };
        }
      } else {
        rootIds = rootIds.filter((id) => id !== action.nodeId);
      }

      if (action.newParentId) {
        const newParent = nodesById[action.newParentId];
        if (!newParent) return state;
        nodesById[newParent.id] = {
          ...newParent,
          childIds: [...newParent.childIds, action.nodeId],
        };
      } else {
        rootIds.push(action.nodeId);
      }

      nodesById[action.nodeId] = {
        ...node,
        parentId: action.newParentId,
      };

      return { nodesById, rootIds };
    }

    case "RESET": {
      return createInitialGraph();
    }

    default:
      return state;
  }
}
