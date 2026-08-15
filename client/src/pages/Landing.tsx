import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Building,
  CheckCircle2,
  Tag,
  Zap,
  Eye,
  BarChart3,
  BadgePercent,
  Truck,
  Star,
  ShoppingBag,
} from "lucide-react";

// ─── Community Testimonials ──────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Yasmine Ben Salem",
    role: "Fashion Creator · Tunis",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    quote:
      "Tagging local Tunisian brands in my daily looks has never been smoother. My followers can buy the exact blazer or pants right from the post, and I track my commissions in real-time.",
    rating: 5,
    tag: "Verified Creator",
  },
  {
    name: "Karim Mansour",
    role: "Brand Owner · Maison Mansour",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    quote:
      "The Brand Portal gives us full control over user tags and incoming orders. Split shipment fulfillment means we prepare our orders while Styly handles unified tracking.",
    rating: 5,
    tag: "Brand Partner",
  },
  {
    name: "Sonia Guezguez",
    role: "Style Enthusiast · Sousse",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    quote:
      "I love ordering from different brands at the same time and seeing each shipment's progress clearly on my profile. The app design is clean, fast, and gorgeous.",
    rating: 5,
    tag: "Top Shopper",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setLocation("/feed");
    }
  }, [user, loading, setLocation]);

  const handleEnterApp = () => {
    if (user) {
      setLocation("/feed");
    } else {
      setLocation("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0F12] text-neutral-100 selection:bg-rose-500/20 selection:text-rose-400 font-sans overflow-x-hidden relative">
      
      {/* Ambient Lighting Background */}
      <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-rose-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-orange-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-pink-600/10 blur-[150px] pointer-events-none" />

      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0E0F12]/85 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20 font-black text-white text-lg">
              S
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent tracking-tight">
              Styly
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
              Social Fashion Hub
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#preview" className="hover:text-white transition-colors">App Preview</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#brands" className="hover:text-white transition-colors">For Brands</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLocation("/auth")}
              className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <Button
              onClick={handleEnterApp}
              className="rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-90 text-white font-bold shadow-lg shadow-rose-500/25 px-6 border-0"
            >
              Open Styly
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-neutral-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#14161B]/95 backdrop-blur-xl px-5 pt-3 pb-6 space-y-3">
            <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-neutral-300 hover:text-white">App Preview</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-neutral-300 hover:text-white">How It Works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-neutral-300 hover:text-white">Features</a>
            <a href="#brands" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-neutral-300 hover:text-white">For Brands</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-neutral-300 hover:text-white">Reviews</a>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-full border-white/20 text-neutral-200 hover:bg-white/10"
                onClick={() => { setMobileMenuOpen(false); setLocation("/auth"); }}
              >
                Sign In
              </Button>
              <Button
                className="w-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold border-0"
                onClick={() => { setMobileMenuOpen(false); handleEnterApp(); }}
              >
                Launch App
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-14 pb-16 md:pt-24 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-400 mb-6 backdrop-blur-md">
            <Sparkles size={13} className="text-orange-400 animate-pulse" />
            <span>Social Fashion Discovery & Multi-Brand Commerce</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white max-w-5xl mx-auto">
            Discover Real Outfits. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Tag Local Brands.
            </span>{" "}
            Shop in One Click.
          </h1>

          <p className="mt-6 text-neutral-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
            Styly brings creators, shoppers, and emerging fashion brands together in a seamless social feed with interactive item tagging, multi-brand cart checkout, and real-time delivery tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            <Button
              onClick={handleEnterApp}
              size="lg"
              className="h-14 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-black px-9 shadow-xl shadow-rose-500/25 text-base border-0 hover:scale-[1.02] transition-transform"
            >
              Explore Live Feed
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const el = document.getElementById("preview");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              size="lg"
              className="h-14 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-8 text-base backdrop-blur-md"
            >
              <Eye className="mr-2 h-4 w-4 text-neutral-400" />
              See App in Action
            </Button>
          </div>

          {/* ── Featured Realistic App Photo Showcase ── */}
          <div id="preview" className="mt-16 md:mt-20 max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl">
              <img
                src="/landing_feed_mockup.jpg"
                alt="Styly Social Creator Feed and Outfit Tagging Interface"
                className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F12]/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Overlay Badge */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-left">
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-400" />
                    Interactive Creator Feed & Hotspot Tagging
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm">
                    Tap any item tag to reveal piece details, localized TND pricing, and add to bag instantly.
                  </p>
                </div>
                <Button
                  onClick={handleEnterApp}
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs px-5 shrink-0 border-0"
                >
                  Try Feed
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 pt-10 border-t border-white/10 text-left">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-3xl font-black text-white">100%</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium">Live Database Pipeline</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-3xl font-black text-white">Multi-Brand</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium">Split-Shipment Tracking</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-3xl font-black text-white">Direct Tag</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium">Post to Brand Dashboard</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-3xl font-black text-white">TND Hub</p>
              <p className="text-xs text-neutral-400 mt-1 font-medium">Localized Fashion Pricing</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 md:py-28 border-t border-white/10 bg-[#121419]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
              Frictionless Commerce
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">How Styly Connects Fashion</h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              A 3-step continuous loop linking creators, shoppers, and brand partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-5 text-left relative overflow-hidden group hover:border-rose-500/30 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Creators Post & Tag Brands</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Creators snap their real outfit fits, tag existing partner brands or enter custom tags, and set interactive piece prices in TND.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-5 text-left relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-black text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Shoppers Multi-Cart Checkout</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Shoppers tap tagged clothing pieces across different posts, aggregate multi-brand items in one bag, and place orders with flexible payment.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-5 text-left relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-white">Split Dispatch & Analytics</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Each brand fulfills their individual shipment from their dashboard while creators earn verified sales commissions automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Feature Grid ── */}
      <section id="features" className="py-20 md:py-28 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Engineered for Modern Fashion</h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              Every feature is built for high speed, creator growth, and brand visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Tag,
                title: "Live Brand Tag Redirection",
                desc: "Posts tagging unregistered brands auto-route to brand owners when they register and get verified by the admin console.",
                color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
              },
              {
                icon: Truck,
                title: "Independent Shipment Tracking",
                desc: "Each brand manages its order status individually — from packing to pickup — with real-time customer notifications.",
                color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
              },
              {
                icon: BarChart3,
                title: "Live Revenue Aggregation",
                desc: "Real-time monthly revenue charts and user statistics pulled directly from MongoDB database aggregations.",
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
              {
                icon: ShoppingBag,
                title: "Multi-Brand Shopping Bag",
                desc: "Combine garments from different designers into one clean cart with unified delivery addressing and payments.",
                color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: BadgePercent,
                title: "Creator Commission System",
                desc: "Style Point leaderboards and transparent commission payouts for creators driving verified fashion sales.",
                color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
              },
              {
                icon: Zap,
                title: "Ultra-Fast tRPC Architecture",
                desc: "End-to-end typed communication with MongoDB Atlas ensures zero data loss and instantaneous UI reactivity.",
                color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all text-left">
                <CardContent className="p-7 space-y-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Portal Banner ── */}
      <section id="brands" className="py-20 border-t border-white/10 bg-gradient-to-b from-[#181A20] to-[#0E0F12]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <Building size={24} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">Are You a Fashion Brand?</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Register your official brand store to access your dedicated portal, review creator tags on your garments, manage incoming shipments, and scale in-app sales.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => setLocation("/auth")}
              size="lg"
              className="rounded-full bg-white hover:bg-neutral-200 text-neutral-900 font-extrabold px-8 shadow-lg"
            >
              Register Brand Store
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="reviews" className="py-20 md:py-28 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Trusted by Creators & Brands</h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              Here is what fashion enthusiasts and store managers are saying about Styly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="bg-white/[0.02] border border-white/10 text-left">
                <CardContent className="p-7 flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed italic">"{t.quote}"</p>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                    <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate leading-none">{t.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate mt-1">{t.role}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2.5 py-1 bg-white/5 border border-white/10 text-rose-300 rounded-full ml-auto">
                      {t.tag}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call To Action Banner ── */}
      <section className="py-20 md:py-28 border-t border-white/10 bg-gradient-to-b from-[#14161C] to-[#0E0F12] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Ready to elevate your style?
          </h2>
          <p className="text-neutral-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Join the premier fashion community. Browse looks, tag pieces, and experience seamless multi-brand fashion commerce.
          </p>
          <div className="pt-4">
            <Button
              onClick={handleEnterApp}
              size="lg"
              className="h-14 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-black px-10 shadow-2xl shadow-rose-500/30 text-base border-0 hover:scale-[1.02] transition-transform"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-12 bg-[#0A0B0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center font-black text-white text-xs">
              S
            </div>
            <span className="text-lg font-black text-white tracking-tight">Styly</span>
          </div>
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} Styly Fashion Platform. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-neutral-400">
            <a href="#preview" className="hover:text-white transition-colors">App Preview</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#brands" className="hover:text-white transition-colors">Brands</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
