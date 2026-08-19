import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, MoreHorizontal, ShieldCheck, Crown, Sparkles, User, Award, Ban,
  CheckCircle2, UserCheck, Flame, Shield, Building2, Key, Check, X, SlidersHorizontal
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { UserDetailDialog } from "@/components/UserDetailDialog";
import { UserFormDialog } from "@/components/UserFormDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard & Metrics", desc: "View executive platform KPI overview" },
  { id: "users", label: "Users & Accounts", desc: "Manage registered members and status" },
  { id: "products", label: "Posts & Products", desc: "Moderate outfits, tagged items and feed" },
  { id: "orders", label: "Orders & Delivery", desc: "Manage consumer orders and status changes" },
  { id: "analytics", label: "Financial Analytics", desc: "Access revenue, profits and sales reports" },
  { id: "brands", label: "Brands Directory", desc: "Verify brand profiles and approvals" },
  { id: "settings", label: "System Settings", desc: "Access administrative settings" },
];

export default function Users() {
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const { data: brands = [] } = trpc.brands.list.useQuery();

  const [activeTab, setActiveTab] = useState<"app" | "team">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") === "team" ? "team" : "app";
    }
    return "app";
  });

  const [appUserSubFilter, setAppUserSubFilter] = useState<"all" | "creators" | "normal">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  // Permission Management Dialog for Styly Members
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permUser, setPermUser] = useState<any>(null);
  const [userPerms, setUserPerms] = useState<string[]>([]);

  const updateRoleMutation = trpc.users.updateRole.useMutation();
  const updateStatusMutation = trpc.users.updateStatus.useMutation();
  const updatePermissionsMutation = trpc.users.updatePermissions.useMutation();
  const utils = trpc.useUtils();

  // Listen to URL search param changes
  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get("tab") === "team" ? "team" : "app");
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const handleOpenPermissions = (adminMember: any) => {
    setPermUser(adminMember);
    setUserPerms(adminMember.permissions || ["dashboard", "users", "products", "orders", "analytics", "brands", "settings"]);
    setPermDialogOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    if (userPerms.includes(permId)) {
      setUserPerms(userPerms.filter(p => p !== permId));
    } else {
      setUserPerms([...userPerms, permId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!permUser) return;
    try {
      await updatePermissionsMutation.mutateAsync({
        userId: permUser.id,
        permissions: userPerms,
      });
      await utils.users.list.invalidate();
      toast.success(`Updated permissions for ${permUser.name || permUser.email}`);
      setPermDialogOpen(false);
    } catch {
      toast.error("Failed to update admin permissions");
    }
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  };

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await updateRoleMutation.mutateAsync({
        userId: user.id,
        role: newRole,
      });
      await utils.users.list.invalidate();
      toast.success(`Updated role for ${user.name || user.email} to ${newRole}`);
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const handleToggleStatus = async (user: any, newStatus: "active" | "inactive" | "banned") => {
    try {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        status: newStatus,
      });
      await utils.users.list.invalidate();
      toast.success(`User ${user.name || user.email} is now ${newStatus}`);
    } catch {
      toast.error("Failed to update user status");
    }
  };

  // Classify users
  const stylyMembers = users.filter((u: any) => u.role === "admin");
  const appUsers = users.filter((u: any) => u.role !== "admin");

  // Filter based on active tab and search
  const currentList = activeTab === "team" ? stylyMembers : appUsers;

  const filteredUsers = currentList.filter((user: any) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "app") {
      const isCreatorOrBrand = (user.grade || 1) >= 2 || (user.stylePoints || 0) > 100;
      if (appUserSubFilter === "creators") return isCreatorOrBrand;
      if (appUserSubFilter === "normal") return !isCreatorOrBrand;
    }

    return true;
  });

  // Overview metrics calculations
  const totalMembers = users.length;
  const brandCreatorsCount = appUsers.filter((u: any) => (u.grade || 1) >= 2 || (u.stylePoints || 0) > 100).length;
  const normalShoppersCount = appUsers.length - brandCreatorsCount;
  const adminMembersCount = stylyMembers.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Users & Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Segmented app directory for consumer shoppers, brand creators, and Styly admin team access.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/40">
          <button
            onClick={() => {
              setActiveTab("app");
              window.history.replaceState(null, "", "/admin/users?tab=app");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "app"
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            App Users ({appUsers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("team");
              window.history.replaceState(null, "", "/admin/users?tab=team");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "team"
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4 text-amber-500" />
            Styly Members ({stylyMembers.length})
          </button>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Registered</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : totalMembers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Platform-wide active accounts</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Brands & Creators</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-orange-500">{isLoading ? <Skeleton className="h-8 w-16" /> : brandCreatorsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Influencers & brand partners</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Normal Shoppers</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{isLoading ? <Skeleton className="h-8 w-16" /> : normalShoppersCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">End-consumer accounts</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Styly Admins</CardTitle>
              <Crown className="h-4 w-4 text-amber-500 fill-amber-500/20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : adminMembersCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Authorized panel moderators</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Sub-filters */}
      <div className="flex gap-4 flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-1 w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "team" ? "Search admin staff..." : "Search users by name or email..."}
            className="pl-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === "app" && (
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40 text-xs font-semibold">
            <button
              onClick={() => setAppUserSubFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                appUserSubFilter === "all" ? "bg-background shadow-sm font-bold" : "text-muted-foreground"
              }`}
            >
              All App Users
            </button>
            <button
              onClick={() => setAppUserSubFilter("creators")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                appUserSubFilter === "creators" ? "bg-background shadow-sm font-bold text-orange-500" : "text-muted-foreground"
              }`}
            >
              Brands & Creators
            </button>
            <button
              onClick={() => setAppUserSubFilter("normal")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                appUserSubFilter === "normal" ? "bg-background shadow-sm font-bold text-emerald-500" : "text-muted-foreground"
              }`}
            >
              Normal Users
            </button>
          </div>
        )}

        <Button className="gap-2 rounded-xl shrink-0" onClick={handleAddUser}>
          <Plus className="h-4 w-4" />
          {activeTab === "team" ? "Add Admin Member" : "Add User"}
        </Button>
      </div>

      {/* Main Table */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[280px]">Account / Identity</TableHead>
                <TableHead>{activeTab === "team" ? "Admin Role & Permissions" : "User Type"}</TableHead>
                <TableHead>{activeTab === "team" ? "Permissions Summary" : "Creator Grade / XP"}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-10 w-44 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No accounts found matching your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => {
                  const isCreator = (user.grade || 1) >= 2 || (user.stylePoints || 0) > 100;
                  const perms = user.permissions || ["dashboard", "users", "products", "orders", "analytics", "brands", "settings"];

                  return (
                    <TableRow key={user.id} className="border-border/50 hover:bg-muted/30 transition">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-rose-500/20 to-orange-500/20 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-foreground">{user.name || "Anonymous Member"}</p>
                              {user.role === "admin" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black tracking-wider uppercase">
                                  <Crown size={10} className="fill-amber-500" />
                                  Admin Staff
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.email || user.openId}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {activeTab === "team" ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold w-fit">
                              Styly Panel Admin
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {perms.length} Access Areas Granted
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isCreator ? (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 font-bold flex items-center gap-1">
                                <Flame className="h-3 w-3" /> Brand Creator
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground font-medium">
                                Normal Consumer
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {activeTab === "team" ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {perms.slice(0, 4).map((p: string) => (
                              <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-mono">
                                {p}
                              </span>
                            ))}
                            {perms.length > 4 && (
                              <span className="text-[10px] text-muted-foreground font-semibold">+{perms.length - 4} more</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                              <Award size={12} />
                              Grade {user.grade || 1}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {user.stylePoints || 0} XP
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            (user.status || "active") === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : (user.status === "banned" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-gray-500/10 text-gray-400 border-gray-500/30")
                          }
                        >
                          {user.status || "active"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)} className="text-xs font-semibold cursor-pointer">
                              View Profile Overview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="text-xs font-semibold cursor-pointer">
                              Edit Details & Password
                            </DropdownMenuItem>
                            
                            {user.role === "admin" ? (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenPermissions(user)} className="text-xs font-semibold text-purple-500 cursor-pointer">
                                  <Key className="h-3.5 w-3.5 mr-1.5" />
                                  Manage Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleRole(user)} className="text-xs font-semibold text-amber-500 cursor-pointer">
                                  Demote to App User
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleRole(user)} className="text-xs font-semibold text-amber-500 cursor-pointer">
                                <Crown className="h-3.5 w-3.5 mr-1.5" />
                                Promote to Styly Admin
                              </DropdownMenuItem>
                            )}

                            {(user.status || "active") !== "banned" ? (
                              <DropdownMenuItem onClick={() => handleToggleStatus(user, "banned")} className="text-xs font-semibold text-rose-500 focus:text-rose-500 cursor-pointer">
                                <Ban className="h-3.5 w-3.5 mr-1.5" />
                                Ban Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleStatus(user, "active")} className="text-xs font-semibold text-emerald-500 focus:text-emerald-500 cursor-pointer">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Unban Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Styly Member Permission Management Dialog */}
      {permUser && (
        <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                Staff Permissions: {permUser.name || permUser.email}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                As the Owner, configure which admin panel modules and features this team member can access and moderate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-1">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isSelected = userPerms.includes(perm.id);
                return (
                  <div
                    key={perm.id}
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{perm.label}</p>
                      <p className="text-[11px] text-muted-foreground">{perm.desc}</p>
                    </div>
                    <div
                      className={`h-6 w-6 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-border/60 bg-background"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2.5 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPermDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-orange-500 text-white"
              >
                {updatePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialogs */}
      <UserDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        user={selectedUser}
      />
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
