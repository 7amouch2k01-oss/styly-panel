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
