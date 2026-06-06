import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal } from "lucide-react";
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

  const handleDeactivateUser = async (user: any) => {
    try {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        status: "inactive",
      });
      await utils.users.list.invalidate();
      toast.success(`Deactivated user ${user.name || user.email}`);
    } catch {
      toast.error("Failed to deactivate user");
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={handleAddUser}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Total: {isLoading ? "..." : filteredUsers.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border/50 hover:bg-accent/5">
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            (user.status || "active") === "active"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : (user.status || "active") === "banned"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }
                        >
                          {user.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleRole(user)}>
                              Change Role
                            </DropdownMenuItem>
                            {(user.status || "active") === "active" && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivateUser(user)}>
                                Deactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <UserDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        user={selectedUser}
      />

      {/* User Form Dialog */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
