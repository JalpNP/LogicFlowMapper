import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Paper,
  Divider,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Alert,
  AlertTitle,
} from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { GraphProvider, useGraph } from "./state/GraphContext";
import LogicNodeComponent from "./components/LogicNodeComponent";
import SimulateButton from "./components/SimulateButton";
import GraphStats from "./components/GraphStats";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#7b1fa2" },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

function AppContent() {
  const { graph, dispatch, cycleResult } = useGraph();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: "background.paper", color: "text.primary" }}>
        <Toolbar sx={{ gap: 2 }}>
          <AccountTreeIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Logic Flow Mapper
          </Typography>
          <GraphStats />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {cycleResult.hasCycle && (
          <Alert severity="error" sx={{ mb: 3 }} variant="filled">
            <AlertTitle>Logic Loop Detected</AlertTitle>
            A circular dependency was found involving{" "}
            <strong>{cycleResult.cycleNodeIds.size} node(s)</strong>. The
            offending nodes are highlighted in red. Remove or change the link
            to resolve the cycle before simulating.
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => dispatch({ type: "ADD_NODE", parentId: null })}
            sx={{ textTransform: "none" }}
          >
            Add Root Node
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={<RestartAltIcon />}
            onClick={() => dispatch({ type: "RESET" })}
            sx={{ textTransform: "none" }}
          >
            Reset All
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <SimulateButton />
        </Paper>

        <Divider sx={{ mb: 3 }} />

        {graph.rootIds.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <AccountTreeIcon sx={{ fontSize: 64, color: "action.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No logic nodes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click "Add Root Node" to start building your logic tree.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {graph.rootIds.map((rootId) => (
              <LogicNodeComponent key={rootId} nodeId={rootId} depth={0} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GraphProvider>
        <AppContent />
      </GraphProvider>
    </ThemeProvider>
  );
}

export default App
