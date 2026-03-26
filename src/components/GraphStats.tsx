import { useMemo } from "react";
import { Box, Chip } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LayersIcon from "@mui/icons-material/Layers";
import LinkIcon from "@mui/icons-material/Link";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useGraph } from "../state/GraphContext";

export default function GraphStats() {
  const { graph, cycleResult } = useGraph();

  const stats = useMemo(() => {
    const nodes = Object.values(graph.nodesById);
    const totalNodes = nodes.length;
    const totalLinks = nodes.filter((n) => n.linkTargetId !== null).length;

    let maxDepth = 0;
    function walk(nodeId: string, depth: number): void {
      if (depth > maxDepth) maxDepth = depth;
      const node = graph.nodesById[nodeId];
      if (!node) return;
      for (const childId of node.childIds) {
        walk(childId, depth + 1);
      }
    }
    for (const rootId of graph.rootIds) {
      walk(rootId, 0);
    }

    return { totalNodes, totalLinks, maxDepth };
  }, [graph]);

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <Chip
        icon={<AccountTreeIcon />}
        label={`${stats.totalNodes} Nodes`}
        variant="outlined"
        size="small"
      />
      <Chip
        icon={<LayersIcon />}
        label={`Depth: ${stats.maxDepth}`}
        variant="outlined"
        size="small"
      />
      <Chip
        icon={<LinkIcon />}
        label={`${stats.totalLinks} Links`}
        variant="outlined"
        size="small"
        color={stats.totalLinks > 0 ? "info" : "default"}
      />
      {cycleResult.hasCycle && (
        <Chip
          icon={<WarningAmberIcon />}
          label={`${cycleResult.cycleNodeIds.size} nodes in cycle`}
          color="error"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      )}
    </Box>
  );
}
