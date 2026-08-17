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
  pending:    { label: "Pending",    cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  processing: { label: "Processing", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped:    { label: "Shipped",    cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  delivered:  { label: "Delivered",  cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  refunded:   { label: "Refunded",   cls: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  canceled:   { label: "Canceled",   cls: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const SHIP_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  pending:          { label: "Pending Order",      cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Clock },
  preparing:        { label: "Brand Preparing",    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",     icon: Package },
  ready_for_pickup: { label: "Brand Confirmed",    cls: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle2 },
  shipped:          { label: "Styly Dispatching",  cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Truck },
  delivered:        { label: "User Received",      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  refunded:         { label: "Refunded / Returned", cls: "bg-rose-500/20 text-rose-400 border-rose-500/30",   icon: Undo2 },
  canceled:         { label: "Canceled",           cls: "bg-red-500/20 text-red-400 border-red-500/30",        icon: Ban },
};

export default function Orders() {
  const { data: orders = [], isLoading, refetch } = trpc.delivery.adminListOrders.useQuery();
  const updateShipmentMutation = trpc.delivery.updateShipment.useMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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

  const handleAdminProcessRefund = async (shipmentId: number) => {
    try {
      await updateShipmentMutation.mutateAsync({
        shipmentId,
        status: "refunded",
        notes: "Admin processed customer return & refund.",
      });
      await refetch();
      toast.success(`Shipment #${shipmentId} marked as Refunded! 🔄`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process refund");
    }
  };

  // Overview metrics calculations
  const totalOrders = (orders as any[]).length;
  const pendingOrders = (orders as any[]).filter((o: any) => o.status === "pending" || o.status === "processing").length;
  const deliveredOrders = (orders as any[]).filter((o: any) => o.status === "delivered").length;
  const refundedOrders = (orders as any[]).filter((o: any) => o.status === "refunded").length;
  const totalGrossVolume = (orders as any[]).reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Orders & Multi-Brand Shipments</h1>
        <p className="text-sm text-muted-foreground">
          Track customer purchases, brand confirmation statuses, admin delivery approvals, and refund requests.
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
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Awaiting Delivery</CardTitle>
              <Truck className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : pendingOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Brand packed / in transit</p>
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
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Refunds & Returns</CardTitle>
              <Undo2 className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-500">{isLoading ? <Skeleton className="h-8 w-16" /> : refundedOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Returned item claims</p>
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
        <div className="flex gap-2">
          {["all", "pending", "processing", "shipped", "delivered", "refunded"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="rounded-xl capitalize text-xs font-bold"
            >
              {st}
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

            return (
              <Card key={order.id} className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl overflow-hidden hover:border-primary/30 transition">
                <CardHeader className="p-5 pb-3 border-b border-border/30 bg-muted/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">{order.customerName}</p>
                          <Badge variant="outline" className={`font-bold ${orderCfg.cls}`}>
                            {orderCfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {order.customerEmail || "No email"} · {order.city || "Tunisia"} · {order.paymentMethod?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:ml-auto">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Total Bill</p>
                        <p className="text-lg font-black text-foreground">{order.totalAmount} TND</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl text-xs font-bold"
                      >
                        <Eye size={13} className="mr-1.5" />
                        Full Details
                      </Button>
                    </div>
                  </div>
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
                            {shipment.status !== "delivered" && (
                              <Button
                                size="sm"
                                onClick={() => handleAdminApproveDelivery(shipment.id)}
                                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8"
                              >
                                <CheckCircle2 size={13} className="mr-1" />
                                Approve Delivered
                              </Button>
                            )}

                            {shipment.status !== "refunded" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdminProcessRefund(shipment.id)}
                                className="rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs h-8"
                              >
                                <Undo2 size={13} className="mr-1" />
                                Refund
                              </Button>
                            ) : (
                              <span className="text-xs font-bold text-rose-500 px-2 py-1 bg-rose-500/10 rounded-lg">
                                Refunded ✅
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleAdminProcessRefund(s.id);
                            setSelectedOrder(null);
                          }}
                          className="h-7 text-xs border-rose-500/30 text-rose-500 rounded-lg"
                        >
                          Refund
                        </Button>
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
