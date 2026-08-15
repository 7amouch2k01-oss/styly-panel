import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Unauthorized from "./pages/Unauthorized";
import Auth from "./pages/Auth";
import BrandDashboard from "./pages/BrandDashboard";
import HomeFeed from "./pages/HomeFeed";
import Landing from "./pages/Landing";
import MannequinCustomizer from "./pages/MannequinCustomizer";
import UserProfile from "./pages/UserProfile";
import Explore from "./pages/Explore";
import Shop from "./pages/Shop";
import Checkout from "./pages/Checkout";
import BrandStorefront from "./pages/BrandStorefront";
import ResetPassword from "./pages/ResetPassword";

import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Brands from "./pages/Brands";
import Settings from "./pages/Settings";
import { AppShellProvider } from "./components/AppShell";
import { LanguageProvider } from "./contexts/LanguageContext";

function Router() {
  return (
    <Switch>
      {/* ── Consumer App Routes ── */}
      <Route path="/" component={Landing} />
      <Route path="/feed" component={HomeFeed} />
      <Route path="/explore" component={Explore} />
      <Route path="/shop" component={Shop} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/mannequin" component={MannequinCustomizer} />
      <Route path="/profile" component={UserProfile} />
      <Route path="/brand" component={BrandDashboard} />
      <Route path="/brand-store/:brandId" component={BrandStorefront} />

      {/* ── Admin Dashboard Routes ── */}
      <Route path="/admin">
        {() => (
          <DashboardLayout>
            <Overview />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/products">
        {() => (
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/orders">
        {() => (
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/brands">
        {() => (
          <DashboardLayout>
            <Brands />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>

      {/* ── Auth ── */}
      <Route path="/auth" component={Auth} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/unauthorized" component={Unauthorized} />
      <Route path="/404" component={NotFound} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <LanguageProvider>
          <AppShellProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AppShellProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
