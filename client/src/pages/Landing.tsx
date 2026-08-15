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
  Layers,
  Heart,
  ShieldCheck,
  Compass,
  DollarSign,
  Smartphone,
  ChevronDown,
} from "lucide-react";

// ─── Community Testimonials ──────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Yasmine Ben Salem",
    role: "Fashion Creator · Tunis",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    quote:
      "Tagging local Tunisian brands in my daily outfits is super fluid. My followers buy the exact blazer or accessories directly from my look, and I earn real commissions on each sale.",
    rating: 5,
    tag: "Verified Creator",
  },
  {
    name: "Karim Mansour",
    role: "Founder · Maison Mansour",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    quote:
      "The Brand Portal gives us complete visibility over user tags and pending orders. Multi-brand checkout splits incoming orders directly to our warehouse.",
    rating: 5,
    tag: "Brand Partner",
  },
  {
    name: "Sonia Guezguez",
    role: "Style Enthusiast · Sousse",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    quote:
      "I love ordering from multiple brands at once and tracking each separate shipment live on my profile. The app is light, responsive, and gorgeous.",
    rating: 5,
    tag: "Top Shopper",
  },
];

// ─── Platform Pillars ────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: Tag,
    title: "Interactive Brand Tagging",
    description: "Post your fits with dynamic clickable garment tags, custom brand mentions, and live localized TND prices.",
    badge: "Social Commerce",
  },
  {
    icon: Truck,
    title: "Split-Shipment Logistics",
    description: "Order from 5 different brands in 1 bag. Each brand fulfills and updates its shipment status separately.",
    badge: "Smart Shipping",
  },
  {
    icon: BarChart3,
    title: "Live Brand Portal & Analytics",
    description: "Verified brands review outfit tags, track sales curves, and manage fulfillment with zero mock data.",
    badge: "Brand Workspace",
  },
  {
    icon: BadgePercent,
    title: "Creator Commission Network",
    description: "Earn style points, level up on the monthly creator leaderboard, and receive sales commissions automatically.",
    badge: "Monetization",
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
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900 selection:bg-rose-500/15 selection:text-rose-600 font-sans overflow-x-hidden relative text-[14px]">
      
      {/* Subtle 3D Depth CSS Styles */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.3deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        .card-3d-shadow {
          box-shadow: 0 20px 40px -15px rgba(225, 29, 72, 0.08), 0 0 25px rgba(0, 0, 0, 0.04);
        }
        .hero-mockup-3d {
          box-shadow: 0 30px 60px -20px rgba(244, 63, 94, 0.18), 0 10px 30px -10px rgba(0,0,0,0.08);
          animation: floatSlow 8s ease-in-out infinite;
        }
        .glass-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(225, 29, 72, 0.08);
        }
      `}</style>

      {/* Warm Ambient Glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[55vw] h-[55vw] rounded-full bg-rose-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-orange-500/[0.03] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-pink-500/[0.03] blur-[130px] pointer-events-none" />

      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-white/90 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20 font-black text-white text-sm">
              S
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 bg-clip-text text-transparent tracking-tight">
              Styly
            </span>
            <span className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600">
              Social Fashion Hub
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-neutral-600">
            <a href="#showcase" className="hover:text-rose-600 transition-colors">App Preview</a>
            <a href="#how-it-works" className="hover:text-rose-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-rose-600 transition-colors">Key Features</a>
            <a href="#brands" className="hover:text-rose-600 transition-colors">For Brands</a>
            <a href="#reviews" className="hover:text-rose-600 transition-colors">Reviews</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLocation("/auth")}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <Button
              onClick={handleEnterApp}
              size="sm"
              className="rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-bold shadow-md shadow-rose-500/20 px-5 text-xs border-0 transition-transform hover:scale-[1.02]"
            >
              Open Styly
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-200 bg-white/98 px-5 pt-2 pb-5 space-y-2 text-xs">
            <a href="#showcase" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-neutral-600 font-semibold hover:text-rose-600">App Preview</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-neutral-600 font-semibold hover:text-rose-600">How It Works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-neutral-600 font-semibold hover:text-rose-600">Key Features</a>
            <a href="#brands" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-neutral-600 font-semibold hover:text-rose-600">For Brands</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-neutral-600 font-semibold hover:text-rose-600">Reviews</a>
            <div className="h-px bg-neutral-200 my-2" />
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full border-neutral-300 text-neutral-700 text-xs"
                onClick={() => { setMobileMenuOpen(false); setLocation("/auth"); }}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="w-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs border-0"
                onClick={() => { setMobileMenuOpen(false); handleEnterApp(); }}
              >
                Launch App
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-12 pb-14 md:pt-20 md:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Header Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-rose-200 bg-rose-50/80 text-[11px] font-bold text-rose-600 mb-6 backdrop-blur-sm shadow-xs">
            <Sparkles size={11} className="text-orange-500 animate-pulse" />
            <span>The Social Fashion & Multi-Brand Marketplace</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-neutral-900 max-w-4xl mx-auto">
            Discover Real Outfits. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Tag Local Brands.
            </span>{" "}
            Shop in One Click.
          </h1>

          <p className="mt-4 text-neutral-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            Styly unites fashion creators, shoppers, and local brands on a fast, live social feed. Tag pieces directly, buy from multiple brands in a single bag, and track split shipments in real-time.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
            <Button
              onClick={handleEnterApp}
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-extrabold px-8 shadow-lg shadow-rose-500/20 text-xs sm:text-sm border-0 transition-transform hover:scale-[1.02]"
            >
              Explore Live Feed
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const el = document.getElementById("showcase");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              size="lg"
              className="h-12 rounded-full border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-bold px-7 text-xs sm:text-sm shadow-xs"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5 text-neutral-500" />
              See App In Action
            </Button>
          </div>

          {/* ── Prominent 3D Featured App Photo ── */}
          <div id="showcase" className="mt-14 md:mt-16 max-w-4xl mx-auto relative group">
            
            {/* Glowing background halo */}
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-orange-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-85 transition duration-700 pointer-events-none" />
            
            {/* 3D App Card */}
            <div className="relative rounded-3xl overflow-hidden border border-neutral-200/80 bg-white p-2.5 shadow-2xl hero-mockup-3d">
              <img
                src="/landing_feed_mockup.jpg"
                alt="Styly Creator Feed and Outfit Tagging Interface"
                className="w-full h-auto object-cover rounded-2xl"
              />
              
              {/* Floating Bottom Info Bar */}
              <div className="mt-2.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                    <span>Interactive Creator Outfits & Hotspot Tags</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Tap clothing tags to view garment specs, live TND pricing, and add items straight to your shopping bag.
                  </p>
                </div>
                <Button
                  onClick={handleEnterApp}
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-95 text-white font-extrabold text-xs px-5 shrink-0 border-0 shadow-md shadow-rose-500/30"
                >
                  Try Feed
                </Button>
              </div>
            </div>

            {/* Floating Top Badge */}
            <div className="absolute -top-4 left-6 sm:left-10 bg-white/95 backdrop-blur border border-rose-200/80 px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-bold text-neutral-800 tracking-wide uppercase">Live MongoDB Feed</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto mt-14 pt-8 border-t border-neutral-200/70 text-left">
            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/70 card-3d-shadow">
              <p className="text-xl sm:text-2xl font-black text-neutral-900">100%</p>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Live Database Pipeline</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/70 card-3d-shadow">
              <p className="text-xl sm:text-2xl font-black text-neutral-900">Multi-Brand</p>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Split Shipment Tracking</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/70 card-3d-shadow">
              <p className="text-xl sm:text-2xl font-black text-neutral-900">Direct Tag</p>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Brand Dashboard Sync</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/70 card-3d-shadow">
              <p className="text-xl sm:text-2xl font-black text-neutral-900">TND Hub</p>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Tunisian Fashion Currency</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-16 md:py-24 border-t border-neutral-200/70 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              Frictionless Commerce
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900">How Styly Works</h2>
            <p className="text-neutral-600 text-xs sm:text-sm">
              A smooth 3-step loop uniting fashion creators, shoppers, and brand partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/80 space-y-4 text-left card-3d-shadow hover:border-rose-300 transition-colors">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-black text-base">
                1
              </div>
              <h3 className="text-base font-bold text-neutral-900">Creators Post & Tag Brands</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Snap and upload your looks. Tag registered brands or enter custom tags with live piece prices in TND.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/80 space-y-4 text-left card-3d-shadow hover:border-orange-300 transition-colors">
              <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-base">
                2
              </div>
              <h3 className="text-base font-bold text-neutral-900">Shoppers Buy in 1 Single Bag</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Combine items from multiple fashion brands in one cart. The system automatically splits shipments per designer.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/80 space-y-4 text-left card-3d-shadow hover:border-emerald-300 transition-colors">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black text-base">
                3
              </div>
              <h3 className="text-base font-bold text-neutral-900">Brands Dispatch & Creators Earn</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Brand portals receive their specific orders, prepare packages, while creators earn verified sales commissions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Core Value Propositions ── */}
      <section id="features" className="py-16 md:py-24 border-t border-neutral-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900">Engineered for Modern Fashion</h2>
            <p className="text-neutral-600 text-xs sm:text-sm">
              Packed with powerful features for creators, shoppers, and brand managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(({ icon: Icon, title, description, badge }) => (
              <Card key={title} className="bg-white border border-neutral-200/80 hover:border-rose-200 card-3d-shadow transition-all text-left">
                <CardContent className="p-6 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Partners Banner ── */}
      <section id="brands" className="py-16 border-t border-neutral-200/70 bg-gradient-to-br from-rose-500/5 via-orange-500/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
            <Building size={22} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-neutral-900">Are You a Fashion Brand?</h2>
          <p className="text-neutral-600 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
            Register your official brand store to access your dedicated dashboard. Review tagged creator posts, manage incoming shipments, and boost in-app sales.
          </p>
          <div className="pt-1">
            <Button
              onClick={() => setLocation("/auth")}
              size="lg"
              className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-7 text-xs sm:text-sm shadow-md"
            >
              Register Brand Store
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="reviews" className="py-16 md:py-24 border-t border-neutral-200/70 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900">Trusted by Creators & Brands</h2>
            <p className="text-neutral-600 text-xs sm:text-sm">
              What the fashion community is saying about their Styly experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="bg-white border border-neutral-200/80 text-left card-3d-shadow">
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-5">
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed italic">"{t.quote}"</p>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                    <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full object-cover border border-neutral-200" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate leading-none">{t.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">{t.role}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full ml-auto">
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
      <section className="py-16 md:py-20 border-t border-neutral-200/70 bg-gradient-to-b from-white to-neutral-100/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900">
            Ready to find your signature fit?
          </h2>
          <p className="text-neutral-600 max-w-md mx-auto text-xs sm:text-sm">
            Join creators and fashion brands sharing styled matching items today.
          </p>
          <div className="pt-2">
            <Button
              onClick={handleEnterApp}
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-extrabold px-8 shadow-lg shadow-rose-500/25 text-xs sm:text-sm border-0 transition-transform hover:scale-[1.02]"
            >
              Get Started For Free
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center font-black text-white text-[10px]">
              S
            </div>
            <span className="text-base font-black bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">Styly</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            &copy; {new Date().getFullYear()} Styly Fashion Platform. All rights reserved.
          </p>
          <div className="flex gap-5 text-[11px] text-neutral-500">
            <a href="#showcase" className="hover:text-neutral-800">App Preview</a>
            <a href="#features" className="hover:text-neutral-800">Key Features</a>
            <a href="#brands" className="hover:text-neutral-800">Brands</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
