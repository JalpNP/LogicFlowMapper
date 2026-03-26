import { memo, useState, useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Chip,
  Collapse,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useGraph, useNode } from "../state/GraphContext";
import LinkDialog from "./LinkDialog";

interface Props {
  nodeId: string;
  depth: number;
}

const LogicNodeComponent = memo(function LogicNodeComponent({
  nodeId,
  depth,
}: Props) {
  const node = useNode(nodeId);
  const { dispatch, cycleResult, graph } = useGraph();
  const [expanded, setExpanded] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const isInCycle = cycleResult.cycleNodeIds.has(nodeId);

  const handleConditionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "UPDATE_CONDITION", nodeId, condition: e.target.value });
    },
    [dispatch, nodeId]
  );

  const handleAddChild = useCallback(() => {
    dispatch({ type: "ADD_NODE", parentId: nodeId });
  }, [dispatch, nodeId]);

  const handleDelete = useCallback(() => {
    dispatch({ type: "DELETE_NODE", nodeId });
  }, [dispatch, nodeId]);

  const handleUnlink = useCallback(() => {
    dispatch({ type: "UNLINK_NODE", sourceId: nodeId });
  }, [dispatch, nodeId]);

  if (!node) return null;

  const hasChildren = node.childIds.length > 0;
  const hasLink = node.linkTargetId !== null;
  const linkedNode = hasLink ? graph.nodesById[node.linkTargetId!] : null;

  return (
    <Box sx={{ ml: depth > 0 ? 3 : 0, mt: 1.5 }}>
      {depth > 0 && (
        <Box
          sx={{
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              left: -20,
              top: 0,
              bottom: "50%",
              width: 2,
              bgcolor: isInCycle ? "error.main" : "divider",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              left: -20,
              top: "50%",
              width: 20,
              height: 2,
              bgcolor: isInCycle ? "error.main" : "divider",
            },
          }}
        />
      )}

      <Paper
        elevation={isInCycle ? 6 : 2}
        sx={{
          p: 2,
          borderLeft: 4,
          borderColor: isInCycle
            ? "error.main"
            : depth === 0
            ? "primary.main"
            : "secondary.main",
          bgcolor: isInCycle ? "error.50" : "background.paper",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            elevation: 4,
            transform: "translateY(-1px)",
          },
          position: "relative",
        }}
      >
        {isInCycle && (
          <Chip
            icon={<WarningAmberIcon />}
            label="Cycle Detected"
            color="error"
            size="small"
            sx={{
              position: "absolute",
              top: -12,
              right: 12,
              fontWeight: 600,
            }}
          />
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              bgcolor: "action.hover",
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {node.id.slice(0, 8)}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Depth: {depth}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, whiteSpace: "nowrap", color: "primary.main" }}
          >
            IF
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Enter condition..."
            value={node.condition}
            onChange={handleConditionChange}
            variant="outlined"
            error={isInCycle}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.default",
              },
            }}
          />
        </Box>

        {hasLink && linkedNode && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: isInCycle ? "error.50" : "info.50",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: 1,
              borderColor: isInCycle ? "error.200" : "info.200",
            }}
          >
            <LinkIcon
              fontSize="small"
              color={isInCycle ? "error" : "info"}
            />
            <Typography variant="caption" sx={{ flex: 1 }}>
              <strong>THEN →</strong> Linked to:{" "}
              <Chip
                label={linkedNode.condition || `Node ${linkedNode.id.slice(0, 6)}`}
                size="small"
                color={isInCycle ? "error" : "info"}
                variant="outlined"
              />
            </Typography>
            <Tooltip title="Remove link">
              <IconButton size="small" onClick={handleUnlink} color="error">
                <LinkOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 1.5,
            pt: 1,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Tooltip title="Add child condition (THEN branch)">
            <IconButton
              size="small"
              color="primary"
              onClick={handleAddChild}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Link to existing node">
            <IconButton
              size="small"
              color="info"
              onClick={() => setLinkDialogOpen(true)}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete node and all children">
            <IconButton
              size="small"
              color="error"
              onClick={handleDelete}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {hasChildren && (
            <Tooltip title={expanded ? "Collapse children" : "Expand children"}>
              <IconButton
                size="small"
                onClick={() => setExpanded((p) => !p)}
              >
                {expanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}

          {hasChildren && (
            <Typography variant="caption" color="text.secondary">
              {node.childIds.length} child
              {node.childIds.length > 1 ? "ren" : ""}
            </Typography>
          )}
        </Box>
      </Paper>

      <Collapse in={expanded}>
        {node.childIds.map((childId) => (
          <LogicNodeComponent key={childId} nodeId={childId} depth={depth + 1} />
        ))}
      </Collapse>

      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        sourceNodeId={nodeId}
      />
    </Box>
  );
});

export default LogicNodeComponent;
