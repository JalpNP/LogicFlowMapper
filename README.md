# Logic Flow Mapper

A **React + TypeScript** application that lets users build nested "If-Then" logic trees, link nodes to create complex graphs, and validates the integrity of those logic paths in real-time via cycle detection.

🔗 **Live Demo:**  
https://logic-flow-mapper-woad.vercel.app/

## Tech Stack

- **React 19** + **TypeScript** (Vite)
- **Material UI (MUI)** for professional component styling
- **uuid** for unique node ID generation

## Data Structure: Normalised Graph

The application uses a **normalised (flat) data structure** rather than a deeply nested tree.

```ts
interface LogicGraph {
  nodesById: Record<string, LogicNode>; // flat map: O(1) lookups
  rootIds: string[]; // entry points into the graph
}
```

**Why Normalised over Nested?**

| Concern          | Nested                                       | Normalised ✓                                    |
| ---------------- | -------------------------------------------- | ----------------------------------------------- |
| Deep updates     | Clone entire path to root — O(depth) objects | Update one entry in flat map — O(1)             |
| Node linking     | Must traverse to find target                 | Direct ID reference                             |
| Cycle detection  | Ambiguous ownership                          | Clean adjacency via `childIds` + `linkTargetId` |
| React re-renders | Parent + all ancestors re-render             | Only the changed node re-renders (via `memo`)   |

Each `LogicNode` stores its own `childIds` (structural children) and an optional `linkTargetId` (a user-created cross-link to any other node). Together these form a directed graph that may contain cycles.

## Cycle Detection Algorithm

The engine uses an **iterative Depth-First Search** with **three-color marking** (WHITE → GRAY → BLACK):

1. All nodes start as **WHITE** (unvisited).
2. When a node is first visited it becomes **GRAY** (on the current DFS stack).
3. If we encounter a neighbor that is already **GRAY**, we have found a **back-edge** → a cycle exists.
4. We trace back through the parent map to collect every node participating in the cycle.
5. Once all neighbors of a node are processed it becomes **BLACK** (complete).

This runs in **O(V + E)** time and is triggered on every state change via `useMemo`, so the UI flags cycles in real-time.

## Key Features

- **Infinite nesting**: each node can have unlimited children, rendered recursively
- **Cross-linking**: link any node to any other existing node in the tree
- **Real-time cycle detection**: DFS runs on every graph mutation; offending nodes are highlighted in red
- **Simulate Logic**: traces all valid paths through the tree; disabled when cycles exist
- **Delete cascading**: removing a node also removes all its descendants and cleans up any inbound links
- **Move support**: nodes can be re-parented within the tree
- **Performance**: normalised state + `React.memo` ensures only affected nodes re-render

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```
