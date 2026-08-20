import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Package, Truck, MapPin, RefreshCw, X, ChevronDown, ChevronRight,
  Eye, Check, Clock, CheckCircle2, AlertCircle, Ban, Undo2, ArrowUpRight, DollarSign, ShieldCheck
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

// ─── Status Configs ───────────────────────────────────────────────────────────

const ORDER_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending",          cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  processing:       { label: "Processing",       cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped:          { label: "Shipped",          cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  delivered:        { label: "Delivered",        cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  refund_requested: { label: "Refund Requested", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse" },
  refunded:         { label: "Refunded",         cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  canceled:         { label: "Canceled",         cls: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

const SHIP_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  pending:          { label: "Pending Order",      cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Clock },
  preparing:        { label: "Brand Preparing",    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",     icon: Package },
  ready_for_pickup: { label: "Brand Confirmed",    cls: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle2 },
  shipped:          { label: "Styly Dispatching",  cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Truck },
  delivered:        { label: "User Received",      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  refund_requested: { label: "Refund Requested",   cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: AlertCircle },
  refunded:         { label: "Refunded / Returned", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Undo2 },
  canceled:         { label: "Canceled",           cls: "bg-rose-500/20 text-rose-400 border-rose-500/30",     icon: Ban },
};

export default function Orders() {
  const { data: orders = [], isLoading, refetch } = trpc.delivery.adminListOrders.useQuery();
  const updateShipmentMutation = trpc.delivery.updateShipment.useMutation();
  const cancelOrderMutation = trpc.orders.cancelOrder.useMutation();
  const updateOrderStatusMutation = trpc.orders.updateStatus.useMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Cancellation modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filteredOrders = (orders as any[]).filter((o: any) => {
    const matchSearch =
      (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdminApproveDelivery = async (shipmentId: number) => {
    try {
      await updateShipmentMutation.mutateAsync({
        shipmentId,
        status: "delivered",
      });
      await refetch();
      toast.success(`Shipment #${shipmentId} approved as Delivered to Customer! 🎉`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update delivery");
    }
  };

  const handleAdminProcessRefund = async (orderId: number) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        status: "refunded",
        notes: "Admin approved customer return & refund.",
      });
      await refetch();
      toast.success(`Order #${orderId} marked as Refunded! 🔄`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process refund");
    }
  };

  const handleAdminRejectRefund = async (orderId: number) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        status: "delivered",
        notes: "Admin rejected refund claim. Kept as Delivered.",
      });
      await refetch();
      toast.info(`Refund for Order #${orderId} declined. Order remains Delivered.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject refund");
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    try {
      await cancelOrderMutation.mutateAsync({
        orderId: cancelModalOrder.id,
        reason: cancelReason || "Canceled by platform administration",
      });
      await refetch();
      toast.success(`Order #${cancelModalOrder.id} canceled. Customer has been notified.`);
      setCancelModalOrder(null);
      setCancelReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    }
  };

  // Overview metrics calculations
  const totalOrders = (orders as any[]).length;
  const pendingOrders = (orders as any[]).filter((o: any) => o.status === "pending" || o.status === "processing" || o.status === "shipped").length;
  const deliveredOrders = (orders as any[]).filter((o: any) => o.status === "delivered").length;
  const refundRequestedCount = (orders as any[]).filter((o: any) => o.status === "refund_requested").length;
  const refundedOrders = (orders as any[]).filter((o: any) => o.status === "refunded").length;
  const canceledOrders = (orders as any[]).filter((o: any) => o.status === "canceled").length;
  const totalGrossVolume = (orders as any[]).reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Orders & Multi-Brand Shipments</h1>
        <p className="text-sm text-muted-foreground">
          Track customer purchases, brand confirmation statuses, admin delivery approvals, and refund/cancellation requests.
        </p>
      </div>

      {/* 4 Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Placed</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : totalOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Gross volume: {totalGrossVolume.toFixed(0)} TND</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">In Transit / Active</CardTitle>
              <Truck className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : pendingOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Brand packed / out for delivery</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Delivered & Verified</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{isLoading ? <Skeleton className="h-8 w-16" /> : deliveredOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Received by customer</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Refunds & Claims</CardTitle>
              <Undo2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-purple-500">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${refundedOrders} / ${canceledOrders}`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {refundRequestedCount > 0 ? (
                <span className="text-amber-500 font-bold animate-pulse">{refundRequestedCount} refund request pending</span>
              ) : (
                `${refundedOrders} refunded · ${canceledOrders} canceled`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, email, or order #..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "processing", label: "Processing" },
            { id: "shipped", label: "Shipped" },
            { id: "delivered", label: "Delivered" },
            { id: "refund_requested", label: `Refund Claims ${refundRequestedCount > 0 ? `(${refundRequestedCount})` : ""}` },
            { id: "refunded", label: "Refunded" },
            { id: "canceled", label: "Canceled" },
          ].map((st) => (
            <Button
              key={st.id}
              variant={statusFilter === st.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st.id)}
              className={`rounded-xl text-xs font-bold ${
                st.id === "refund_requested" && refundRequestedCount > 0 ? "border-amber-500/50 text-amber-500" : ""
              }`}
            >
              {st.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List with Per-Brand Shipments Breakdown */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
        ) : filteredOrders.length === 0 ? (
          <Card className="border border-dashed border-border/50 bg-card/40 rounded-3xl py-12 text-center text-muted-foreground">
            No orders match your filter.
          </Card>
        ) : (
          filteredOrders.map((order: any) => {
            const orderCfg = ORDER_STATUS_CFG[order.status] || ORDER_STATUS_CFG.pending;
            const shipments = order.shipments || [];
            const isRefundRequested = order.status === "refund_requested";
            const isCanceled = order.status === "canceled";
            const isRefunded = order.status === "refunded";

            return (
              <Card key={order.id} className={`border bg-card/50 backdrop-blur rounded-3xl overflow-hidden transition ${
                isRefundRequested ? "border-amber-500/50 shadow-md shadow-amber-500/5" : isCanceled ? "border-rose-500/30 opacity-80" : "border-border/50 hover:border-primary/30"
              }`}>
                <CardHeader className="p-5 pb-3 border-b border-border/30 bg-muted/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                        isCanceled ? "bg-rose-500/10 text-rose-500" : isRefunded ? "bg-purple-500/10 text-purple-500" : "bg-primary/10 text-primary"
                      }`}>
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{order.customerName}</p>
                          <Badge variant="outline" className={`font-bold ${orderCfg.cls}`}>
                            {orderCfg.label}
                          </Badge>
                          <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                            {order.paymentMethod === "cod" ? "Pay When Delivered (COD)" : order.paymentMethod === "d17" ? "D17 Wallet" : order.paymentMethod === "flouci" ? "Flouci" : "Bank Card"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {order.customerEmail || "No email"} · {order.city || "Tunisia"} · Tel: {order.phone || "N/A"} · Placed: {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:ml-auto flex-wrap justify-end">
                      <div className="text-right mr-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Bill</p>
                        <p className="text-lg font-black text-foreground font-mono">{order.totalAmount} TND</p>
                      </div>

                      {/* Admin Main Order Action Buttons */}
                      {!isCanceled && !isRefunded && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancelModalOrder(order)}
                          className="rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        >
                          <Ban size={13} className="mr-1" />
                          Cancel Order
                        </Button>
                      )}

                      {isRefundRequested && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleAdminProcessRefund(order.id)}
                            className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                          >
                            <Check size={13} className="mr-1" />
                            Approve Refund
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdminRejectRefund(order.id)}
                            className="rounded-xl text-xs font-bold border-border/60 text-muted-foreground"
                          >
                            <X size={13} className="mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl text-xs font-bold"
                      >
                        <Eye size={13} className="mr-1.5" />
                        Details
                      </Button>
                    </div>
                  </div>

                  {/* Customer Refund Reason Notice Banner */}
                  {isRefundRequested && order.refundReason && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2 text-amber-400">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Customer Return Claim Reason:</p>
                        <p className="text-foreground/90 mt-0.5 italic">"{order.refundReason}"</p>
                      </div>
                    </div>
                  )}

                  {/* Cancel Reason Notice Banner */}
                  {isCanceled && order.cancelReason && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-center gap-2 text-rose-400">
                      <Ban size={14} className="shrink-0" />
                      <span>Cancellation Reason: <strong>{order.cancelReason}</strong></span>
                    </div>
                  )}
                </CardHeader>

                {/* Per-Brand Split Shipment Cards */}
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Split Shipments ({shipments.length} {shipments.length === 1 ? "Brand" : "Brands"})
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shipments.map((shipment: any) => {
                      const shipCfg = SHIP_STATUS_CFG[shipment.status] || SHIP_STATUS_CFG.pending;
                      const Icon = shipCfg.icon;

                      return (
                        <div
                          key={shipment.id}
                          className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-3 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-xs text-primary flex items-center gap-1.5">
                                <Package size={13} />
                                {shipment.brandName || `Brand #${shipment.brandId}`}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Shipment #{shipment.id} · {shipment.trackingNumber ? `Track: ${shipment.trackingNumber}` : "No tracking code"}
                              </p>
                            </div>
                            <Badge variant="outline" className={`font-bold text-[10px] ${shipCfg.cls}`}>
                              <Icon size={11} className="mr-1 inline" />
                              {shipCfg.label}
                            </Badge>
                          </div>

                          {/* Admin Order Confirmation & Delivery Approval Controls */}
                          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                            {shipment.status !== "delivered" && shipment.status !== "canceled" && shipment.status !== "refunded" && (
                              <Button
                                size="sm"
                                onClick={() => handleAdminApproveDelivery(shipment.id)}
                                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8"
                              >
                                <CheckCircle2 size={13} className="mr-1" />
                                Approve Delivered
                              </Button>
                            )}

                            {shipment.status === "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdminProcessRefund(order.id)}
                                className="rounded-xl border-purple-500/30 text-purple-500 hover:bg-purple-500/10 text-xs h-8 ml-auto"
                              >
                                <Undo2 size={13} className="mr-1" />
                                Refund Order
                              </Button>
                            )}

                            {shipment.status === "refunded" && (
                              <span className="text-xs font-bold text-purple-400 px-2.5 py-1 bg-purple-500/10 rounded-lg flex items-center gap-1">
                                <Undo2 size={12} /> Refunded ✅
                              </span>
                            )}

                            {shipment.status === "canceled" && (
                              <span className="text-xs font-bold text-rose-400 px-2.5 py-1 bg-rose-500/10 rounded-lg flex items-center gap-1">
                                <Ban size={12} /> Canceled
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Admin Cancel Order Modal */}
      <Dialog open={!!cancelModalOrder} onOpenChange={() => setCancelModalOrder(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-500">
              <Ban className="h-5 w-5" />
              Cancel Order #{cancelModalOrder?.id}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-1">
            This will mark order #{cancelModalOrder?.id} and all its split brand shipments as <strong>Canceled</strong>. The customer will be immediately notified.
          </p>

          <div className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Cancellation Reason (Optional)</label>
              <textarea
                rows={3}
                placeholder="e.g. Item out of stock with brand, customer phone unreachable, etc..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOrder(null)}
                className="rounded-xl text-xs font-bold"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCancelOrder}
                disabled={cancelOrderMutation.isPending}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                {cancelOrderMutation.isPending ? "Canceling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Order Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Order #{selectedOrder.id} Breakdown
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Recipient</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">{selectedOrder.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customerEmail || "No email"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedOrder.phone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Shipping Address</p>
                  <p className="text-xs text-foreground mt-0.5">{selectedOrder.shippingAddress || "Standard Address"}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.city}, {selectedOrder.country || "Tunisia"}</p>
                  <p className="text-xs font-bold text-primary mt-1">Payment: {selectedOrder.paymentMethod?.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Shipment Fulfillment Stages</p>
                <div className="space-y-2">
                  {(selectedOrder.shipments || []).map((s: any) => (
                    <div key={s.id} className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs">{s.brandName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">Status: {s.status}</p>
                      </div>
                      <div className="flex gap-2">
                        {s.status !== "delivered" && s.status !== "canceled" && s.status !== "refunded" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              handleAdminApproveDelivery(s.id);
                              setSelectedOrder(null);
                            }}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
                          >
                            Approve Delivered
                          </Button>
                        )}
                        {s.status === "delivered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleAdminProcessRefund(selectedOrder.id);
                              setSelectedOrder(null);
                            }}
                            className="h-7 text-xs border-purple-500/30 text-purple-500 rounded-lg"
                          >
                            Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
