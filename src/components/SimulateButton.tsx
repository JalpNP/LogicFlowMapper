import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useGraph } from "../state/GraphContext";

export default function SimulateButton() {
  const { graph, cycleResult } = useGraph();
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasCycle = cycleResult.hasCycle;
  const nodeCount = Object.keys(graph.nodesById).length;

  /** Build a flat trace of the logic paths for simulation display */
  function buildTraces(): Array<Array<{ id: string; condition: string }>> {
    const traces: Array<Array<{ id: string; condition: string }>> = [];

    function walk(
      nodeId: string,
      path: Array<{ id: string; condition: string }>,
      visited: Set<string>
    ): void {
      const node = graph.nodesById[nodeId];
      if (!node || visited.has(nodeId)) return;

      const newVisited = new Set(visited);
      newVisited.add(nodeId);

      const step = { id: nodeId, condition: node.condition || "(empty)" };
      const newPath = [...path, step];

      const children = [...node.childIds];
      if (node.linkTargetId) children.push(node.linkTargetId);

      if (children.length === 0) {
        traces.push(newPath);
      } else {
        for (const childId of children) {
          walk(childId, newPath, newVisited);
        }
      }
    }

    for (const rootId of graph.rootIds) {
      walk(rootId, [], new Set());
    }

    return traces;
  }

  const traces = dialogOpen ? buildTraces() : [];

  return (
    <>
      <Button
        variant="contained"
        color={hasCycle ? "error" : "success"}
        size="large"
        startIcon={hasCycle ? <ErrorIcon /> : <PlayArrowIcon />}
        disabled={hasCycle}
        onClick={() => setDialogOpen(true)}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          px: 3,
        }}
      >
        {hasCycle ? "Cycle Detected — Cannot Simulate" : "Simulate Logic"}
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            Logic Simulation Results
          </Box>
          <Typography variant="caption" color="text.secondary">
            {nodeCount} nodes — {traces.length} logic path
            {traces.length !== 1 ? "s" : ""} traced
          </Typography>
        </DialogTitle>

        <DialogContent>
          {traces.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No complete logic paths found. Add conditions and children to build paths.
            </Typography>
          ) : (
            traces.map((trace, traceIdx) => (
              <Box
                key={traceIdx}
                sx={{
                  mb: 3,
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.default",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600 }}
                >
                  Path {traceIdx + 1}
                </Typography>
                <Stepper orientation="vertical" activeStep={trace.length}>
                  {trace.map((step, stepIdx) => (
                    <Step key={step.id} completed>
                      <StepLabel>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {stepIdx === 0 ? "IF" : "THEN IF"}{" "}
                            {step.condition}
                          </Typography>
                          <Chip
                            label={step.id.slice(0, 8)}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: "monospace", fontSize: "0.6rem" }}
                          />
                        </Box>
                      </StepLabel>
                      <StepContent />
                    </Step>
                  ))}
                </Stepper>
              </Box>
            ))
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
