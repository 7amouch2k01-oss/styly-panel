import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal, ShieldCheck, Crown, Sparkles, User, Award, Ban, CheckCircle2, UserCheck, Flame } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { UserDetailDialog } from "@/components/UserDetailDialog";
import { UserFormDialog } from "@/components/UserFormDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Users() {
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const updateRoleMutation = trpc.users.updateRole.useMutation();
  const updateStatusMutation = trpc.users.updateStatus.useMutation();
  const utils = trpc.useUtils();

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

  const filteredUsers = users.filter((user: any) =>
    (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overview metrics calculations
  const totalUsers = users.length;
  const adminCount = users.filter((u: any) => u.role === "admin").length;
  const activeCount = users.filter((u: any) => (u.status || "active") === "active").length;
  const eliteCreators = users.filter((u: any) => (u.grade || 1) >= 3).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Users & Creators Directory</h1>
        <p className="text-sm text-muted-foreground">
          Real-time member registry, creator progression grades, and permission controls.
        </p>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Members</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : totalUsers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Verified & registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Shoppers</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{isLoading ? <Skeleton className="h-8 w-16" /> : activeCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Non-banned active status</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">System Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : adminCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Privileged root administrators</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Elite Creators</CardTitle>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-500">{isLoading ? <Skeleton className="h-8 w-16" /> : eliteCreators}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Grade 3+ Style Influencers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or openId..."
            className="pl-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="gap-2 rounded-xl" onClick={handleAddUser}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[280px]">User / Email</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Creator Grade</TableHead>
                <TableHead>Style Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-10 w-44 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No users matching "{searchQuery}" found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id} className="border-border/50 hover:bg-muted/30 transition">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-rose-500/20 to-orange-500/20 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                          {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-sm text-foreground">{user.name || "Anonymous Member"}</p>
                            {user.role === "admin" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black tracking-wider uppercase">
                                <Crown size={11} className="fill-amber-500" />
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.email || user.openId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={user.role === "admin" ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold" : "bg-muted text-muted-foreground font-medium"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                          <Award size={12} />
                          Grade {user.grade || 1}: {user.gradeTitle || "Newcomer"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                        <Sparkles size={12} className="text-primary" />
                        {user.stylePoints || 0} XP
                      </div>
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
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)} className="text-xs font-semibold cursor-pointer">
                            View Full Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)} className="text-xs font-semibold cursor-pointer">
                            Edit User Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleRole(user)} className="text-xs font-semibold cursor-pointer">
                            {user.role === "admin" ? "Demote to Standard User" : "👑 Promote to Admin"}
                          </DropdownMenuItem>
                          {(user.status || "active") !== "banned" ? (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user, "banned")} className="text-xs font-semibold text-rose-500 focus:text-rose-500 cursor-pointer">
                              <Ban className="h-3.5 w-3.5 mr-1.5" />
                              Ban User Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user, "active")} className="text-xs font-semibold text-emerald-500 focus:text-emerald-500 cursor-pointer">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              Unban User Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
