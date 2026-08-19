import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Home,
  Compass,
  Shirt,
  ShoppingBag,
  User,
  Search,
  Sun,
  Moon,
  Bell,
  BellRing,
  Building,
  LogOut,
  X,
  ChevronRight,
  Heart,
  Star,
  TrendingUp,
  Minus,
  Plus,
  Package,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

// ─── Cart Context (global state for shopping bag) ─────────────────────────────

interface BagItem {
  id: number;
  productId?: number;
  name: string;
  price: number;
  image: string;
  size: string;
  qty: number;
  brandId?: number;
  brandName?: string;
}

interface AppShellContextValue {
  bagItems: BagItem[];
  addToBag: (item: Omit<BagItem, "qty">) => void;
  removeFromBag: (id: number) => void;
  clearBag: () => void;
  openBag: () => void;
  showBag: boolean;
  setShowBag: (show: boolean) => void;
  updateQty: (id: number, size: string, delta: number) => void;
}

export const AppShellContext = createContext<AppShellContextValue>({
  bagItems: [],
  addToBag: () => {},
  removeFromBag: () => {},
  clearBag: () => {},
  openBag: () => {},
  showBag: false,
  setShowBag: () => {},
  updateQty: () => {},
});

export function useAppShell() {
  return useContext(AppShellContext);
}

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [bagItems, setBagItems] = useState<BagItem[]>(() => {
    try {
      const saved = localStorage.getItem("styly_shopping_bag");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showBag, setShowBag] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("styly_shopping_bag", JSON.stringify(bagItems));
  }, [bagItems]);

  const addToBag = useCallback((item: Omit<BagItem, "qty">) => {
    setBagItems((prev) => {
      const existing = prev.find((b) => b.id === item.id && b.size === item.size);
      if (existing) {
        return prev.map((b) =>
          b.id === item.id && b.size === item.size ? { ...b, qty: b.qty + 1 } : b
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added to bag 🛍️`);
  }, []);

  const updateQty = useCallback((id: number, size: string, delta: number) => {
    setBagItems(prev => prev.map(b =>
      b.id === id && b.size === size
        ? { ...b, qty: Math.max(1, b.qty + delta) }
        : b
    ));
  }, []);

  const removeFromBag = useCallback((id: number) => {
    setBagItems((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const clearBag = useCallback(() => {
    setBagItems([]);
    localStorage.removeItem("styly_shopping_bag");
  }, []);

  const openBag = useCallback(() => setShowBag(true), []);

  return (
    <AppShellContext.Provider
      value={{
        bagItems,
        addToBag,
        removeFromBag,
        clearBag,
        openBag,
        showBag,
        setShowBag,
        updateQty,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}

// ─── Sidebar Nav Config ───────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/feed",      label: "Home",      icon: Home    },
  { href: "/explore",   label: "Explore",   icon: Compass },
  { href: "/mannequin", label: "Mannequin", icon: Shirt   },
];

// ─── Trending dummy data for right panel ─────────────────────────────────────

const TRENDING_ITEMS = [
  { id: 1, name: "Linen Blend Blazer",  price: 349, likes: "2.4K", image: "/product_jacket.png" },
  { id: 2, name: "Queen Rania Dress",   price: 1200, likes: "5.1K", image: "/product_dress_1.png" },
  { id: 3, name: "Urban Cargo Pants",   price: 199, likes: "1.8K", image: "/product_jacket.png" },
  { id: 4, name: "Silk Evening Blouse", price: 289, likes: "3.3K", image: "/product_dress_1.png" },
];

// ─── AppShell ─────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode;
  /** Active path used for sidebar link highlighting */
  activePath?: string;
  /** Whether to show the right trending panel */
  showRightPanel?: boolean;
  /** Full-width mode disables max-width on the feed area */
  fullWidth?: boolean;
}

export default function AppShell({
  children,
  activePath = "/feed",
  showRightPanel = true,
  fullWidth = false,
}: AppShellProps) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const {
    bagItems,
    showBag,
    setShowBag,
    addToBag,
    updateQty,
    removeFromBag,
    clearBag,
  } = useAppShell();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Notification state
  const notifQuery = trpc.notifications.myNotifications.useQuery(undefined, { enabled: !!user, refetchInterval: 20000 });
  const notifications: any[] = notifQuery.data?.items || [];
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => notifQuery.refetch()
  });

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showHeartDrawer, setShowHeartDrawer] = useState(false);

  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const heartNotifs = notifications.filter((n: any) => n.type === "like" || n.type === "brand_approval");
  const unreadHearts = heartNotifs.filter((n: any) => !n.readHeart).length;

  // Brand Store state from backend
  const { data: brandStore } = trpc.brandStore.get.useQuery(undefined, { enabled: !!user });

  // Listen for new notifications pushed by HomeFeed
  useEffect(() => {
    const handler = () => {
      notifQuery.refetch();
    };
    window.addEventListener("styly_notif_update", handler);
    return () => window.removeEventListener("styly_notif_update", handler);
  }, [notifQuery]);

  // Redirect logged-in unverified users to /auth (but not from landing or auth pages)
  useEffect(() => {
    const path = window.location.pathname;
    if (user && !user.isEmailVerified && path !== "/auth" && path !== "/") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const markAllRead = () => {
    const unreadIds = notifications.filter((n: any) => !n.read).map((n: any) => n.id);
    if (unreadIds.length > 0) {
      markReadMutation.mutate({ ids: unreadIds });
    }
  };

  const markHeartsRead = () => {
    const unreadIds = heartNotifs.filter((n: any) => !n.readHeart).map((n: any) => n.id);
    if (unreadIds.length > 0) {
      markReadMutation.mutate({ ids: unreadIds });
    }
  };

  const openBag = useCallback(() => setShowBag(true), []);

  const bagTotal = bagItems.reduce((acc, b) => acc + b.price * b.qty, 0);
  const bagCount = bagItems.reduce((acc, b) => acc + b.qty, 0);
  const shipping = bagItems.length > 0 ? 5.99 : 0;
  const orderTotal = bagTotal + shipping;

  const placeOrderMutation = trpc.checkout.placeOrder.useMutation({
    onSuccess: (data) => {
      clearBag();
      setIsPlacingOrder(false);
      setOrderPlaced(true);
      toast.success("Order placed successfully! 🎉 Check your profile for delivery updates.");
      setTimeout(() => {
        setOrderPlaced(false);
        setShowBag(false);
      }, 2000);
    },
    onError: (err) => {
      console.error("Order error:", err);
      setIsPlacingOrder(false);
      toast.error(err.message || "Failed to place order. Please try again.");
    }
  });

  const handlePlaceOrder = async () => {
    if (bagItems.length === 0) return;
    
    // If not logged in, redirect to auth or prompt login
    if (!user) {
      toast.error("Please sign in or create an account to complete your purchase");
      setLocation("/auth");
      setShowBag(false);
      return;
    }

    // If user needs to fill custom address or we have delivery profile, navigate to /checkout
    setLocation("/checkout");
    setShowBag(false);
  };

  return (
    <>
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-[#0F0F0F] text-foreground flex">

        {/* ── Left Sidebar (Desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 fixed left-0 top-0 h-screen bg-white dark:bg-[#161616] border-r border-border/30 z-30 shadow-sm">

          {/* Logo */}
          <div
            className="px-6 py-5 cursor-pointer flex items-center gap-2 border-b border-border/20"
            onClick={() => setLocation("/feed")}
          >
            <span className="text-2xl font-black bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] bg-clip-text text-transparent tracking-tight">
              Styly
            </span>
            <span className="text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5 ml-auto">
              Beta
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = activePath === href;
              return (
                <button
                  key={href}
                  onClick={() => setLocation(href)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transit-all group ${
                    isActive
                      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-bold border-l-[3px] border-primary rounded-l-none"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom user area */}
          <div className="p-4 border-t border-border/20">
            {(() => {
              if (!user) return null;
              
              // Resolve real status from backend
              const isApproved = brandStore && brandStore.status === "approved";
              const activeMode = (isApproved && localStorage.getItem(`active_profile_mode_${user.id}`) === "brand") ? "brand" : "user";
              
              const brandName = brandStore?.brandName || "Style Store";
              const brandOwner = brandStore?.ownerName || "Brand Owner";

              const handleToggleAccount = () => {
                if (activeMode === "brand") {
                  localStorage.setItem(`active_profile_mode_${user.id}`, "user");
                  setLocation("/feed");
                  toast.success("Switched to User Account 👤");
                } else {
                  if (isApproved) {
                    localStorage.setItem(`active_profile_mode_${user.id}`, "brand");
                    setLocation("/brand");
                    toast.success("Switched to Brand Account 👗");
                  } else {
                    // Not approved yet (pending, rejected, or doesn't exist)
                    setLocation("/brand");
                    toast.info("Navigating to Brand Registration status.");
                  }
                }
              };

              return (
                <div
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent cursor-pointer transit-all"
                  onClick={handleToggleAccount}
                  title="Click to switch profile mode"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {activeMode === "brand" ? "👗" : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {activeMode === "brand" ? brandName : `@${user.name?.replace(/\s+/g, "") || "user"}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {activeMode === "brand" ? `Brand: ${brandOwner}` : "User Account"}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              );
            })()}

            <div className="flex items-center gap-2 mt-2">
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg hover:bg-accent text-xs text-muted-foreground transit-all"
                >
                  {theme === "dark"
                    ? <><Sun className="h-3.5 w-3.5" /><span>Light</span></>
                    : <><Moon className="h-3.5 w-3.5" /><span>Dark</span></>
                  }
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    await logout();
                    toast.success("Logged out successfully");
                    setLocation("/auth");
                  } catch (e: any) {
                    toast.error("Failed to log out: " + e.message);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg hover:bg-red-500/10 text-red-500 text-xs transit-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

          {/* ── Top Bar ── */}
          <header className="sticky top-0 z-20 bg-white/70 dark:bg-[#161616]/70 glassmorphic border-b border-border/30 h-14 px-4 lg:px-6 flex items-center gap-3">

            {/* Mobile: logo */}
            <span
              className="lg:hidden text-xl font-black bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] bg-clip-text text-transparent cursor-pointer mr-1 shrink-0"
              onClick={() => setLocation("/feed")}
            >
              Styly
            </span>

            {/* Search */}
            <div className="flex-1 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search outfits, brands, styles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-full bg-muted dark:bg-[#222] border border-border/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
              />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Create Post "+" button */}
              <button
                onClick={() => {
                  if (activePath !== "/feed") {
                    setLocation("/feed?action=create-post");
                  } else {
                    const btn = document.getElementById("open-post-composer");
                    if (btn) btn.click();
                    else window.dispatchEvent(new CustomEvent("styly:open-composer"));
                  }
                }}
                className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md hover:scale-105 active:scale-95 flex items-center justify-center transit-all"
                title="Create Post"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>

              {/* Heart / Likes drawer */}
              <button
                onClick={() => { setShowHeartDrawer(v => !v); markHeartsRead(); }}
                className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all relative"
                title="Who liked your posts"
              >
                <Heart className="h-4 w-4 text-muted-foreground" />
                {unreadHearts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {unreadHearts > 9 ? "9+" : unreadHearts}
                  </span>
                )}
              </button>

              {/* Notifications bell */}
              <button
                onClick={() => { setShowNotifDrawer(v => !v); markAllRead(); }}
                className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all relative"
                title="Notifications"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Shopping bag */}
              <button
                onClick={() => setShowBag(true)}
                className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all relative"
                title="Shopping Bag"
              >
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                {bagCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                    {bagCount > 9 ? "9+" : bagCount}
                  </span>
                )}
              </button>

              {/* Avatar / profile menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((v) => !v)}
                  className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold transit-all hover:scale-105 overflow-hidden border-2 border-white dark:border-[#222]"
                >
                  A
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1A1A1A] border border-border/40 rounded-2xl shadow-2xl p-2 z-50 animate-fade-up">
                    <button
                      onClick={() => { setShowProfileMenu(false); setLocation("/profile"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-accent transit-all text-left"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> My Profile
                    </button>
                    {(() => {
                      const activeMode = localStorage.getItem("active_profile_mode") || "user";
                      const isBrandRegistered = localStorage.getItem("brand_registered") === "true";

                      const handleDropdownToggle = () => {
                        setShowProfileMenu(false);
                        if (activeMode === "brand") {
                          localStorage.setItem("active_profile_mode", "user");
                          setLocation("/feed");
                          toast.success("Switched to User Account 👤");
                        } else {
                          if (isBrandRegistered) {
                            localStorage.setItem("active_profile_mode", "brand");
                            setLocation("/brand");
                            toast.success("Switched to Brand Account 👗");
                          } else {
                            toast.error("Please create a Brand account in your profile first!");
                            setLocation("/profile");
                          }
                        }
                      };

                      return (
                        <button
                          onClick={handleDropdownToggle}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-accent transit-all text-left"
                        >
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {activeMode === "brand" ? "Switch to User Account" : "Switch to Brand Account"}
                          </span>
                        </button>
                      );
                    })()}
                    {toggleTheme && (
                      <button
                        onClick={() => { toggleTheme(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-accent transit-all text-left"
                      >
                        {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                      </button>
                    )}
                    <div className="h-px bg-border/30 my-1" />
                    <button
                      onClick={async () => {
                        setShowProfileMenu(false);
                        try {
                          await logout();
                          toast.success("Logged out successfully");
                          setLocation("/auth");
                        } catch (e: any) {
                          toast.error("Failed to log out: " + e.message);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transit-all text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Content + Right Panel ── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Page content */}
            <main className={`flex-1 overflow-y-auto ${fullWidth ? "" : ""}`}>
              {children}
            </main>

            {/* ── Right Panel (desktop only) — AI Recommended ── */}
            {showRightPanel && (
              <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-border/30 bg-white dark:bg-[#161616] overflow-y-auto no-scrollbar">

                {/* Header */}
                <div className="p-5 border-b border-border/20 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">Recommended for You</h3>
                    <p className="text-[10px] text-muted-foreground">Powered by Styly AI ✨</p>
                  </div>
                </div>

                {/* AI Picks */}
                <div className="p-4 space-y-3">
                  {TRENDING_ITEMS.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/50 cursor-pointer transit-all group border border-transparent hover:border-primary/10 animate-fade-up"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/30 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transit-all"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        {/* AI match badge */}
                        <span className="absolute bottom-0 right-0 bg-primary text-white text-[7px] font-bold px-1 rounded-tl-md">
                          AI ✓
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate">{item.name}</p>
                        <p className="text-primary font-bold text-xs mt-0.5">{item.price} TND</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Heart className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
                          <span className="text-[10px] text-muted-foreground">{item.likes} likes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loading skeletons section — "More loading…" */}
                <div className="px-4 pb-4 border-t border-border/20 pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> Analysing your style…
                  </p>
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                          <div className="skeleton h-2.5 w-3/4" />
                          <div className="skeleton h-2 w-1/2" />
                          <div className="skeleton h-2 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground mt-4 leading-relaxed">
                    Styly AI learns from your likes, tries, and wardrobe to surface perfect picks 🤍
                  </p>
                </div>
              </aside>
            )}

          </div>

          {/* ── Mobile Bottom Tab Bar ── */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/75 dark:bg-[#161616]/75 glassmorphic border-t border-border/30 h-16 flex items-center justify-around px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = activePath === href;
              return (
                <button
                  key={href}
                  onClick={() => setLocation(href)}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 transit-all ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && <div className="h-1 w-1 rounded-full bg-primary mb-0.5" />}
                  <Icon className="h-5 w-5" />
                  <span className={`text-[9px] font-semibold`}>{label}</span>
                </button>
              );
            })}
            {/* Cart tab on mobile */}
            <button
              onClick={() => setShowBag(true)}
              className="flex flex-col items-center justify-center gap-1 flex-1 text-muted-foreground hover:text-foreground relative transit-all"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-[9px] font-semibold">Bag</span>
              {bagCount > 0 && (
                <span className="absolute top-0.5 right-2 h-3.5 w-3.5 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">
                  {bagCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* ── Heart / Likes Drawer ── */}
        {showHeartDrawer && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHeartDrawer(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#1A1A1A] shadow-2xl flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                  <h2 className="font-bold text-base">Activity</h2>
                  {heartNotifs.length > 0 && (
                    <span className="bg-rose-500/10 text-rose-500 text-xs font-bold rounded-full px-2 py-0.5">{heartNotifs.length}</span>
                  )}
                </div>
                <button onClick={() => setShowHeartDrawer(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {heartNotifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-20 text-center px-6">
                    <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                      <Heart className="h-7 w-7 text-rose-300" />
                    </div>
                    <p className="font-semibold text-sm">No activity yet</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">When someone likes your post or a brand approves your tag, it will appear here.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {/* Section: Likes */}
                    {heartNotifs.filter((n: any) => n.type === "like").length > 0 && (
                      <>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pt-1 pb-1">❤️ Post Likes</p>
                        {heartNotifs.filter((n: any) => n.type === "like").map((notif: any, i: number) => (
                          <div
                            key={notif.id || i}
                            className="flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-muted/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transit-all animate-fade-up"
                          >
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center shrink-0 text-white">
                              <Heart className="h-4 w-4 fill-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold leading-snug">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <span>{notif.postOwner}</span>
                                <span>·</span>
                                <span>{new Date(notif.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Section: Brand Tag Approvals */}
                    {heartNotifs.filter((n: any) => n.type === "brand_approval").length > 0 && (
                      <>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pt-3 pb-1">🏷️ Brand Tag Status</p>
                        {heartNotifs.filter((n: any) => n.type === "brand_approval").map((notif: any, i: number) => (
                          <div
                            key={notif.id || i}
                            className={`flex items-start gap-3 p-3 rounded-xl border transit-all animate-fade-up ${
                              notif.status === "approved"
                                ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10"
                                : notif.status === "rejected"
                                ? "border-red-200 bg-red-50/50 dark:bg-red-900/10"
                                : "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10"
                            }`}
                          >
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm ${
                              notif.status === "approved" ? "bg-emerald-500" : notif.status === "rejected" ? "bg-red-500" : "bg-amber-500"
                            }`}>
                              {notif.status === "approved" ? "✅" : notif.status === "rejected" ? "❌" : "⏳"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold leading-snug">{notif.brandName || "Brand"}</p>
                              <p className="text-[10px] mt-0.5 leading-relaxed font-medium">
                                {notif.status === "approved"
                                  ? "✅ Tag approved! Your post is now featured on their page."
                                  : notif.status === "rejected"
                                  ? "❌ Tag was declined by the brand."
                                  : "⏳ Tag is pending brand approval."}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(notif.time).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Demo brand approval entries for visualization */}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pt-3 pb-1">🏷️ Recent Tags</p>
                    {[
                      { brand: "Queen Rania Collection", status: "approved", ago: "2h ago" },
                      { brand: "Urban Threads", status: "pending", ago: "5h ago" },
                      { brand: "Kenzo Luxury", status: "rejected", ago: "1d ago" },
                    ].map((tag, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl border transit-all ${
                          tag.status === "approved"
                            ? "border-emerald-200/70 bg-emerald-50/30 dark:bg-emerald-900/10"
                            : tag.status === "rejected"
                            ? "border-red-200/70 bg-red-50/30 dark:bg-red-900/10"
                            : "border-amber-200/70 bg-amber-50/30 dark:bg-amber-900/10"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-white ${
                          tag.status === "approved" ? "bg-emerald-500" : tag.status === "rejected" ? "bg-red-500" : "bg-amber-500"
                        }`}>
                          {tag.brand[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{tag.brand}</p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${
                            tag.status === "approved" ? "text-emerald-600" : tag.status === "rejected" ? "text-red-500" : "text-amber-600"
                          }`}>
                            {tag.status === "approved" ? "✅ Tag Approved" : tag.status === "rejected" ? "❌ Tag Declined" : "⏳ Pending Approval"}
                          </p>
                        </div>
                        <span className="text-[9px] text-muted-foreground shrink-0">{tag.ago}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Notification Drawer ── */}

        {showNotifDrawer && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotifDrawer(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#1A1A1A] shadow-2xl flex flex-col animate-slide-in-right">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-base">Notifications</h2>
                  {notifications.length > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-bold rounded-full px-2 py-0.5">{notifications.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-semibold text-primary hover:underline transit-all">Mark all read</button>
                  )}
                  <button onClick={() => setShowNotifDrawer(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="font-semibold text-sm">No notifications yet</p>
                    <p className="text-xs text-muted-foreground">Like posts to see activity here</p>
                  </div>
                ) : (
                  notifications.map((notif: any, i: number) => (
                    <div
                      key={notif.id || i}
                      className={`flex items-start gap-3 p-3 rounded-xl border transit-all animate-fade-up ${
                        notif.read ? "border-border/20 bg-muted/30" : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                        {notif.type === "like" ? <Heart className="h-4 w-4 fill-white" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(notif.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Shopping Bag Slide-in Panel ── */}
        {showBag && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowBag(false)}
            />
            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#1A1A1A] shadow-2xl flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-base">My Bag</h2>
                  {bagCount > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-bold rounded-full px-2 py-0.5">
                      {bagCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowBag(false)}
                  className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Order Placed Success State */}
              {orderPlaced ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-extrabold text-lg text-emerald-600">Order Placed! 🎉</p>
                    <p className="text-xs text-muted-foreground mt-1">Your order is being processed. Check your profile for updates.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {bagItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                          <ShoppingBag className="h-9 w-9 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Your bag is empty</p>
                          <p className="text-xs text-muted-foreground mt-1">Add items from the feed or shop</p>
                        </div>
                        <button
                          onClick={() => { setShowBag(false); setLocation("/shop"); }}
                          className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transit-all"
                        >
                          Browse Shop
                        </button>
                      </div>
                    ) : (
                      bagItems.map((item) => (
                        <div key={`${item.id}-${item.size}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30 animate-fade-up">
                          <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/30">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Size: {item.size}</p>
                            <p className="text-primary font-bold text-xs mt-1">{(item.price * item.qty).toLocaleString()} TND</p>
                            {/* Qty controls */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <button
                                onClick={() => updateQty(item.id, item.size, -1)}
                                className="h-5 w-5 rounded-full bg-muted border border-border/40 flex items-center justify-center hover:border-primary/40 transit-all"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, item.size, 1)}
                                className="h-5 w-5 rounded-full bg-muted border border-border/40 flex items-center justify-center hover:border-primary/40 transit-all"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromBag(item.id)}
                            className="h-7 w-7 rounded-full hover:bg-red-500/10 flex items-center justify-center transit-all shrink-0"
                          >
                            <X className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {bagItems.length > 0 && (
                    <div className="p-4 border-t border-border/30 space-y-3">
                      {/* Order summary */}
                      <div className="space-y-1.5 pb-2 border-b border-border/20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Subtotal ({bagCount} item{bagCount !== 1 ? "s" : ""})</span>
                          <span className="font-semibold">{bagTotal.toLocaleString()} TND</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping</span>
                          <span className="font-semibold">{shipping.toFixed(2)} TND</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Total</span>
                        <span className="text-xl font-black text-primary">{orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND</span>
                      </div>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                        className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-bold text-sm hover:opacity-95 hover:scale-[1.01] transit-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                      >
                        {isPlacingOrder ? (
                          <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Placing Order…</>
                        ) : (
                          <><Package className="h-4 w-4" /> Place Order — {orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND</>
                        )}
                      </button>
                      <button
                        onClick={clearBag}
                        className="w-full h-9 text-xs text-muted-foreground hover:text-red-500 transit-all font-medium"
                      >
                        Clear bag
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Close profile menu on outside click */}
        {showProfileMenu && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowProfileMenu(false)}
          />
        )}
      </div>
    </>
  );
}
