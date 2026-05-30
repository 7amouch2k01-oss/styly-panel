import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: any;
}

export function DeviceFormDialog({ open, onOpenChange, device }: DeviceFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const createMutation = trpc.devices.create.useMutation();
  const updateMutation = trpc.devices.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || "",
        category: device.category || "",
        price: device.price || 0,
        stock: device.stock || 0,
        description: device.description || "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        price: 0,
        stock: 0,
        description: "",
      });
    }
  }, [device, open]);

  const handleSubmit = async () => {
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
      toast.success(device ? "Product updated successfully" : "Product created successfully");
      onOpenChange(false);
      setFormData({ name: "", category: "", price: 0, stock: 0, description: "" });
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{device ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Clothing, Shoes, Accessories"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
