import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
  } | null;
}

export function DeviceFormDialog({ open, onOpenChange, device }: DeviceFormDialogProps) {
  const [formData, setFormData] = useState({
    name: device?.name || "",
    category: device?.category || "",
    price: device?.price || 0,
    stock: device?.stock || 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const createMutation = trpc.devices.create.useMutation();
  const updateMutation = trpc.devices.update.useMutation();
  const utils = trpc.useUtils();

  const handleSave = async () => {
    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      if (device) {
        await updateMutation.mutateAsync({
          id: device.id,
          name: formData.name,
          category: formData.category,
          price: formData.price,
          stock: formData.stock,
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          category: formData.category,
          price: formData.price,
          stock: formData.stock,
        });
      }
      await utils.devices.list.invalidate();
      toast.success(device ? "Device updated successfully" : "Device created successfully");
      onOpenChange(false);
      setFormData({ name: "", category: "", price: 0, stock: 0 });
    } catch (error) {
      toast.error("Failed to save device");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add New Device"}</DialogTitle>
          <DialogDescription>
            {device ? "Update device information" : "Create a new device entry"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Device Name</Label>
            <Input
              id="name"
              placeholder="e.g., iPhone 15 Pro"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apple">Apple</SelectItem>
                <SelectItem value="Samsung">Samsung</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="OnePlus">OnePlus</SelectItem>
                <SelectItem value="Xiaomi">Xiaomi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              placeholder="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Device"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
