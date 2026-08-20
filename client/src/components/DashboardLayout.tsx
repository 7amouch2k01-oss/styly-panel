import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, ImageIcon, ShoppingCart, BarChart3, Settings, Moon, Sun, Package } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin", perm: "dashboard" },
  { icon: Users, label: "Users", path: "/admin/users", perm: "users" },
  { icon: ImageIcon, label: "Posts", path: "/admin/products", perm: "products" },
  { icon: ShoppingCart, label: "Orders", path: "/admin/orders", perm: "orders" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics", perm: "analytics" },
  { icon: Package, label: "Brands", path: "/admin/brands", perm: "brands" },
  { icon: Settings, label: "Settings", path: "/admin/settings", perm: "settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full border border-border/40 rounded-3xl bg-card/60 backdrop-blur-md shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl">
            S
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-center">
              Styly Admin Portal
            </h1>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Access to this console requires administrator authentication.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/auth";
            }}
            size="lg"
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold shadow-lg shadow-primary/20"
          >
            Sign in as Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  
  if (!toggleTheme) return null;
  
  return (
    <button
      onClick={toggleTheme}
      className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 shadow-sm border border-neutral-200/20">
                    <img src="/logo.png" alt="Styly Logo" className="h-full w-full object-cover" />
                  </div>
                  <span className="font-extrabold tracking-tight truncate text-primary text-base bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Styly
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems
                .filter(item => {
                  // Owner or root admin (or user without restricted permissions) can see everything
                  const currentUser = user as any;
                  if (!currentUser || currentUser.isOwner || currentUser.id === 1) return true;
                  const perms: string[] = currentUser.permissions || ["dashboard", "users", "products", "orders", "analytics", "brands", "settings"];
                  return perms.includes(item.perm);
                })
                .map(item => {
                if (item.path === "/admin/users") {
                  const isUsersActive = location.startsWith("/admin/users");
                  return (
                    <SidebarMenuItem key="users-dropdown">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            isActive={isUsersActive}
                            tooltip="Users & Team"
                            className={`h-10 transition-all font-normal w-full flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2">
                              <Users className={`h-4 w-4 ${isUsersActive ? "text-primary" : ""}`} />
                              <span>Users</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">▾</span>
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="right" className="w-56 rounded-2xl p-2 shadow-xl border border-border/40">
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Account Types
                          </div>
                          <DropdownMenuItem
                            onClick={() => {
                              setLocation("/admin/users?tab=app");
                              window.dispatchEvent(new CustomEvent("styly_users_tab_change", { detail: "app" }));
                            }}
                            className="flex items-center gap-2 rounded-xl text-xs font-semibold py-2 cursor-pointer"
                          >
                            <Users className="h-4 w-4 text-blue-500" />
                            <div className="flex flex-col">
                              <span>App Users</span>
                              <span className="text-[10px] text-muted-foreground font-normal">Brands, Creators & Shoppers only</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setLocation("/admin/users?tab=team");
                              window.dispatchEvent(new CustomEvent("styly_users_tab_change", { detail: "team" }));
                            }}
                            className="flex items-center gap-2 rounded-xl text-xs font-semibold py-2 cursor-pointer"
                          >
                            <Settings className="h-4 w-4 text-purple-500" />
                            <div className="flex flex-col">
                              <span>Styly Members</span>
                              <span className="text-[10px] text-muted-foreground font-normal">Admins only & permissions</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 gap-2">
            {!isMobile && (
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-border/40 bg-accent/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent">
                <span className="text-xs font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">Theme</span>
                <ThemeToggleButton />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
