import { useState } from "react";
import { useLocation } from "wouter";
import AppShell, { useAppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Heart,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Flame,
  Zap,
  ArrowRight,
  Trophy,
  Crown,
  Award,
  Store,
  Package,
} from "lucide-react";
import { toast } from "sonner";

// ─── Static constants ─────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Tops", "Dresses", "Jackets", "Pants", "Accessories", "Shoes"];
const SORT_OPTIONS = ["Most Popular", "Newest", "Price: Low to High", "Price: High to Low"];

// ─── Explore Page ─────────────────────────────────────────────────────────────

export default function Explore() {
  const [, setLocation] = useLocation();
  const { addToBag } = useAppShell();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Most Popular");
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<"discover" | "browse" | "leaderboard">("discover");

  // ── Live DB data ──
  const { data: rawDevices = [], isLoading: devicesLoading } = trpc.devices.list.useQuery();
  const { data: rawBrands = [], isLoading: brandsLoading } = trpc.brands.list.useQuery();

  // Map devices to item format
  const allItems = (rawDevices as any[]).map((d: any) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    brand: (rawBrands as any[]).find((b: any) => b.id === d.brandId)?.name || "Unknown Brand",
    brandId: d.brandId,
    category: d.category || "Other",
    likes: 0,
    image: d.imageUrl || "/product_jacket.png",
    rating: 4.5,
    stock: d.stock ?? 0,
  }));

  const toggleLike = (id: number) => {
    setLikedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  let filtered = allItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || item.category.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  if (sort === "Price: Low to High") filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === "Price: High to Low") filtered = [...filtered].sort((a, b) => b.price - a.price);

  const topItems = [...allItems].slice(0, 4);
  const isLoading = devicesLoading || brandsLoading;

  return (
    <AppShell activePath="/explore" showRightPanel={false}>
      <div className="pb-20 lg:pb-8">

        {/* ── Search Bar (sticky) ── */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#0F0F0F]/80 glassmorphic border-b border-border/30 px-4 lg:px-8 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items, brands…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (e.target.value) setActiveSection("browse"); }}
                className="w-full h-9 pl-9 pr-4 rounded-full bg-muted border border-border/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transit-all ${showFilters ? "bg-primary text-white border-primary" : "bg-muted border-border/30 hover:border-primary/40"}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>
          </div>

          {/* Section tabs */}
          <div className="max-w-5xl mx-auto mt-2.5 flex gap-1">
            {[
              { key: "discover", label: "🔥 Discover" },
              { key: "browse", label: "🛍️ Browse All" },
              { key: "leaderboard", label: "👑 Leaderboard" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transit-all ${
                  activeSection === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 lg:px-8">

          {activeSection === "discover" && (
            <div className="space-y-7 pt-5">

              {/* ── Trending Brands Horizontal Scroll ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" /> Verified Brands
                  </h2>
                  <span className="text-[10px] text-muted-foreground font-semibold">Live data</span>
                </div>
                {isLoading ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="shrink-0 w-36 h-24 rounded-2xl bg-muted/60 animate-pulse" />
                    ))}
                  </div>
                ) : (rawBrands as any[]).filter((b: any) => b.isActive !== false).length === 0 ? (
                  <div className="flex items-center gap-3 py-6 px-4 rounded-2xl border border-border/30 bg-muted/30">
                    <Store className="h-8 w-8 text-muted-foreground/40 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">No verified brands yet</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Be the first to register your brand on Styly!</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {(rawBrands as any[]).filter((b: any) => b.isActive !== false).map((brand: any, i: number) => {
                      const gradients = [
                        "from-rose-500 to-pink-600",
                        "from-slate-700 to-slate-900",
                        "from-amber-500 to-yellow-600",
                        "from-emerald-500 to-teal-600",
                        "from-blue-500 to-indigo-600",
                        "from-violet-500 to-purple-700",
                      ];
                      const color = gradients[i % gradients.length];
                      const brandItems = allItems.filter(item => item.brandId === brand.id);
                      return (
                        <div
                          key={brand.id}
                          onClick={() => { setSearch(brand.name); setActiveSection("browse"); }}
                          className={`shrink-0 w-36 rounded-2xl bg-gradient-to-br ${color} p-4 cursor-pointer hover:scale-105 transit-all relative overflow-hidden shadow-md`}
                        >
                          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
                          <p className="text-white font-black text-xs leading-tight">{brand.name}</p>
                          <p className="text-white/70 text-[9px] mt-0.5">{brand.category || "Fashion"}</p>
                          <div className="mt-3 flex items-end justify-between">
                            <span className="text-white/80 text-[9px]">{brandItems.length} items</span>
                            <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Live</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── Most Liked This Week ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-yellow-500" /> Featured Products
                  </h2>
                  <button
                    onClick={() => setActiveSection("browse")}
                    className="text-[10px] text-primary font-bold flex items-center gap-0.5 hover:underline"
                  >
                    See all <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-[3/4] rounded-2xl bg-muted/60 animate-pulse" />
                    ))}
                  </div>
                ) : topItems.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-border/30 bg-white dark:bg-[#1A1A1A]">
                    <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">No products listed yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Brand owners can list products from their dashboard</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {topItems.map((item, i) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/15 transit-all group cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transit-all" />
                          {i === 0 && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                              🔥 New
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 dark:bg-[#1A1A1A]/80 glassmorphic flex items-center justify-center transit-all hover:scale-110"
                          >
                            <Heart className={`h-3.5 w-3.5 ${likedItems.includes(item.id) ? "fill-primary text-primary" : "text-foreground/60"}`} />
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="text-[9px] text-muted-foreground truncate">{item.brand}</p>
                          <p className="font-bold text-xs leading-tight truncate mt-0.5">{item.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-primary font-black text-sm">{item.price} TND</p>
                            <button
                              onClick={() => addToBag({ id: item.id, name: item.name, price: item.price, image: item.image, size: "M" })}
                              className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transit-all shadow-sm"
                            >
                              <ShoppingBag className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Featured Collection Banner ── */}
              <section>
                <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden border border-purple-500/20 shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-10 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <span className="text-[9px] font-black tracking-widest text-purple-300 uppercase">Styly Platform</span>
                    <h3 className="text-xl font-black text-white mt-1">Discover Fashion</h3>
                    <p className="text-xs text-white/60 mt-1 max-w-xs">Browse real products from verified local brands. Post your outfits and get discovered.</p>
                    <button
                      onClick={() => setActiveSection("browse")}
                      className="mt-4 px-5 py-2 bg-white text-slate-900 rounded-full text-xs font-black hover:bg-white/90 transit-all flex items-center gap-1.5 shadow-lg w-fit"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Browse All
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === "browse" && (
            <div className="pt-5">
              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transit-all shrink-0 ${
                      category === cat
                        ? "bg-primary text-white shadow-sm shadow-primary/25"
                        : "bg-muted border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="ml-auto h-8 px-3 rounded-xl bg-muted border border-border/30 text-xs font-semibold focus:outline-none transit-all shrink-0"
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Results */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{filtered.length}</span> items found
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">Sorted by <span className="font-semibold text-foreground">{sort}</span></p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl bg-muted/60 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-border/30 bg-white dark:bg-[#1A1A1A]">
                  <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold">No products found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allItems.length === 0
                      ? "Brand owners can add products from their dashboard"
                      : "Try a different search or category"
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                  {filtered.map((item, i) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden flex flex-col transit-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/15 animate-fade-up group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transit-all" />
                        <button
                          onClick={() => toggleLike(item.id)}
                          className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/80 dark:bg-[#1A1A1A]/80 glassmorphic flex items-center justify-center transit-all hover:scale-110"
                        >
                          <Heart className={`h-3.5 w-3.5 ${likedItems.includes(item.id) ? "fill-primary text-primary" : "text-foreground/60"}`} />
                        </button>
                        {item.stock === 0 && (
                          <div className="absolute bottom-2 left-2 bg-red-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Out of Stock
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col gap-2 flex-1">
                        <div>
                          <p className="text-[10px] text-muted-foreground truncate">{item.brand}</p>
                          <p className="font-bold text-xs leading-tight truncate mt-0.5">{item.name}</p>
                          <p className="text-primary font-black text-sm mt-1">{item.price} TND</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-auto">
                          <button
                            onClick={() => addToBag({ id: item.id, name: item.name, price: item.price, image: item.image, size: "M" })}
                            disabled={item.stock === 0}
                            className="flex-1 h-8 rounded-full bg-primary text-white text-[10px] font-bold hover:bg-primary/90 transit-all flex items-center justify-center gap-1 shadow-sm shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShoppingBag className="h-3 w-3" /> Add to Bag
                          </button>
                          <button
                            onClick={() => toast.info("Try-on opens from the feed")}
                            className="h-8 w-8 rounded-full bg-muted border border-border/30 flex items-center justify-center hover:bg-accent transit-all"
                            title="Try On"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "leaderboard" && <LeaderboardSection />}
        </div>
      </div>
    </AppShell>
  );
}
// ─────────────────────────────────────────────────────────────
// LEADERBOARD SECTION — lists top style points earners (live DB only)
// ─────────────────────────────────────────────────────────────
function LeaderboardSection() {
  const { data: rawLeaderboard = [], isLoading } = trpc.userGrade.leaderboard.useQuery({ limit: 10 });

  const leaderboard = [...(rawLeaderboard as any[])].sort((a, b) => b.stylePoints - a.stylePoints);

  if (isLoading) {
    return (
      <div className="pt-8 space-y-4">
        <div className="h-48 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="pt-8 text-center py-20">
        <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground">Leaderboard is empty</p>
        <p className="text-xs text-muted-foreground mt-1">Start posting outfits to earn Style Points and claim the crown!</p>
      </div>
    );
  }

  const rank1 = leaderboard[0];
  const rank2 = leaderboard[1];
  const rank3 = leaderboard[2];
  const rest = leaderboard.slice(3, 10);

  return (
    <div className="pt-6 space-y-8 animate-fade-up pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" /> Style Leaderboard
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Scale your grade, approved tags, and daily outfit highlights to claim the crown.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto items-end pt-12 pb-4">
        {rank2 && (
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-100 dark:bg-slate-800 shadow-lg flex items-center justify-center font-bold text-lg">
                {rank2.userAvatar ? <img src={rank2.userAvatar} className="h-full w-full object-cover" /> : rank2.userName?.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl text-slate-400">🥈</span>
            </div>
            <div>
              <p className="font-bold text-xs truncate max-w-[90px]">{rank2.userName}</p>
              <p className="text-[9px] text-muted-foreground">{rank2.gradeTitle}</p>
              <span className="text-[10px] font-black text-slate-400">{rank2.stylePoints} SP</span>
            </div>
            <div className="w-full h-16 bg-slate-200/50 dark:bg-slate-800/40 rounded-t-2xl border-t border-slate-300/30 flex items-center justify-center">
              <span className="text-xl font-black text-slate-400">2</span>
            </div>
          </div>
        )}

        {rank1 && (
          <div className="flex flex-col items-center space-y-2 text-center transform -translate-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 shadow-2xl flex items-center justify-center font-bold text-xl relative">
                {rank1.userAvatar ? <img src={rank1.userAvatar} className="h-full w-full object-cover" /> : rank1.userName?.charAt(0).toUpperCase()}
              </div>
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 h-6 w-6 animate-bounce" />
            </div>
            <div>
              <p className="font-black text-sm truncate max-w-[110px]">{rank1.userName}</p>
              <p className="text-[10px] text-amber-500 font-bold">{rank1.gradeTitle}</p>
              <span className="text-xs font-black text-amber-500">{rank1.stylePoints} SP</span>
            </div>
            <div className="w-full h-24 bg-amber-500/10 dark:bg-amber-500/5 rounded-t-2xl border-t-2 border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-400/5">
              <span className="text-3xl font-black text-amber-400">1</span>
            </div>
          </div>
        )}

        {rank3 && (
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-amber-700 bg-amber-50 dark:bg-amber-900/10 shadow-lg flex items-center justify-center font-bold text-lg">
                {rank3.userAvatar ? <img src={rank3.userAvatar} className="h-full w-full object-cover" /> : rank3.userName?.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl text-amber-700">🥉</span>
            </div>
            <div>
              <p className="font-bold text-xs truncate max-w-[90px]">{rank3.userName}</p>
              <p className="text-[9px] text-muted-foreground">{rank3.gradeTitle}</p>
              <span className="text-[10px] font-black text-amber-700">{rank3.stylePoints} SP</span>
            </div>
            <div className="w-full h-12 bg-amber-800/20 dark:bg-amber-900/10 rounded-t-2xl border-t border-amber-700/20 flex items-center justify-center">
              <span className="text-lg font-black text-amber-700">3</span>
            </div>
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div className="max-w-md mx-auto bg-white dark:bg-[#1A1A1A] border border-border/30 rounded-3xl overflow-hidden shadow-sm divide-y divide-border/20">
          {rest.map((entry, index) => {
            const rank = index + 4;
            return (
              <div key={entry.userId} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{rank}</span>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-border/40">
                    {entry.userAvatar ? <img src={entry.userAvatar} className="h-full w-full object-cover" /> : entry.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{entry.userName}</p>
                    <p className="text-[9px] text-muted-foreground leading-none mt-0.5">{entry.gradeTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary">{entry.stylePoints} SP</p>
                  <p className="text-[8px] text-muted-foreground">Grade {entry.grade || 1}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
