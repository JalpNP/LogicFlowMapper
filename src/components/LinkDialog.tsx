import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useGraph } from "../state/GraphContext";

interface Props {
  open: boolean;
  onClose: () => void;
  sourceNodeId: string;
}

/**
 * Collects the set of IDs for the source node and all its descendants.
 * These are excluded from the link-target list to avoid trivial self-loops.
 */
function collectSubtreeIds(
  nodesById: Record<string, { childIds: string[] }>,
  rootId: string
): Set<string> {
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    result.add(id);
    const node = nodesById[id];
    if (node) {
      for (const childId of node.childIds) {
        stack.push(childId);
      }
    }
  }
  return result;
}

export default function LinkDialog({ open, onClose, sourceNodeId }: Props) {
  const { graph, dispatch } = useGraph();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const subtreeIds = useMemo(
    () => collectSubtreeIds(graph.nodesById, sourceNodeId),
    [graph.nodesById, sourceNodeId]
  );

  const availableNodes = useMemo(() => {
    return Object.values(graph.nodesById)
      .filter((n) => !subtreeIds.has(n.id))
      .filter((n) => {
        if (!search) return true;
        const lowerSearch = search.toLowerCase();
        return (
          n.condition.toLowerCase().includes(lowerSearch) ||
          n.id.toLowerCase().includes(lowerSearch)
        );
      });
  }, [graph.nodesById, subtreeIds, search]);

  const handleLink = () => {
    if (selectedId) {
      dispatch({ type: "LINK_NODE", sourceId: sourceNodeId, targetId: selectedId });
      setSelectedId(null);
      setSearch("");
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Link to Existing Node
        <Typography variant="caption" display="block" color="text.secondary">
          Select a target node to create a logic link. This may create a cycle.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 1 }}>
          <SearchIcon color="action" />
          <TextField
            size="small"
            fullWidth
            placeholder="Search nodes by condition or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        {availableNodes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            No available nodes to link to.
          </Typography>
        ) : (
          <List
            sx={{
              maxHeight: 300,
              overflow: "auto",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            {availableNodes.map((node) => (
              <ListItemButton
                key={node.id}
                selected={selectedId === node.id}
                onClick={() => setSelectedId(node.id)}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {node.condition || "(empty condition)"}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Chip
                      label={node.id.slice(0, 8)}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: "monospace", fontSize: "0.65rem", mt: 0.5 }}
                    />
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleLink}
          variant="contained"
          disabled={!selectedId}
        >
          Create Link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
