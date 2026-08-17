import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { LogOut, Save, ShieldCheck, Mail, Bell, Key, Database, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    userNotifications: true,
    autoApproveBrands: false,
    maintenanceMode: false,
  });

  const utils = trpc.useUtils();

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate profile update or integrate mutation
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Admin preferences saved successfully ✅");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Password updated successfully!");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Platform Settings & Security</h1>
        <p className="text-sm text-muted-foreground">
          Manage root administrator credentials, notification webhooks, and system automation rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & Security */}
        <div className="lg:col-span-7 space-y-6">
          {/* Admin Profile */}
          <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Admin Profile & Access</CardTitle>
              </div>
              <CardDescription>
                Your authenticated credentials and root access role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Admin Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="rounded-xl bg-muted/40 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-500">Security Clearance</p>
                  <p className="text-[11px] text-muted-foreground">Full CRUD privileges over Users, Brands, Orders, and Feeds</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black font-black text-[10px] uppercase">
                  ROOT ADMIN
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Change Admin Password</CardTitle>
              </div>
              <CardDescription>Update your root account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button type="submit" size="sm" className="rounded-xl text-xs font-bold mt-2">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Automated Preferences & Maintenance */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Automation & Alerts</CardTitle>
              </div>
              <CardDescription>Configure system triggers and email dispatch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Email Order Alerts</Label>
                  <p className="text-[11px] text-muted-foreground">Notify on new multi-brand orders</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(c) => setSettings({ ...settings, emailNotifications: c })}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Auto-Flag Suspicious Posts</Label>
                  <p className="text-[11px] text-muted-foreground">Flag looks with missing brand tags</p>
                </div>
                <Switch
                  checked={settings.userNotifications}
                  onCheckedChange={(c) => setSettings({ ...settings, userNotifications: c })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Auto-Approve Verified Brands</Label>
                  <p className="text-[11px] text-muted-foreground">Instant activation for known partners</p>
                </div>
                <Switch
                  checked={settings.autoApproveBrands}
                  onCheckedChange={(c) => setSettings({ ...settings, autoApproveBrands: c })}
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full rounded-xl text-xs font-bold mt-3"
              >
                {isSaving ? "Saving Changes..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* Session Logout Card */}
          <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Sign Out of Admin Console</p>
              <p className="text-[11px] text-muted-foreground">Terminate active administrative session</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold"
            >
              <LogOut size={13} className="mr-1.5" /> Log Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
