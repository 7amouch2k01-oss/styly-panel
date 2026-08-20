import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Eye } from "lucide-react";
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
    role: "admin",
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
        role: user.role || "admin",
        status: user.status || "active",
        password: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "admin",
        status: "active",
        password: "",
      });
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in full name and email address");
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
        toast.success("Admin details updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: "admin",
          password: formData.password,
          permissions: ["dashboard"], // View-only overview by default
        });
        toast.success("Styly Admin Member created with View-Only permissions! 🛡️");
      }
      await utils.users.list.invalidate();
      onOpenChange(false);
      setFormData({ name: "", email: "", role: "admin", status: "active", password: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save Styly member");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            {user ? "Edit Admin Staff Details" : "Create New Styly Member"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {user
              ? "Update administrator profile details, status, or credentials."
              : "Create a new Styly admin staff member. They will start with View-Only (Dashboard) access. Admins can grant additional permissions anytime."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="user-name" className="text-xs font-bold">Admin Member Full Name</Label>
            <Input
              id="user-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Alex Johnson"
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="user-email" className="text-xs font-bold">Admin Email Address</Label>
            <Input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., alex@styly.com"
              className="mt-1 rounded-xl"
            />
          </div>

          {!user ? (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
              <Eye className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-foreground">
                <span className="font-bold text-amber-500">Initial View-Only Access:</span> Newly created Styly members are granted <strong>Dashboard Overview</strong> read access only. You can expand their permissions anytime via the <span className="underline font-semibold">Manage Permissions</span> action.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-role" className="text-xs font-bold">Account Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger id="user-role" className="mt-1 rounded-xl">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Styly Admin</SelectItem>
                    <SelectItem value="user">Demoted User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user-status" className="text-xs font-bold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="user-status" className="mt-1 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="user-pwd" className="text-xs font-bold">
              Account Password {user && <span className="text-xs font-normal text-muted-foreground">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="user-pwd"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={user ? "••••••••" : "Minimum 6 characters"}
              className="mt-1 rounded-xl"
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-border/20">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-orange-500 text-white">
              {isSaving ? "Saving..." : (user ? "Save Changes" : "Create Styly Member")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
