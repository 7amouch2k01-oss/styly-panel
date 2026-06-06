import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    status: "active",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const createMutation = trpc.users.create.useMutation();
  const updateMutation = trpc.users.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active",
        password: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "user",
        status: "active",
        password: "",
      });
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      toast.error("Please fill in name, email, and role");
      return;
    }

    if (!user && (!formData.password || formData.password.length < 6)) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      if (user) {
        await updateMutation.mutateAsync({
          id: user.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role as "admin" | "user",
          status: formData.status as "active" | "inactive" | "banned",
          password: formData.password ? formData.password : undefined,
        });
        toast.success("User updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role as "admin" | "user",
          password: formData.password,
        });
        toast.success("User created successfully");
      }
      await utils.users.list.invalidate();
      onOpenChange(false);
      setFormData({ name: "", email: "", role: "user", status: "active", password: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User Details" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-name">Full Name</Label>
            <Input
              id="user-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div>
            <Label htmlFor="user-email">Email Address</Label>
            <Input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., jane@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user && (
              <div>
                <Label htmlFor="user-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="user-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="user-pwd">
              Password {user && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="user-pwd"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={user ? "••••••••" : "Minimum 6 characters"}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
