import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Shirt,
  Smartphone,
  TrendingUp,
  Shield,
  Star,
  ArrowRight,
  Menu,
  X,
  Building,
} from "lucide-react";

// ─── Dummy ratings / reviews ───────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "Fashion Content Creator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    quote: "Styly's 3D mannequin customizer changed how I shop online. I put in my exact measurements and it fits perfectly every single time!",
    rating: 5,
    tag: "Casual Fit"
  },
  {
    name: "Marcello Rossi",
    role: "Creative Director, Rossi Milan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    quote: "Using the Brand Dashboard, we synced our lookbook posts and drove a 40% increase in checkout conversions. The tRPC sync is seamless.",
    rating: 5,
    tag: "Brand Sync"
  },
  {
    name: "Amélie Dubois",
    role: "Stylist & Influencer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    quote: "The combination of a visual outfit feed and direct tagged product checkout makes inspiration instantly actionable. Incredible design!",
    rating: 5,
    tag: "Social Feed"
  }
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Only redirect already-logged-in users to the feed
    // Unauthenticated users stay on the landing page
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
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 selection:bg-rose-500/10 selection:text-rose-600 font-sans overflow-x-hidden relative">
      
      {/* Injection of premium CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-0.5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(225, 29, 72, 0.1), 0 0 5px rgba(249, 115, 22, 0.03); }
          50% { box-shadow: 0 0 30px rgba(225, 29, 72, 0.25), 0 0 15px rgba(249, 115, 22, 0.08); }
        }
        @keyframes ambientDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, 2%) scale(1.03); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-reverse 7s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-pulse-glow {
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .animate-ambient {
          animation: ambientDrift 20s ease-in-out infinite;
        }
        .glassmorphic-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .glassmorphic-card:hover {
          border-color: rgba(225, 29, 72, 0.2);
          background: rgba(255, 255, 255, 0.85);
        }
      `}</style>

      {/* Warm brand-color ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none animate-ambient" />
      <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-500/3 blur-[120px] pointer-events-none animate-ambient" style={{ animationDelay: '-5s' }} />
      <div className="absolute bottom-[10%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-rose-500/3 blur-[120px] pointer-events-none animate-ambient" style={{ animationDelay: '-10s' }} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 bg-white/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <span className="text-2xl font-black bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 bg-clip-text text-transparent tracking-tight">
              Styly
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#showcase" className="hover:text-neutral-900 transition-colors">Showcase</a>
            <a href="#features" className="hover:text-neutral-900 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-neutral-900 transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-neutral-900 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLocation("/auth")}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <Button
              onClick={handleEnterApp}
              className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white font-semibold shadow-lg shadow-rose-500/20 px-5 animate-pulse-glow border-0"
            >
              Launch App
            </Button>
          </div>

          <button 
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-200/80 bg-white/95 px-4 pt-2 pb-6 space-y-3">
            <a 
              href="#showcase" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Showcase
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Features
            </a>
            <a 
              href="#testimonials" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Reviews
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              FAQ
            </a>
            <div className="h-px bg-neutral-200 my-2" />
            <div className="flex gap-4 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                onClick={() => { setMobileMenuOpen(false); setLocation("/auth"); }}
              >
                Sign In
              </Button>
              <Button
                className="w-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0"
                onClick={() => { setMobileMenuOpen(false); handleEnterApp(); }}
              >
                Launch App
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-12 pb-16 md:pt-24 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 animate-pulse">
                <Sparkles size={12} />
                Virtual Fitting Room & Social Commerce
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-neutral-900">
                The Social Fashion Platform Designed for <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">Your Fit</span>
              </h1>
              
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                Create your custom 3D mannequin profile using exact chest, waist, and height specifications. Try on designer outfits virtually, browse fashion inspiration feeds, and order the perfect fit.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={handleEnterApp}
                  size="lg"
                  className="h-14 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-bold px-8 shadow-xl shadow-rose-500/20 text-base border-0"
                >
                  Get Started For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById("showcase");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  size="lg"
                  className="h-14 rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-8 text-base"
                >
                  Explore Showcase
                </Button>
              </div>

              {/* Trust Badge */}
              <div className="pt-6 flex items-center gap-6 border-t border-neutral-100">
                <div>
                  <p className="text-2xl font-bold text-neutral-900">98%</p>
                  <p className="text-xs text-neutral-500">Fit accuracy rating</p>
                </div>
                <div className="w-px h-8 bg-neutral-200" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">50+</p>
                  <p className="text-xs text-neutral-500">Partner brands synced</p>
                </div>
                <div className="w-px h-8 bg-neutral-200" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">10k+</p>
                  <p className="text-xs text-neutral-500">Active style feeds</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Graphic (Body measurements + App UI Mockup) */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-[500px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/10 border border-neutral-100/80 bg-white p-2 animate-float">
                <img 
                  src="/landing_hero.png" 
                  alt="Styly 3D Mannequin and Mobile App" 
                  className="w-full h-full object-cover rounded-2xl"
                />
                
                {/* Floating Micro Tag */}
                <div className="absolute top-8 left-8 bg-white/95 backdrop-blur border border-neutral-200/80 px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-bold text-neutral-800">3D Fit Active</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Showcase Section ── */}
      <section id="showcase" className="py-16 md:py-24 border-t border-neutral-200/60 bg-neutral-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">Showcase Room</h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm md:text-base">
              Experience the dual power of the mobile consumer app and the professional brand panel.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-bold text-rose-600 tracking-widest uppercase mb-1 block">Live Interface Mockup</span>
              <h3 className="text-2xl font-extrabold text-neutral-900">Professional Dashboard</h3>
              <p className="text-neutral-500 text-sm mt-1">Manage inventories, sync items via mobile endpoint, and track user checkout trends.</p>
            </div>

            {/* Browser frame surrounding the generated screenshot */}
            <div className="w-full border border-neutral-200 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden relative group transition-all duration-500 hover:border-rose-200 hover:shadow-rose-500/5">
              {/* Header bar */}
              <div className="bg-neutral-50/80 border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white border border-neutral-200 px-3 py-1 rounded-lg text-[10px] text-neutral-500 flex items-center gap-2 max-w-xs mx-auto">
                  <span className="text-neutral-400">https://</span>
                  <span>styly.com/dashboard/brand</span>
                </div>
              </div>

              {/* Main image content */}
              <div className="relative overflow-hidden aspect-[1.58] bg-neutral-50 flex items-center justify-center">
                <img 
                  src="/styly_dashboard_mockup.png" 
                  alt="Styly Platform Interface" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                
                {/* High Tech Badges */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-neutral-200 px-3 py-1.5 rounded-full text-[10px] font-bold text-rose-600 flex items-center gap-1.5 shadow-md">
                  <Sparkles size={11} className="animate-pulse" />
                  Interactive Fashion Console
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-16 md:py-24 border-t border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">Key Value Propositions</h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm md:text-base">
              Styly bridges the gap between style discovery and perfect fit verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shirt,
                title: "3D Mannequin Customizer",
                desc: "Set your exact height, weight, waist, chest, and hips to simulate fit metrics in real-time.",
                color: "text-rose-500 bg-rose-50 border-rose-100"
              },
              {
                icon: Smartphone,
                title: "Creator Outfits Feed",
                desc: "Post your fits, tag brands and specific pieces, and browse style ideas from the community.",
                color: "text-orange-500 bg-orange-50 border-orange-100"
              },
              {
                icon: TrendingUp,
                title: "Brand Analytics Console",
                desc: "Track sales trends, manage inventory size stock, and review customer interaction logs.",
                color: "text-rose-600 bg-rose-50/50 border-rose-100"
              },
              {
                icon: Shield,
                title: "Secure Checkouts",
                desc: "Store shopping bag profiles locally and complete transactions using secure endpoints.",
                color: "text-emerald-600 bg-emerald-50 border-emerald-100"
              }
            ].map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="glassmorphic-card border border-neutral-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/5">
                <CardContent className="p-6 space-y-4 text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section id="testimonials" className="py-16 md:py-24 border-t border-neutral-200/60 bg-neutral-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">Loved by Fashion Experts</h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm md:text-base">
              See what creators and brand managers are saying about their Styly experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="glassmorphic-card border border-neutral-200/60 text-left transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/5">
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed italic">"{t.quote}"</p>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                    <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full object-cover border border-neutral-200" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate leading-none">{t.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">{t.role}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-full ml-auto">
                      {t.tag}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand dashboard callout ── */}
      <section className="py-16 md:py-20 border-t border-neutral-200/60 bg-rose-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
            <Building size={24} />
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-neutral-900">Are you a Fashion Brand?</h2>
          <p className="text-neutral-600 max-w-lg mx-auto text-sm md:text-base">
            Create your Styly user account first to access the platform. Once inside, you can unlock and configure your dedicated Brand Dashboard to sync products and review feeds.
          </p>
          <Button
            onClick={() => setLocation("/auth")}
            className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white px-6 font-semibold"
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-16 md:py-24 border-t border-neutral-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">Frequently Asked Questions</h2>
            <p className="text-neutral-600 text-sm md:text-base">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How accurate is the 3D customizer mannequin?",
                a: "Highly accurate! We map height, chest, and waist ratios using baseline anthropometric profiles, giving you a very close approximation of garment fit profiles."
              },
              {
                q: "How do brands sync their collections?",
                a: "Brands use our sync endpoints in combination with our tRPC protocol. Simply create a user account, launch the brand dashboard, and sync products directly."
              },
              {
                q: "Is there a charge to register as a Brand store?",
                a: "No, registering during our beta phase is completely free! You can launch your brand storefront directly inside the authenticated user app."
              }
            ].map(({ q, a }, idx) => (
              <div key={idx} className="border border-neutral-200/60 bg-white rounded-2xl p-6 text-left hover:border-rose-200 transition-colors duration-300">
                <h4 className="font-bold text-neutral-900">{q}</h4>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call To Action Footer Banner ── */}
      <section className="py-16 md:py-24 border-t border-neutral-200/60 bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">Ready to find your perfect fit?</h2>
          <p className="text-neutral-600 max-w-lg mx-auto text-sm md:text-base">
            Join thousands of fashion lovers and brands sharing styled matching items today.
          </p>
          <Button
            onClick={handleEnterApp}
            size="lg"
            className="h-14 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:opacity-95 text-white font-bold px-8 shadow-xl shadow-rose-500/20 text-base border-0 animate-pulse-glow"
          >
            Get Started For Free
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xl font-black bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent tracking-tight">
            Styly
          </span>
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} Styly Fashion Platform. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-neutral-500">
            <a href="#showcase" className="hover:text-neutral-800">Privacy Policy</a>
            <a href="#features" className="hover:text-neutral-800">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
