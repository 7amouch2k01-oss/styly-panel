import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import AppShell, { useAppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { BrandLevelBadge } from "@/components/BrandLevelBadge";
import {
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Tag,
  Info,
  ExternalLink,
  MapPin,
  Flame,
  CheckCircle,
  X
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// LOCAL IMAGE WITH HOTSPOTS component
// ─────────────────────────────────────────────────────────────
interface ImageWithHotspotsProps {
  image: string;
  caption: string;
  hotspotsJson?: string | null;
  taggedProduct: any;
  onTryOn: () => void;
  onAddToBag: () => void;
}

function ImageWithHotspots({ image, caption, hotspotsJson, taggedProduct, onTryOn, onAddToBag }: ImageWithHotspotsProps) {
  const [activeTag, setActiveTag] = useState<any | null>(null);
  
  let hotspots: any[] = [];
  if (hotspotsJson) {
    try {
      hotspots = JSON.parse(hotspotsJson);
    } catch (e) {}
  }

  return (
    <div className="relative w-full h-full overflow-hidden group">
      <img src={image} alt={caption} className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02] select-none" />
      
      {hotspots.map((hs: any, idx: number) => (
        <div key={idx}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTag(activeTag === hs ? null : hs);
            }}
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-primary/95 border-2 border-white flex items-center justify-center animate-pulse shadow-lg cursor-pointer z-20 hover:scale-110 transition-all"
            style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
          </button>

          {activeTag === hs && (
            <div
              className="absolute z-30 w-48 bg-white dark:bg-[#1A1A1A] border border-border/50 rounded-2xl p-3 shadow-2xl animate-in zoom-in-95 duration-200"
              style={{
                left: `${Math.min(72, Math.max(8, hs.x))}%`,
                top: `${hs.y > 60 ? hs.y - 45 : hs.y + 5}%`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-1">
                <div className="flex gap-2 items-center min-w-0">
                  <img src={taggedProduct.image} className="w-8 h-8 rounded object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-[10px] truncate leading-tight text-foreground">{taggedProduct.name}</p>
                    <p className="text-[11px] font-black text-primary leading-tight">${taggedProduct.price}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className="h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center shrink-0"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => { onAddToBag(); toast.success("Added to Bag! 🛍️"); setActiveTag(null); }}
                  className="flex-1 h-7 rounded-xl bg-primary text-white text-[9px] font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-0.5"
                >
                  Add Bag
                </button>
                <button
                  type="button"
                  onClick={() => { onTryOn(); setActiveTag(null); }}
                  className="flex-1 h-7 rounded-xl bg-muted border border-border/30 text-foreground text-[9px] font-bold hover:bg-accent transition-all flex items-center justify-center gap-0.5"
                >
                  <Sparkles className="h-2.5 w-2.5 text-primary" /> Try On
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND STOREFRONT PAGE
// ─────────────────────────────────────────────────────────────
export default function BrandStorefront() {
  const [, match] = useRoute("/brand-store/:brandId");
  const [, setLocation] = useLocation();
  const { addToBag } = useAppShell();
  const brandId = match ? Number(match.brandId) : null;

  const [activeTab, setActiveTab] = useState<"catalog" | "looks">("catalog");

  // Query storefront data
  const { data: storeData, isLoading, error } = trpc.brands.storefront.useQuery(
    { brandId: brandId || 0 },
    { enabled: !!brandId }
  );

  // Virtual Fitting Room hooks for post actions
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<any | null>(null);

  if (isLoading) {
    return (
      <AppShell activePath="/shop">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading brand storefront...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !storeData) {
    return (
      <AppShell activePath="/shop">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <Info className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="font-extrabold text-sm text-foreground">Brand Storefront Not Found</h2>
            <p className="text-xs text-muted-foreground mt-1">This brand may not have registered their micro-storefront yet.</p>
          </div>
          <button
            onClick={() => setLocation("/shop")}
            className="h-10 px-4 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-2 hover:bg-primary/95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Shop
          </button>
        </div>
      </AppShell>
    );
  }

  const { brand, level, products, posts } = storeData;

  return (
    <AppShell activePath="/shop" showRightPanel>
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <button
          onClick={() => setLocation("/feed")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
        </button>

        {/* ── Brand Hero Card ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white dark:bg-[#1A1A1A] p-6 lg:p-8 shadow-xl shadow-black/5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="absolute top-0 right-0 h-40 w-40 bg-primary/3 rounded-full blur-3xl -z-10" />
          
          <div className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-2xl border border-border/50 bg-muted overflow-hidden shrink-0 shadow-md flex items-center justify-center">
              <img src={brand.logoUrl || "/logo.png"} alt={brand.name} className="h-full w-full object-cover" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black tracking-tight text-foreground">{brand.name}</h1>
                <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500" />
              </div>
              
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {brand.country}</span>
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {brand.category}</span>
                {brand.website && (
                  <a href={brand.website} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Level Badges */}
          <div className="shrink-0 flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/30 w-full md:w-auto">
            <BrandLevelBadge brandId={brand.id} showDetails={true} />
          </div>
        </div>

        {/* Brand Bio */}
        {brand.description && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1A]/80 border border-border/30 text-xs text-muted-foreground leading-relaxed shadow-sm">
            <p className="font-bold text-foreground mb-1">About {brand.name}</p>
            {brand.description}
          </div>
        )}

        {/* ── Tabs Selector ── */}
        <div className="flex border-b border-border/40 gap-4">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-2.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
              activeTab === "catalog" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Shop Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("looks")}
            className={`pb-2.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
              activeTab === "looks" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Styled Looks ({posts.length})
          </button>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "catalog" ? (
          /* Catalog Items Grid */
          products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-border/30">
              <p className="text-xs text-muted-foreground">This brand storefront has no products listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-3.5 flex flex-col justify-between hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                >
                  <div className="space-y-2.5">
                    <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border/40 relative">
                      <img src={p.imageUrl || "/product_dress_1.png"} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                        {p.category}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-foreground leading-tight line-clamp-1">{p.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{p.description || "No description provided."}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/20 mt-4 flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-primary">${p.price}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          addToBag({
                            id: p.id,
                            name: p.name,
                            price: Number(p.price),
                            image: p.imageUrl || "/product_dress_1.png",
                            size: "M"
                          });
                          toast.success(`"${p.name}" added to Bag! 🛍️`);
                        }}
                        className="h-8 px-2.5 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-0.5"
                      >
                        Bag
                      </button>
                      <button
                        onClick={() => {
                          // Dispatch virtual try-on trigger event
                          const event = new CustomEvent("styly_trigger_tryon", {
                            detail: {
                              id: p.id,
                              name: p.name,
                              price: Number(p.price),
                              image: p.imageUrl || "/product_dress_1.png"
                            }
                          });
                          window.dispatchEvent(event);
                          // Open Fitting Room tray directly
                          toast.success(`"${p.name}" sent to Virtual Fitting Room! 👗`);
                        }}
                        className="h-8 px-2 rounded-xl bg-muted border border-border/30 text-foreground text-[10px] font-bold hover:bg-accent transition-all flex items-center justify-center gap-0.5"
                      >
                        <Sparkles className="h-3 w-3 text-primary" /> Try
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Styled Looks Feed Grid */
          posts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-border/30">
              <p className="text-xs text-muted-foreground">No styled looks tag this brand yet. Be the first to tag them!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden flex flex-col hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                >
                  <div className="p-2.5 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full overflow-hidden border border-border/40 bg-muted shrink-0">
                      <img src={post.creator?.avatar || "/logo.png"} alt={post.creator?.name || "Poster"} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[9px] truncate leading-tight text-foreground">{post.creator?.name || "Aria Fenix"}</p>
                      <p className="text-[8px] text-muted-foreground leading-none">{post.creator?.username || "@aria"}</p>
                    </div>
                  </div>

                  <div className="aspect-[4/5] bg-muted overflow-hidden relative">
                    <ImageWithHotspots
                      image={post.image}
                      caption={post.caption}
                      hotspotsJson={post.hotspots}
                      taggedProduct={post.taggedProduct}
                      onTryOn={() => {
                        const event = new CustomEvent("styly_trigger_tryon", { detail: post.taggedProduct });
                        window.dispatchEvent(event);
                      }}
                      onAddToBag={() => addToBag({ ...post.taggedProduct, size: "M" })}
                    />
                  </div>

                  <div className="p-2.5">
                    <p className="text-[10px] text-foreground/80 line-clamp-2 leading-relaxed">
                      <span className="font-bold mr-1">{post.creator?.name || "You"}</span>{post.caption}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

      </div>
    </AppShell>
  );
}
