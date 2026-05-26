import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LogOut, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    userNotifications: true,
    deviceNotifications: true,
    twoFactorAuth: false,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your admin profile and application preferences
        </p>
      </div>

      {/* Admin Profile */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>
            Your account information and profile settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={user?.name || ""}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={user?.role || ""}
              disabled
              className="bg-muted/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates for important events
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-medium">Order Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new orders are placed
                </p>
              </div>
              <Switch
                checked={settings.orderNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, orderNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-medium">User Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new users register
                </p>
              </div>
              <Switch
                checked={settings.userNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, userNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-medium">Device Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about device inventory changes
                </p>
              </div>
              <Switch
                checked={settings.deviceNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, deviceNotifications: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="flex flex-col gap-1">
              <Label className="text-base font-medium">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, twoFactorAuth: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Settings Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Logout Section */}
      <Separator className="bg-border/50" />
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-destructive">Sign Out</CardTitle>
          <CardDescription>
            Sign out of your admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
