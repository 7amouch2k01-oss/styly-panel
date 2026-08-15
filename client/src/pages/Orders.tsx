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
  Eye, Check, Clock, CheckCircle2, AlertCircle, Ban
} from "lucide-react";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";

// ─── Status Configs ───────────────────────────────────────────────────────────

const ORDER_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pending",    cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  processing: { label: "Processing", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped:    { label: "Shipped",    cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  delivered:  { label: "Delivered",  cls: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const SHIP_STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  pending:          { label: "Pending",          cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Clock },
  preparing:        { label: "Preparing",        cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",     icon: Package },
  ready_for_pickup: { label: "Ready for Pickup", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Package },
  shipped:          { label: "Shipped",          cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Truck },
  delivered:        { label: "Delivered",        cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  canceled:         { label: "Canceled",         cls: "bg-red-500/20 text-red-400 border-red-500/30",        icon: Ban },
};

// ─── Shipment Update Modal ────────────────────────────────────────────────────

function ShipmentUpdateModal({ shipment, onClose }: { shipment: any; onClose: () => void }) {
  const [form, setForm] = useState({
    status: shipment.status,
    carrier: shipment.carrier ?? "",
    trackingNumber: shipment.trackingNumber ?? "",
    estimatedDeliveryDate: shipment.estimatedDeliveryDate ?? "",
    notes: shipment.notes ?? "",
  });

  const updateMutation = trpc.delivery.updateShipment.useMutation({
    onSuccess: () => {
      toast.success(`Shipment #${shipment.id} updated!`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Update Shipment #{shipment.id}
          </h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {Object.entries(SHIP_STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Carrier</label>
            <Input
              value={form.carrier}
              onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))}
              placeholder="e.g. DHL, Amana, CTM"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Tracking Number</label>
            <Input
              value={form.trackingNumber}
              onChange={e => setForm(p => ({ ...p, trackingNumber: e.target.value }))}
              placeholder="e.g. 1Z999AA10123456784"
              className="font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Estimated Delivery</label>
            <Input type="date" value={form.estimatedDeliveryDate} onChange={e => setForm(p => ({ ...p, estimatedDeliveryDate: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        <Button
          onClick={() => updateMutation.mutate({
            shipmentId: shipment.id,
            status: form.status as any,
            carrier: form.carrier || undefined,
            trackingNumber: form.trackingNumber || undefined,
            estimatedDeliveryDate: form.estimatedDeliveryDate || undefined,
            notes: form.notes || undefined,
          })}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Updating…</>
          ) : (
            <><Check className="h-4 w-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Order Row (expandable with shipments) ────────────────────────────────────

function OrderRow({ order, onViewDetails }: { order: any; onViewDetails: (o: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editShipment, setEditShipment] = useState<any | null>(null);
  const cfg = ORDER_STATUS_CFG[order.status] ?? ORDER_STATUS_CFG.pending;

  const shipments = order.shipments ?? [];

  return (
    <>
      {/* Main order row */}
      <tr className="border-b border-border/50 hover:bg-accent/5 transition-colors">
        <td className="px-4 py-3 font-mono text-sm font-semibold">#{order.id}</td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">{order.customerEmail || "—"}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge className={`text-xs border ${cfg.cls}`}>{cfg.label}</Badge>
        </td>
        <td className="px-4 py-3 text-sm">{order.itemCount}</td>
        <td className="px-4 py-3 text-sm font-semibold">${order.totalAmount?.toLocaleString()}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onViewDetails(order)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {shipments.length > 0 && (
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs" onClick={() => setExpanded(!expanded)}>
                <Truck className="h-3 w-3" /> {shipments.length}
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded shipments */}
      {expanded && shipments.map((sh: any) => {
        const sCfg = SHIP_STATUS_CFG[sh.status] ?? SHIP_STATUS_CFG.pending;
        const SIcon = sCfg.icon;
        return (
          <tr key={sh.id} className="border-b border-border/30 bg-accent/5">
            <td colSpan={7} className="px-6 py-2">
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">
                      Shipment #{sh.id} · {sh.brandName}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {sh.shippingAddress}
                    </p>
                  </div>
                  {sh.carrier && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                      {sh.carrier} · {sh.trackingNumber || "No tracking"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[11px] border ${sCfg.cls}`}>
                    <SIcon className="h-2.5 w-2.5 mr-1" /> {sCfg.label}
                  </Badge>
                  {!["delivered", "canceled"].includes(sh.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setEditShipment(sh)}
                    >
                      Update
                    </Button>
                  )}
                </div>
              </div>
            </td>
          </tr>
        );
      })}

      {editShipment && (
        <ShipmentUpdateModal shipment={editShipment} onClose={() => setEditShipment(null)} />
      )}
    </>
  );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────────

export default function Orders() {
  const { data: orders = [], isLoading, refetch } = trpc.delivery.adminListOrders.useQuery();
  const { data: allShipments = [] } = trpc.delivery.adminListShipments.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"orders" | "shipments">("orders");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.id).includes(searchQuery) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerEmail || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredShipments = allShipments.filter((s: any) =>
    statusFilter === "all" || s.status === statusFilter
  );

  // Stats
  const stats = [
    { label: "Total Orders",  value: orders.length,                                    color: "text-foreground" },
    { label: "Pending",       value: orders.filter(o => o.status === "pending").length,    color: "text-amber-400" },
    { label: "Shipped",       value: allShipments.filter((s: any) => s.status === "shipped").length, color: "text-indigo-400" },
    { label: "Delivered",     value: allShipments.filter((s: any) => s.status === "delivered").length, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Control Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Global view of all orders and shipments across all brands
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-4">
              <p className={`text-2xl font-black ${s.color}`}>{isLoading ? "…" : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setView("orders")}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors ${view === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            <Package className="h-3.5 w-3.5" /> Orders ({orders.length})
          </button>
          <button
            onClick={() => setView("shipments")}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors ${view === "shipments" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            <Truck className="h-3.5 w-3.5" /> Shipments ({allShipments.length})
          </button>
        </div>
        {/* Search */}
        {view === "orders" && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer name or email…"
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Statuses</option>
          {view === "orders"
            ? Object.entries(ORDER_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
            : Object.entries(SHIP_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
          }
        </select>
      </div>

      {/* ── Orders Table ── */}
      {view === "orders" && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>
              Click the <Truck className="inline h-3.5 w-3.5" /> icon on an order to expand its shipments.
              {" "}{filteredOrders.length} result{filteredOrders.length !== 1 ? "s" : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {[...Array(7)].map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <Skeleton className="h-4 w-full max-w-[100px]" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : filteredOrders.length > 0
                    ? filteredOrders.map(order => (
                        <OrderRow key={order.id} order={order} onViewDetails={o => { setSelectedOrder(o); setDialogOpen(true); }} />
                      ))
                    : (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-12">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No orders found
                        </td>
                      </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Shipments Grid ── */}
      {view === "shipments" && (
        <div className="space-y-3">
          {filteredShipments.length === 0 ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center py-16 gap-3">
                <Truck className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No shipments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredShipments.map((sh: any) => {
              const cfg = SHIP_STATUS_CFG[sh.status] ?? SHIP_STATUS_CFG.pending;
              const SIcon = cfg.icon;
              return (
                <Card key={sh.id} className="border-border/50 bg-card/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            Shipment #{sh.id} · Order #{sh.orderId}
                          </p>
                          <p className="text-xs font-semibold text-primary/70">{sh.brandName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {sh.shippingAddress}
                          </p>
                          {sh.carrier && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                              <Truck className="h-3 w-3 text-primary" /> {sh.carrier}
                              {sh.trackingNumber && ` · ${sh.trackingNumber}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-xs border ${cfg.cls} flex items-center gap-1`}>
                          <SIcon className="h-3 w-3" /> {cfg.label}
                        </Badge>
                        {!["delivered", "canceled"].includes(sh.status) && (
                          <ShipmentUpdateModalInline shipment={sh} />
                        )}
                      </div>
                    </div>
                    {sh.estimatedDeliveryDate && (
                      <p className="text-xs text-muted-foreground mt-2 pl-13">
                        ETA: {new Date(sh.estimatedDeliveryDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <OrderDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} order={selectedOrder} />
    </div>
  );
}

// Inline update button for shipments grid view
function ShipmentUpdateModalInline({ shipment }: { shipment: any }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5" onClick={() => setOpen(true)}>
        <Truck className="h-3 w-3" /> Update
      </Button>
      {open && <ShipmentUpdateModal shipment={shipment} onClose={() => setOpen(false)} />}
    </>
  );
}
