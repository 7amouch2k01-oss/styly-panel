import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    brandId: "" as string | number,
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data: brands = [] } = trpc.brands.list.useQuery();
  const createMutation = trpc.devices.create.useMutation();
  const updateMutation = trpc.devices.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: typeof product.price === "string" ? parseFloat(product.price) : (product.price || 0),
        stock: typeof product.stock === "string" ? parseInt(product.stock, 10) : (product.stock || 0),
        brandId: product.brandId ? String(product.brandId) : "",
        description: product.description || "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        price: 0,
        stock: 0,
        brandId: "",
        description: "",
      });
    }
  }, [product, open]);

  const handleSubmit = async () => {
    const parsedPrice = Number(formData.price);
    const parsedStock = Number(formData.stock);

    if (!formData.name || !formData.category || parsedPrice <= 0) {
      toast.error("Please fill in all required fields and ensure price is positive");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        category: formData.category,
        price: parsedPrice,
        stock: parsedStock,
        brandId: formData.brandId ? Number(formData.brandId) : null,
        description: formData.description,
      };

      if (product) {
        await updateMutation.mutateAsync({
          id: product.id,
          ...payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      await utils.devices.list.invalidate();
      toast.success(product ? "Product updated successfully" : "Product created successfully");
      onOpenChange(false);
      setFormData({ name: "", category: "", price: 0, stock: 0, brandId: "", description: "" });
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
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
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
          <div>
            <Label htmlFor="brandId">Brand (Optional)</Label>
            <Select
              value={formData.brandId ? String(formData.brandId) : "none"}
              onValueChange={(val) => setFormData({ ...formData, brandId: val === "none" ? "" : val })}
            >
              <SelectTrigger id="brandId">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / No Brand</SelectItem>
                {brands.map((b: any) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
