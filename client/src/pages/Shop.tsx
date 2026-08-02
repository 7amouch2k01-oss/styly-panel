import { useState } from "react";
import { useLocation } from "wouter";
import AppShell, { useAppShell } from "@/components/AppShell";
import {
  ShoppingBag,
  Heart,
  Star,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Flame,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_BRANDS = [
  { id: 1, name: "Queen Rania Collection", tagline: "Elegance Redefined", color: "from-rose-400 to-red-600", items: 42 },
  { id: 2, name: "Urban Threads",          tagline: "Modern Essentials",  color: "from-slate-500 to-slate-800", items: 78 },
  { id: 3, name: "Street Couture",         tagline: "Streetwear Culture", color: "from-orange-400 to-amber-600", items: 55 },
  { id: 4, name: "Peak Activewear",        tagline: "Move. Perform. Live", color: "from-emerald-400 to-teal-600", items: 33 },
];

const NEW_ARRIVALS = [
  { id: 1, name: "Velvet Blazer",       price: 449, brand: "Urban Threads",  image: "/product_jacket.png",  badge: "New" },
  { id: 2, name: "Silk Wrap Dress",     price: 319, brand: "Lumière Paris",  image: "/product_dress_1.png", badge: "New" },
  { id: 3, name: "Cargo Joggers",       price: 179, brand: "Street Couture", image: "/product_jacket.png",  badge: "New" },
  { id: 4, name: "Floral Co-ord Set",   price: 269, brand: "Maya Styles",    image: "/product_dress_1.png", badge: "Hot 🔥" },
];

const DEALS = [
  { id: 10, name: "Linen Blend Blazer",     price: 199, originalPrice: 349, image: "/product_jacket.png",  discount: 43 },
  { id: 11, name: "Floaty Linen Dress",     price: 99,  originalPrice: 239, image: "/product_dress_1.png", discount: 59 },
  { id: 12, name: "Performance Jacket",     price: 149, originalPrice: 299, image: "/product_jacket.png",  discount: 50 },
  { id: 13, name: "Wrap Midi Dress",        price: 89,  originalPrice: 189, image: "/product_dress_1.png", discount: 53 },
];

// ─── Shop Page ────────────────────────────────────────────────────────────────

export default function Shop() {
  const [, setLocation] = useLocation();
  const { addToBag } = useAppShell();
  const [likedItems, setLikedItems] = useState<number[]>([]);

  const toggleLike = (id: number) =>
    setLikedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <AppShell activePath="/shop" showRightPanel>
      <div className="pb-20 lg:pb-8">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FF5252] px-6 py-10 lg:py-14">
          <div className="relative z-10 max-w-xl">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Styly Shop</p>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
              Discover Your<br />Perfect Style 👗
            </h1>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">
              Shop the latest from top brands and independent creators. Try before you buy with Styly AI.
            </p>
            <button
              onClick={() => setLocation("/explore")}
              className="flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-full hover:scale-105 transit-all shadow-lg shadow-primary/20"
            >
              Explore All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute right-20 -bottom-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute right-4 top-8 h-24 w-24 rounded-full bg-white/10" />
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-10">

          {/* ── Featured Brands ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base flex items-center gap-2">
                <BadgeCheck className="h-4.5 w-4.5 text-primary" /> Featured Brands
              </h2>
              <button
                onClick={() => setLocation("/explore")}
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transit-all"
              >
                See all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {FEATURED_BRANDS.map((brand, i) => (
                <div
                  key={brand.id}
                  className={`relative bg-gradient-to-br ${brand.color} rounded-2xl p-4 cursor-pointer overflow-hidden transit-all hover:scale-[1.03] hover:shadow-lg animate-fade-up`}
                  style={{ animationDelay: `${i * 70}ms` }}
                  onClick={() => toast.info(`Viewing ${brand.name}`)}
                >
                  <p className="text-white font-black text-sm leading-tight">{brand.name}</p>
                  <p className="text-white/70 text-[10px] mt-1">{brand.tagline}</p>
                  <p className="text-white/60 text-[9px] mt-3">{brand.items} items</p>
                  <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </section>

          {/* ── New Arrivals ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base flex items-center gap-2">
                <Flame className="h-4.5 w-4.5 text-orange-500" /> New Arrivals
              </h2>
              <button
                onClick={() => setLocation("/explore")}
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transit-all"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {NEW_ARRIVALS.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden transit-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/15 animate-fade-up group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transit-all"
                    />
                    <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                    <button
                      onClick={() => toggleLike(item.id)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 dark:bg-[#1A1A1A]/80 glassmorphic flex items-center justify-center transit-all hover:scale-110"
                    >
                      <Heart className={`h-3.5 w-3.5 ${likedItems.includes(item.id) ? "fill-primary text-primary" : "text-foreground/60"}`} />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] text-muted-foreground">{item.brand}</p>
                    <p className="font-bold text-xs leading-tight mt-0.5 truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-primary font-black text-sm">{item.price} TND</p>
                      <button
                        onClick={() => addToBag({ id: item.id, name: item.name, price: item.price, image: item.image, size: "M" })}
                        className="h-7 px-3 rounded-full bg-primary text-white text-[9px] font-bold hover:bg-primary/90 transit-all shadow-sm shadow-primary/20 flex items-center gap-1"
                      >
                        <ShoppingBag className="h-2.5 w-2.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Flash Deals ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base flex items-center gap-2">
                <Tag className="h-4.5 w-4.5 text-emerald-500" /> Flash Deals
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full font-semibold">Ends in 12:34:56</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {DEALS.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden transit-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-up group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transit-all"
                    />
                    <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      -{item.discount}%
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-xs leading-tight truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-primary font-black text-sm">{item.price} TND</p>
                      <p className="text-muted-foreground line-through text-[10px]">{item.originalPrice} TND</p>
                    </div>
                    <button
                      onClick={() => addToBag({ id: item.id, name: item.name, price: item.price, image: item.image, size: "M" })}
                      className="w-full mt-2 h-8 rounded-full bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transit-all shadow-sm shadow-emerald-500/20"
                    >
                      Grab Deal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── AI Try On Promo Banner ── */}
          <section>
            <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] dark:from-[#111] dark:to-[#1A1A1A] rounded-3xl p-6 lg:p-8 overflow-hidden flex items-center justify-between gap-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Styly AI</span>
                </div>
                <h3 className="text-white font-black text-lg lg:text-xl leading-tight mb-2">
                  Try before you buy.<br />
                  <span className="text-primary">Virtually.</span>
                </h3>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Set up your mannequin profile and try any outfit on your digital self before purchasing.
                </p>
                <button
                  onClick={() => setLocation("/mannequin")}
                  className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-full hover:bg-primary/90 transit-all shadow-lg shadow-primary/30"
                >
                  Set Up Mannequin <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Decorative */}
              <div className="hidden sm:flex h-28 w-28 lg:h-36 lg:w-36 rounded-full bg-primary/20 items-center justify-center shrink-0">
                <div className="h-20 w-20 lg:h-28 lg:w-28 rounded-full bg-primary/30 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 lg:h-12 lg:w-12 text-primary" />
                </div>
              </div>
              {/* BG circles */}
              <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/5" />
              <div className="absolute right-16 top-0 h-20 w-20 rounded-full bg-primary/10" />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
