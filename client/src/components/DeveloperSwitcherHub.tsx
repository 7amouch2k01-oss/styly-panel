import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { 
  SlidersHorizontal, 
  User, 
  Building, 
  Crown, 
  ShoppingBag, 
  Sparkles, 
  Terminal, 
  Zap, 
  X,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";

export default function DeveloperSwitcherHub() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Simulation mutations
  const simulateOrderMutation = trpc.devSimulation.simulateOrder.useMutation();
  const simulateXPMutation = trpc.devSimulation.simulateXP.useMutation();

  if (!user) return null;

  const activeMode = localStorage.getItem(`active_profile_mode_${user.id}`) || localStorage.getItem("active_profile_mode") || "user";
  const brandName = localStorage.getItem(`brand_name_${user.id}`) || "Style Store";
  const isBrandRegistered = localStorage.getItem(`brand_registered_${user.id}`) === "true" || localStorage.getItem("brand_registered") === "true";

  const handleSwitchToConsumer = () => {
    localStorage.setItem(`active_profile_mode_${user.id}`, "user");
    localStorage.setItem("active_profile_mode", "user");
    setLocation("/feed");
    toast.success("Switched to Consumer Mode 👤");
    setIsOpen(false);
  };

  const handleSwitchToBrand = () => {
    // If not registered, register dummy brand details for convenience
    if (!isBrandRegistered) {
      localStorage.setItem(`brand_registered_${user.id}`, "true");
      localStorage.setItem("brand_registered", "true");
      localStorage.setItem(`brand_name_${user.id}`, "Aria Atelier");
      localStorage.setItem(`brand_owner_name_${user.id}`, "Aria Fenix");
    }
    localStorage.setItem(`active_profile_mode_${user.id}`, "brand");
    localStorage.setItem("active_profile_mode", "brand");
    setLocation("/brand");
    toast.success("Switched to Brand Mode 👗");
    setIsOpen(false);
  };

  const handleSimulateOrder = async () => {
    try {
      // Simulate order on brandId = 1 (default brand for tests) or user-owned brand if registered
      const brandId = 1;
      await simulateOrderMutation.mutateAsync({ brandId, amount: 299 });
      toast.success("Simulated Order Placed! Brand XP +50, Commission created 🛍️");
      // Refetch page details if on active page
      window.location.reload();
    } catch (e: any) {
      toast.error("Simulation failed: " + e.message);
    }
  };

  const handleSimulateXP = async () => {
    try {
      const brandId = 1;
      await simulateXPMutation.mutateAsync({ brandId, xp: 100 });
      toast.success("Awarded +100 XP to Brand! ⚡");
      // Refetch page details if on active page
      window.location.reload();
    } catch (e: any) {
      toast.error("Simulation failed: " + e.message);
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="fixed bottom-20 left-4 z-40 select-none">
      
      {/* Expanded Dev Panel */}
      {isOpen && (
        <div className="mb-3 w-72 bg-white/95 dark:bg-[#151515]/95 backdrop-blur-md border border-border/40 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 text-foreground">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/20 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Dev Switcher Hub</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Current Role display */}
          <div className="p-3 bg-muted/50 rounded-2xl border border-border/30 mb-3.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Current Profile Mode</p>
            <p className="text-xs font-black tracking-tight text-primary mt-0.5 flex items-center justify-center gap-1">
              {activeMode === "brand" ? (
                <>
                  <Building className="h-3.5 w-3.5" />
                  <span>Brand ({brandName})</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  <span>Consumer</span>
                </>
              )}
            </p>
          </div>

          {/* Mode Switchers */}
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground pl-1">Switch Account Mode</p>
            
            <button
              onClick={handleSwitchToConsumer}
              className={`w-full h-9 rounded-xl border text-xs font-bold flex items-center justify-between px-3 transition-all ${
                activeMode === "user"
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                  : "bg-background border-border/30 hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Consumer mode</span>
              <span className="text-[9px] opacity-75">Feed</span>
            </button>

            <button
              onClick={handleSwitchToBrand}
              className={`w-full h-9 rounded-xl border text-xs font-bold flex items-center justify-between px-3 transition-all ${
                activeMode === "brand"
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                  : "bg-background border-border/30 hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Brand mode</span>
              <span className="text-[9px] opacity-75">Panel</span>
            </button>

            {/* Admin Dashboard: strictly gated to admin role, brand user has no access & doesn't know it exists */}
            {isAdmin && (
              <button
                onClick={() => {
                  setLocation("/admin");
                  setIsOpen(false);
                }}
                className="w-full h-9 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 text-[#d97706] text-xs font-bold flex items-center justify-between px-3 hover:bg-[#fbbf24]/10 transition-all"
              >
                <span className="flex items-center gap-1.5"><Crown className="h-3.5 w-3.5" /> Admin Panel</span>
                <span className="text-[9px] uppercase font-black bg-[#d97706]/10 px-1.5 py-0.5 rounded-full">Admin</span>
              </button>
            )}
          </div>

          {/* Developer Simulations (XP / Orders) */}
          <div className="mt-4 pt-3 border-t border-border/20 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground pl-1">Simulator Tools</p>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSimulateOrder}
                className="h-8 rounded-xl bg-muted hover:bg-accent border border-border/30 text-[9px] font-black text-foreground flex items-center justify-center gap-1 transition-all"
                title="Create a mock order, earn brand XP and style points"
              >
                <ShoppingBag className="h-3 w-3 text-primary" /> Order Event
              </button>

              <button
                onClick={handleSimulateXP}
                className="h-8 rounded-xl bg-muted hover:bg-accent border border-border/30 text-[9px] font-black text-foreground flex items-center justify-center gap-1 transition-all"
                title="Simulate earning brand XP points"
              >
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> XP Reward
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating launcher trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-orange-400 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all animate-bounce duration-1000 border-2 border-white dark:border-[#151515]"
        title="Open Developer Switcher Hub"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

    </div>
  );
}
