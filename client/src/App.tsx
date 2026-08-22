/** Field Operations Ledger style: a single, calm editorial experience for EcoSphere AI. */
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import React, { lazy, ReactNode, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

const Home = lazy(() => import("./pages/Home"));
const ImplementationDashboard = lazy(() => import("./pages/ImplementationDashboard"));
const IngestionWorkbench = lazy(() => import("./pages/IngestionWorkbench"));
const OperationsOverview = lazy(() => import("./pages/OperationsOverview"));
const RegistryWorkspace = lazy(() => import("./pages/RegistryWorkspace"));
const IntelligenceWorkspace = lazy(() => import("./pages/IntelligenceWorkspace"));
const ActionsWorkspace = lazy(() => import("./pages/ActionsWorkspace"));
const ReportsWorkspace = lazy(() => import("./pages/ReportsWorkspace"));
const ScenarioWorkspace = lazy(() => import("./pages/ScenarioWorkspace"));

function RouteLoading() {
  return <div className="app-loading-state">Loading workspace…</div>;
}

function ProtectedWorkspace({ children }: { children: ReactNode }) {
  return <DashboardLayout><Suspense fallback={<RouteLoading />}>{children}</Suspense></DashboardLayout>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"}><ProtectedWorkspace><OperationsOverview /></ProtectedWorkspace></Route>
      <Route path={"/narrative"}><Suspense fallback={<RouteLoading />}><Home /></Suspense></Route>
      <Route path={"/app"}><ProtectedWorkspace><OperationsOverview /></ProtectedWorkspace></Route>
      <Route path={"/app/registry"}><ProtectedWorkspace><RegistryWorkspace /></ProtectedWorkspace></Route>
      <Route path={"/app/data"}><ProtectedWorkspace><IngestionWorkbench /></ProtectedWorkspace></Route>
      <Route path={"/app/intelligence"}><ProtectedWorkspace><IntelligenceWorkspace /></ProtectedWorkspace></Route>
      <Route path={"/app/scenarios"}><ProtectedWorkspace><ScenarioWorkspace /></ProtectedWorkspace></Route>
      <Route path={"/app/actions"}><ProtectedWorkspace><ActionsWorkspace /></ProtectedWorkspace></Route>
      <Route path={"/app/reports"}><ProtectedWorkspace><ReportsWorkspace /></ProtectedWorkspace></Route>
      <Route path={"/app/readiness"}><ProtectedWorkspace><ImplementationDashboard /></ProtectedWorkspace></Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <Router />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
