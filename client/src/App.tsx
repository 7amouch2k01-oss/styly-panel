import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import AdminGuard from "./components/AdminGuard";
import Unauthorized from "./pages/Unauthorized";
import Overview from "./pages/Overview";
import Users from "./pages/Users";
import Devices from "./pages/Devices";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/unauthorized" component={Unauthorized} />
      <Route path="/404" component={NotFound} />
      <Route path="*">
        <AdminGuard>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={Overview} />
              <Route path="/users" component={Users} />
              <Route path="/devices" component={Devices} />
              <Route path="/orders" component={Orders} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </AdminGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
