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

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: any;
}

export function BrandFormDialog({ open, onOpenChange, brand }: BrandFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    category: "Mixed",
  });
  const [isSaving, setIsSaving] = useState(false);

  const createMutation = trpc.brands.create.useMutation();
  const updateMutation = trpc.brands.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || "",
        country: brand.country || "",
        category: brand.category || "Mixed",
      });
    } else {
      setFormData({
        name: "",
        country: "",
        category: "Mixed",
      });
    }
  }, [brand, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.country.trim() || !formData.category) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      if (brand) {
        await updateMutation.mutateAsync({
          id: brand.id,
          name: formData.name.trim(),
          country: formData.country.trim(),
          category: formData.category,
        });
        toast.success("Brand updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          country: formData.country.trim(),
          category: formData.category,
        });
        toast.success("Brand created successfully");
      }
      await utils.brands.list.invalidate();
      onOpenChange(false);
      setFormData({ name: "", country: "", category: "Mixed" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save brand");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Nike, Adidas, Zara"
            />
          </div>
          <div>
            <Label htmlFor="brand-country">Country</Label>
            <Input
              id="brand-country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g., USA, Germany, Tunisia"
            />
          </div>
          <div>
            <Label htmlFor="brand-category">Main Category</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger id="brand-category">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Shoes">Shoes</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
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
