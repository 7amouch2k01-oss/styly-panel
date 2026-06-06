import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UpdateStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

export function UpdateStockDialog({ open, onOpenChange, product }: UpdateStockDialogProps) {
  const [stock, setStock] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const updateMutation = trpc.devices.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (product) {
      setStock(typeof product.stock === "string" ? parseInt(product.stock, 10) : (product.stock || 0));
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedStock = Number(stock);
    if (parsedStock < 0) {
      toast.error("Stock count cannot be negative");
      return;
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: product.id,
        stock: parsedStock,
      });
      await utils.devices.list.invalidate();
      toast.success("Stock updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update stock");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Update stock level for <span className="font-semibold text-foreground">{product?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="stock-level">Current Stock Level</Label>
            <Input
              id="stock-level"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              placeholder="0"
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
