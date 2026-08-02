import { useState } from "react";
import { useLocation } from "wouter";
import AppShell, { useAppShell } from "@/components/AppShell";
import {
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ShoppingBag,
  Lock,
  ArrowLeft,
  Sparkles,
  Package,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface DeliveryForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postCode: string;
}

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { bagItems, clearBag } = useAppShell();
  const [step, setStep] = useState<Step>(1);
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const [delivery, setDelivery] = useState<DeliveryForm>({
    fullName: "", phone: "", address: "", city: "", country: "Morocco", postCode: "",
  });

  const [payment, setPayment] = useState<PaymentForm>({
    cardNumber: "", expiryDate: "", cvv: "", cardName: "",
  });

  const subtotal = bagItems.reduce((acc, b) => acc + b.price * b.qty, 0);
  const shipping = subtotal > 500 ? 0 : 29;
  const total = subtotal + shipping;

  const placeOrderMutation = trpc.checkout.placeOrder.useMutation({
    onSuccess: (data) => {
      setPlacedOrderId(data.orderId);
      setPlacing(false);
      setStep(3);
      clearBag();
      toast.success("Order placed! 🎉 Your items are being prepared.");
    },
    onError: (err) => {
      console.error("Order error:", err);
      setPlacing(false);
      toast.error("Failed to place order. Please try again.");
    },
  });

  const handlePlaceOrder = () => {
    setPlacing(true);
    placeOrderMutation.mutate({
      items: bagItems.map((item) => ({
        id: (item as any).productId ?? item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size,
        qty: item.qty,
        // brandId & brandName are optional — include if bag item exposes them
        brandId: (item as any).brandId,
        brandName: (item as any).brandName,
      })),
      total,
      address: {
        fullName: delivery.fullName,
        phone: delivery.phone,
        address: delivery.address,
        city: delivery.city,
        postCode: delivery.postCode,
        country: delivery.country,
      },
    });
  };

  const steps = [
    { n: 1, label: "Delivery", icon: MapPin },
    { n: 2, label: "Payment", icon: CreditCard },
    { n: 3, label: "Confirm", icon: CheckCircle },
  ];

  return (
    <AppShell activePath="/shop" showRightPanel={false}>
      <div className="min-h-[calc(100vh-56px)] pb-20 lg:pb-8 px-4 py-6 max-w-4xl mx-auto">

        {/* Back button */}
        {step < 3 && (
          <button
            onClick={() => step === 1 ? setLocation("/shop") : setStep((s) => (s - 1) as Step)}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transit-all mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Back to Shop" : "Back"}
          </button>
        )}

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-0 mb-8 max-w-sm">
            {steps.map(({ n, label, icon: Icon }, i) => (
              <div key={n} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${step >= n ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transit-all ${
                    step > n ? "bg-primary border-primary text-white" :
                    step === n ? "border-primary text-primary bg-primary/10" :
                    "border-border/40 text-muted-foreground"
                  }`}>
                    {step > n ? <CheckCircle className="h-4 w-4" /> : n}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${step >= n ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transit-all ${step > n ? "bg-primary" : "bg-border/40"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* ── Step 1: Delivery ── */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-up">
              <h2 className="text-lg font-black flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Delivery Details
              </h2>
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-5 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={delivery.fullName}
                    onChange={(e) => setDelivery((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g. Aria Fenix"
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={delivery.phone}
                      onChange={(e) => setDelivery((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+212 6XX XXX XXX"
                      className="w-full h-11 pl-9 pr-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                    />
                  </div>
                </div>
                {/* Address */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={delivery.address}
                    onChange={(e) => setDelivery((p) => ({ ...p, address: e.target.value }))}
                    placeholder="e.g. 24 Rue Mohammed V"
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                  />
                </div>
                {/* City + Post Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">City</label>
                    <input
                      type="text"
                      value={delivery.city}
                      onChange={(e) => setDelivery((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Casablanca"
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Post Code</label>
                    <input
                      type="text"
                      value={delivery.postCode}
                      onChange={(e) => setDelivery((p) => ({ ...p, postCode: e.target.value }))}
                      placeholder="20000"
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                    />
                  </div>
                </div>
                {/* Country */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Country</label>
                  <select
                    value={delivery.country}
                    onChange={(e) => setDelivery((p) => ({ ...p, country: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                  >
                    {["Morocco", "France", "UAE", "UK", "USA", "Tunisia", "Algeria", "Egypt"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!delivery.fullName || !delivery.address || !delivery.city || !delivery.phone) {
                    toast.error("Please fill in all delivery fields");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-bold hover:opacity-95 hover:scale-[1.01] transit-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Continue to Payment <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-up">
              <h2 className="text-lg font-black flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Payment Details
              </h2>
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-5 space-y-4">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Payments are encrypted and secure. This is a demo — no real charges.</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Name on Card</label>
                  <input
                    type="text"
                    value={payment.cardName}
                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                    placeholder="Aria Fenix"
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Card Number</label>
                  <input
                    type="text"
                    value={payment.cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setPayment((p) => ({ ...p, cardNumber: v.replace(/(.{4})/g, "$1 ").trim() }));
                    }}
                    placeholder="1234 5678 9012 3456"
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all font-mono tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Expiry Date</label>
                    <input
                      type="text"
                      value={payment.expiryDate}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                        setPayment((p) => ({ ...p, expiryDate: v }));
                      }}
                      placeholder="MM/YY"
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">CVV</label>
                    <input
                      type="password"
                      value={payment.cvv}
                      onChange={(e) => setPayment((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="•••"
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all font-mono tracking-widest"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!payment.cardName || payment.cardNumber.replace(/\s/g, "").length < 16) {
                    toast.error("Please fill in valid card details");
                    return;
                  }
                  handlePlaceOrder();
                }}
                disabled={placing}
                className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-bold hover:opacity-95 hover:scale-[1.01] transit-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {placing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing…
                  </div>
                ) : (
                  <><Lock className="h-4 w-4" /> Place Order — {total.toLocaleString()} TND</>
                )}
              </button>
            </div>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-16 animate-fade-up gap-6">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center animate-pulse">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                {/* Sparkles floating */}
                <Sparkles className="h-5 w-5 text-primary absolute -top-2 -right-2 animate-bounce" />
                <Sparkles className="h-4 w-4 text-orange-400 absolute -bottom-1 -left-3 animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">Order Confirmed! 🎉</h2>
                {placedOrderId && (
                  <p className="text-xs font-mono bg-primary/10 text-primary px-3 py-1 rounded-full inline-block mb-3">
                    Order #{placedOrderId}
                  </p>
                )}
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  Your order has been placed and is being prepared by our brand partners. Each brand will ship your items separately.
                </p>
              </div>
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-5 w-full max-w-sm text-left space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Package className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold">Estimated Delivery</p>
                    <p className="text-muted-foreground text-xs mt-0.5">3–5 business days per brand</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold">Shipping to</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{delivery.city || "Your address"}, {delivery.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold">Contact</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{delivery.phone}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={() => setLocation("/profile")}
                  className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transit-all shadow-lg shadow-primary/20"
                >
                  Track My Orders
                </button>
                <button
                  onClick={() => setLocation("/shop")}
                  className="px-6 py-3 bg-muted rounded-full font-bold text-sm hover:bg-accent transit-all"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {/* ── Order Summary (right side) ── */}
          {step < 3 && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-5 space-y-4 h-fit sticky top-20 animate-fade-up">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" /> Order Summary
              </h3>
              <div className="space-y-2.5">
                {bagItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Your bag is empty</p>
                ) : (
                  bagItems.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/30">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">Size: {item.size} · ×{item.qty}</p>
                      </div>
                      <p className="text-xs font-bold text-primary shrink-0">{(item.price * item.qty).toLocaleString()} TND</p>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-3 border-t border-border/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span><span>{subtotal.toLocaleString()} TND</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-emerald-500 font-bold" : ""}>
                    {shipping === 0 ? "Free" : `${shipping} TND`}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-[10px] text-emerald-500 font-semibold">✓ Free shipping on orders over 500 TND</p>
                )}
                <div className="flex items-center justify-between font-black text-base pt-1 border-t border-border/20">
                  <span>Total</span><span className="text-primary">{total.toLocaleString()} TND</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
