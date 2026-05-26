import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: number;
    customerName: string;
    customerEmail: string;
    status: "pending" | "processing" | "shipped" | "delivered";
    totalAmount: number;
    itemCount: number;
    createdAt: Date;
  } | null;
}

export function OrderDetailDialog({ open, onOpenChange, order }: OrderDetailDialogProps) {
  const [status, setStatus] = useState(order?.status || "pending");
  const [isSaving, setIsSaving] = useState(false);
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const utils = trpc.useUtils();

  if (!order) return null;

  const getStatusColor = (s: string) => {
    switch (s) {
      case "pending":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "shipped":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "";
    }
  };

  const handleUpdateStatus = async () => {
    setIsSaving(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        status: status as "pending" | "processing" | "shipped" | "delivered",
      });
      await utils.orders.list.invalidate();
      toast.success("Order status updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id}</DialogTitle>
          <DialogDescription>
            Order details and status management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.customerEmail}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Order Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Items</p>
                <p className="font-medium">{order.itemCount}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">${order.totalAmount}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Current Status</p>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Status Update */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Update Status</h3>
            <Select value={status} onValueChange={(value) => setStatus(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
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
              Close
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isSaving}
            >
              {isSaving ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
