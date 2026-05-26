import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: number;
    name: string | null;
    email: string | null;
    role: "admin" | "user";
    createdAt: Date;
  } | null;
}

export function UserDetailDialog({ open, onOpenChange, user }: UserDetailDialogProps) {
  const [role, setRole] = useState<"admin" | "user">(user?.role || "user");
  const [status, setStatus] = useState("active");
  const [isSaving, setIsSaving] = useState(false);
  const updateRoleMutation = trpc.users.updateRole.useMutation();
  const updateStatusMutation = trpc.users.updateStatus.useMutation();

  if (!user) return null;

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (role !== user.role) {
        await updateRoleMutation.mutateAsync({
          userId: user.id,
          role: role as "admin" | "user",
        });
      }
      if (status !== "active") {
        await updateStatusMutation.mutateAsync({
          userId: user.id,
          status: status as "active" | "inactive" | "banned",
        });
      }
      toast.success("User updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View and manage user information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium mt-1">{user.name || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium mt-1">{user.email || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Member Since</Label>
              <p className="text-sm font-medium mt-1">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Role Management */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "admin" | "user")}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Management */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
