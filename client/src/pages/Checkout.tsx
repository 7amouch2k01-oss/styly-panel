import { useState } from "react";
import { useLocation } from "wouter";
import AppShell, { useAppShell } from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
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
  Smartphone,
  Wallet,
  Truck,
  X
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
  const { user } = useAuth();
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

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'd17' | 'flouci' | 'cod'>('cod');

  const [verificationCode, setVerificationCode] = useState("");

  const resendCodeMutation = trpc.auth.resendVerificationCode.useMutation({
    onSuccess: () => toast.success("Verification code sent!"),
    onError: (err) => toast.error(err.message)
  });

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success("Email verified!");
      window.location.reload();
    },
    onError: (err) => toast.error(err.message)
  });

  const { data: profile } = trpc.userProfile.getDeliveryProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const subtotal = bagItems.reduce((acc, b) => acc + b.price * b.qty, 0);
  const shipping = subtotal > 500 ? 0 : 29;
  const total = subtotal + shipping;

  const placeOrderMutation = trpc.checkout.placeOrder.useMutation({
    onSuccess: (data) => {
      setPlacedOrderId(data.orderId);
      setPlacing(false);
      setShowPaymentModal(false);
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
        brandId: (item as any).brandId,
        brandName: (item as any).brandName,
      })),
      total,
      paymentMethod: selectedPaymentMethod || 'card',
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

  if (user && !user.isEmailVerified) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 text-white p-4">
        <h1 className="text-3xl font-black mb-4 text-center">Verify your email to make a purchase</h1>
        <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-md max-w-sm w-full space-y-4 shadow-xl border border-white/20">
          <button 
            onClick={() => resendCodeMutation.mutate()} 
            disabled={resendCodeMutation.isPending}
            className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl hover:bg-orange-50 transition"
          >
            {resendCodeMutation.isPending ? "Sending..." : "Send Verification Code"}
          </button>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Code" 
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="flex-1 bg-black/10 border-0 rounded-xl px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button 
              onClick={() => verifyEmailMutation.mutate({ code: verificationCode })}
              disabled={verifyEmailMutation.isPending || !verificationCode}
              className="bg-black/30 hover:bg-black/40 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Verify
            </button>
          </div>
          <button 
            onClick={() => setLocation("/feed")} 
            className="w-full text-white/80 hover:text-white text-sm mt-4 transition text-center block"
          >
            Skip — Browse without buying
          </button>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Delivery Details
                </h2>
                {profile?.isComplete && (
                  <button
                    onClick={() => {
                      setDelivery({
                        fullName: "",
                        phone: profile.phone || "",
                        address: profile.deliveryAddress || "",
                        city: profile.deliveryCity || "",
                        postCode: profile.deliveryPostCode || "",
                        country: profile.deliveryCountry || "Tunisia",
                      });
                      toast.success("Address auto-filled from profile!");
                    }}
                    className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3 w-3" /> Use saved address
                  </button>
                )}
              </div>
              
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
                <CreditCard className="h-5 w-5 text-primary" /> Choose Payment Method
              </h2>

              {/* Payment Methods Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Cash on Delivery (DEFAULT) */}
                <div
                  onClick={() => setSelectedPaymentMethod("cod")}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
                    selectedPaymentMethod === "cod"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                      : "border-border/40 bg-white dark:bg-[#1A1A1A] hover:border-border"
                  }`}
                >
                  {selectedPaymentMethod === "cod" && (
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      Selected
                    </span>
                  )}
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-2.5">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Pay When Delivered (COD)</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay with cash directly to the courier when your package arrives at your door.
                  </p>
                </div>

                {/* 2. D17 Mobile Wallet */}
                <div
                  onClick={() => setSelectedPaymentMethod("d17")}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
                    selectedPaymentMethod === "d17"
                      ? "border-orange-500 bg-orange-500/10 shadow-md shadow-orange-500/10"
                      : "border-border/40 bg-white dark:bg-[#1A1A1A] hover:border-border"
                  }`}
                >
                  {selectedPaymentMethod === "d17" && (
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white">
                      Selected
                    </span>
                  )}
                  <div className="h-9 w-9 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center mb-2.5">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">D17 Mobile Wallet</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instant transfer using the La Poste Tunisienne D17 app.
                  </p>
                </div>

                {/* 3. Flouci Digital Wallet */}
                <div
                  onClick={() => setSelectedPaymentMethod("flouci")}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
                    selectedPaymentMethod === "flouci"
                      ? "border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10"
                      : "border-border/40 bg-white dark:bg-[#1A1A1A] hover:border-border"
                  }`}
                >
                  {selectedPaymentMethod === "flouci" && (
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      Selected
                    </span>
                  )}
                  <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-2.5">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Flouci Wallet</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fast checkout via your verified Flouci mobile account.
                  </p>
                </div>

                {/* 4. Bank Card */}
                <div
                  onClick={() => setSelectedPaymentMethod("card")}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
                    selectedPaymentMethod === "card"
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border/40 bg-white dark:bg-[#1A1A1A] hover:border-border"
                  }`}
                >
                  {selectedPaymentMethod === "card" && (
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary text-white">
                      Selected
                    </span>
                  )}
                  <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-2.5">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Bank / Credit Card</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Secure online payment via Visa, Mastercard, or e-Dinar.
                  </p>
                </div>
              </div>

              {/* Extra Inputs for Bank Card */}
              {selectedPaymentMethod === "card" && (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-5 space-y-4 animate-fade-in">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>256-bit SSL encrypted bank card transaction.</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Name on Card</label>
                    <input
                      type="text"
                      value={payment.cardName}
                      onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                      placeholder="e.g. Aria Fenix"
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
              )}

              {/* Order Confirmation button */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full h-14 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-bold hover:opacity-95 hover:scale-[1.01] transit-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {placing ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Placing Your Order…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Place Order with {
                        selectedPaymentMethod === "cod" ? "Cash on Delivery" :
                        selectedPaymentMethod === "d17" ? "D17 Wallet" :
                        selectedPaymentMethod === "flouci" ? "Flouci" : "Bank Card"
                      } — {total.toLocaleString()} TND
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1 font-semibold"
                >
                  ← Edit Delivery Address
                </button>
              </div>
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

      {/* ── Payment Method Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-white mb-6">Select Payment Method</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div 
                onClick={() => setSelectedPaymentMethod('card')} 
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedPaymentMethod === 'card' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <CreditCard className={`w-8 h-8 mb-3 ${selectedPaymentMethod === 'card' ? 'text-primary' : 'text-white/70'}`} />
                <h3 className="text-white font-bold text-sm">Bank Card</h3>
                <p className="text-white/50 text-xs mt-1">Pay with credit/debit card</p>
              </div>
              
              <div 
                onClick={() => setSelectedPaymentMethod('d17')} 
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedPaymentMethod === 'd17' ? 'border-orange-500 bg-orange-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <Smartphone className={`w-8 h-8 mb-3 ${selectedPaymentMethod === 'd17' ? 'text-orange-500' : 'text-white/70'}`} />
                <h3 className="text-white font-bold text-sm">D17</h3>
                <p className="text-white/50 text-xs mt-1">Pay via D17 mobile wallet</p>
              </div>
              
              <div 
                onClick={() => setSelectedPaymentMethod('flouci')} 
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedPaymentMethod === 'flouci' ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <Wallet className={`w-8 h-8 mb-3 ${selectedPaymentMethod === 'flouci' ? 'text-yellow-500' : 'text-white/70'}`} />
                <h3 className="text-white font-bold text-sm">Flouci</h3>
                <p className="text-white/50 text-xs mt-1">Pay via Flouci app</p>
              </div>
              
              <div 
                onClick={() => setSelectedPaymentMethod('cod')} 
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedPaymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <Truck className={`w-8 h-8 mb-3 ${selectedPaymentMethod === 'cod' ? 'text-emerald-500' : 'text-white/70'}`} />
                <h3 className="text-white font-bold text-sm">Cash on Delivery</h3>
                <p className="text-white/50 text-xs mt-1">Pay when you receive your order</p>
              </div>
            </div>

            <button 
              disabled={!selectedPaymentMethod || placing}
              onClick={handlePlaceOrder}
              className="w-full h-14 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-bold hover:opacity-95 transition-all flex items-center justify-center disabled:opacity-50 gap-2 shadow-lg shadow-primary/20"
            >
              {placing ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing…
                </>
              ) : (
                "Confirm Payment"
              )}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
