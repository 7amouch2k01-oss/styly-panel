import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import AppShell, { useAppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  Share2,
  Sparkles,
  CheckCircle,
  Grid,
  List,
  ShoppingBag,
  X,
  ChevronRight,
  Flame,
  Package,
  Ruler,
  Star,
  Plus,
  ImagePlus,
  Tag,
  ChevronDown,
  Target,
  Palette,
  Info,
  Check,
  Shirt,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Types Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  brandId?: number;
  brandName?: string;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// IMAGE WITH HOTSPOTS component
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
interface ImageWithHotspotsProps {
  image: string;
  mediaType?: "image" | "video";
  caption: string;
  hotspotsJson?: string | null;
  taggedProduct: any;
  onTryOn: () => void;
  onAddToBag: () => void;
}

function ImageWithHotspots({ image, mediaType, caption, hotspotsJson, taggedProduct, onTryOn, onAddToBag }: ImageWithHotspotsProps) {
  const [activeTag, setActiveTag] = useState<any | null>(null);
  
  let hotspots: any[] = [];
  if (hotspotsJson) {
    try {
      hotspots = JSON.parse(hotspotsJson);
    } catch (e) {}
  }

  return (
    <div className="relative w-full h-full overflow-hidden group">
      {mediaType === "video" ? (
        <video src={image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
      ) : (
        <img src={image} alt={caption} className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02] select-none" />
      )}
      
      {hotspots.map((hs: any, idx: number) => (
        <div key={idx}>
          {/* Pulsing Tag Marker */}
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

          {/* Floating Popover Card */}
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
                    <p className="text-[11px] font-black text-primary leading-tight">{taggedProduct.price} TND</p>
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
                  onClick={() => { onAddToBag(); toast.success("Added to Bag! Ã°Å¸â€ºÂÃ¯Â¸Â"); setActiveTag(null); }}
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

export interface Post {
  id: number;
  creator: {
    name: string;
    username: string;
    avatar: string;
    isBrand: boolean;
    verified: boolean;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  taggedProduct: Product;
  hasLiked?: boolean;
  category?: string;
  hotspots?: string | null;
  gender?: "Woman" | "Man" | "All";
  colors?: string[];
  aesthetics?: string[];
  itemType?: string;
  mediaType?: "image" | "video";
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Item Subtypes per product type Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const PRODUCT_TYPES = [
  "T-Shirt", "Sweater", "Jeans", "Shoes", "Jacket",
  "Dress", "Shorts", "Accessories", "Others",
];

const SUBTYPES: Record<string, string[]> = {
  "T-Shirt":  ["Classic", "Oversized", "V-Neck", "Polo", "Graphic", "Cropped"],
  "Sweater":  ["Crewneck", "Turtleneck", "Cardigan", "V-Neck", "Knit", "Cropped"],
  "Jeans":    ["Skinny", "Straight", "Wide-Leg", "Baggy", "Bootcut", "Flare"],
  "Shoes":    ["Sneakers", "Boots", "Heels", "Loafers", "Sandals", "Flats"],
  "Jacket":   ["Denim", "Leather", "Bomber", "Trench", "Puffer", "Blazer"],
  "Dress":    ["Mini", "Midi", "Maxi", "Wrap", "Slip", "Bodycon"],
  "Shorts":   ["Denim", "Athletic", "Cargo", "Tailored", "Bermuda", "Mini"],
  "Accessories": ["Bag", "Belt", "Hat", "Sunglasses", "Jewellery", "Watch"],
  "Others":   [],
};

const COLORS = [
  { name: "Black",  hex: "#111111" },
  { name: "White",  hex: "#F5F5F5" },
  { name: "Red",    hex: "#E53E3E" },
  { name: "Blue",   hex: "#3182CE" },
  { name: "Green",  hex: "#38A169" },
  { name: "Beige",  hex: "#D4B896" },
  { name: "Brown",  hex: "#7B5B3A" },
  { name: "Pink",   hex: "#ED64A6" },
  { name: "Yellow", hex: "#ECC94B" },
  { name: "Grey",   hex: "#718096" },
  { name: "Navy",   hex: "#1A365D" },
  { name: "Olive",  hex: "#6B7A2D" },
];

const ADV_CATEGORIES = [
  "All", "Casual", "Work / Office", "Date Night",
  "Streetwear", "Formal", "Activewear", "Bohemian", "Vacation", "Loungewear",
];

// Live brands used instead of DUMMY_BRANDS


// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Data Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬



// Live posts used instead of DUMMY_POSTS


type FeedTab = "trending" | "products";
type ViewMode = "grid" | "list";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Notification helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function pushNotification(notif: {
  id: string; type: string; message: string; postOwner: string; time: string; read: boolean;
}) {
  try {
    const prev = JSON.parse(localStorage.getItem("styly_notifications") || "[]");
    localStorage.setItem("styly_notifications", JSON.stringify([notif, ...prev].slice(0, 50)));
  } catch { /* ignore */ }
}

/** Renders a caption string, turning @mentions into orange clickable spans */
function renderCaption(
  caption: string,
  liveBrands: Array<{ id: number; name: string }>,
  onBrandClick: (brand: { id: number; name: string }) => void
): React.ReactNode {
  const parts = caption.split(/(@[\w]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const slug = part.slice(1).toLowerCase();
      const matched = liveBrands.find(
        b => b.name.toLowerCase().replace(/\s+/g, "") === slug ||
             b.name.toLowerCase() === slug
      );
      return (
        <button
          key={i}
          type="button"
          onClick={() => matched && onBrandClick(matched)}
          className={`font-bold transition-colors ${
            matched
              ? "text-primary hover:text-primary/80 cursor-pointer"
              : "text-primary/70"
          }`}
        >
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Brand profile mini-modal that opens when user taps an @brand tag */
function BrandProfileModal({
  brand,
  posts,
  onClose,
  onFollow,
}: {
  brand: { id: number; name: string };
  posts: Post[];
  onClose: () => void;
  onFollow: () => void;
}) {
  const brandPosts = posts
    .filter(p => p.taggedProduct?.brandId === brand.id || p.creator.isBrand)
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#131313] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative h-20 bg-gradient-to-br from-primary/20 to-primary/5 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="px-5 pb-2 -mt-8 shrink-0">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border-2 border-background flex items-center justify-center shadow-lg mb-2">
            <span className="text-xl font-black text-primary">{brand.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-extrabold text-base text-foreground">{brand.name}</h2>
              <p className="text-xs text-muted-foreground">@{brand.name.replace(/\s+/g, "").toLowerCase()} · Brand</p>
            </div>
            <button
              onClick={() => { onFollow(); onClose(); }}
              className="h-9 px-4 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
            >
              Follow Brand
            </button>
          </div>
        </div>
        {/* Posts grid */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Latest from {brand.name}</p>
          {brandPosts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground">No posts yet from this brand.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {brandPosts.map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={p.image} alt={p.caption} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PostComposer Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface ComposerItem {
  brand: string;
  brandId?: number;
  type: string;
  price: string;
  colors: string[];
  subtype: string;
  customType: string;
}

interface AdvTargeting {
  categories: string[];
  colors: string[];
}

function PostComposerModal({
  onClose,
  onPost,
  liveBrands,
}: {
  onClose: () => void;
  onPost: (post: { title: string; caption: string; imagePreview: string; mediaType: "image" | "video"; items: ComposerItem[]; targeting: AdvTargeting; category: string }) => void;
  liveBrands: Array<{ id: number; name: string }>;
}) {
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // @ Brand mention autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedMentionBrand, setSelectedMentionBrand] = useState<{ id: number; name: string } | null>(null);

  // Add Item flow
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [addedItems, setAddedItems] = useState<ComposerItem[]>([]);
  const [itemInfoIdx, setItemInfoIdx] = useState<number | null>(null);

  // Targeting
  const mannequinName = typeof window !== "undefined"
    ? (localStorage.getItem("mannequin_nickname") || null)
    : null;
  const [showAdvTargeting, setShowAdvTargeting] = useState(false);
  const [advTargeting, setAdvTargeting] = useState<AdvTargeting>({ categories: [], colors: [] });

  // Detect @ in caption to show brand mention autocomplete
  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCaption(val);
    const match = val.match(/@([a-zA-Z0-9]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const filteredMentionBrands = mentionQuery !== null
    ? liveBrands.filter(b => b.name.toLowerCase().replace(/\s+/g, "").includes(mentionQuery))
    : [];

  const filteredBrands = liveBrands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const exactMatch = liveBrands.some(b =>
    b.name.toLowerCase().trim() === brandSearch.toLowerCase().trim()
  );

  const handleSelectMentionBrand = (brand: { id: number; name: string }) => {
    const newCaption = caption.replace(/@([a-zA-Z0-9]*)$/, `@${brand.name.replace(/\s+/g, "")} `);
    setCaption(newCaption);
    setSelectedMentionBrand(brand);
    setMentionQuery(null);
    setTimeout(() => captionRef.current?.focus(), 50);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");
    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddBrand = (brand: string, brandId?: number) => {
    setSelectedBrand(brand);
    setSelectedBrandId(brandId || null);
    setShowBrandDropdown(false);
    setShowTypeDropdown(true);
  };

  const handleAddType = (type: string) => {
    setSelectedType(type);
    setShowTypeDropdown(false);
    const item: ComposerItem = { brand: selectedBrand, brandId: selectedBrandId || undefined, type, price: "", colors: [], subtype: "", customType: "" };
    setAddedItems(prev => [...prev, item]);
    setSelectedBrand("");
    setSelectedBrandId(null);
    setSelectedType("");
  };

  const handleRemoveItem = (idx: number) => {
    setAddedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemInfoChange = (idx: number, field: keyof ComposerItem, value: any) => {
    setAddedItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const toggleAdvColor = (color: string) => {
    setAdvTargeting(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color],
    }));
  };

  const toggleAdvCategory = (cat: string) => {
    setAdvTargeting(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handlePost = async () => {
    if (!mediaPreview && !caption.trim()) {
      toast.error("Add a photo/video or caption to post.");
      return;
    }
    
    let uploadedUrl = "/product_dress_1.png";
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", selectedFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url || mediaPreview || "/product_dress_1.png";
        } else {
          uploadedUrl = mediaPreview || "/product_dress_1.png";
        }
      } catch {
        uploadedUrl = mediaPreview || "/product_dress_1.png";
      } finally {
        setIsUploading(false);
      }
    } else if (mediaPreview) {
      uploadedUrl = mediaPreview;
    }

    // Determine category from advanced targeting or default
    const category = advTargeting.categories[0] || "Casual";
    onPost({ title, caption, imagePreview: uploadedUrl, mediaType, items: addedItems, targeting: advTargeting, category });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#131313] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-fade-up">

        {/* Handle / Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shadow-sm">
              <Shirt className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm leading-tight">New Outfit Post</h2>
              <p className="text-[9px] text-muted-foreground">Share your look with the community</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Photo Upload Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full aspect-[4/3] sm:aspect-[16/7] rounded-2xl border-2 border-dashed border-border/40 bg-muted/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transit-all flex items-center justify-center overflow-hidden group"
          >
            {mediaPreview ? (
              <>
                {mediaType === "video" ? (
                  <video src={mediaPreview} controls muted className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transit-all rounded-2xl">
                  <p className="text-white text-xs font-bold">Change File</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-14 w-14 rounded-2xl bg-muted border border-border/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transit-all">
                  <ImagePlus className="h-6 w-6 group-hover:text-primary transit-all" />
                </div>
                <p className="text-xs font-semibold">Tap to add photo or video</p>
                <p className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP or MP4</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMedia} />
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Caption Inputs Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Share your outfit with a stylized title"
              className="w-full h-10 px-4 rounded-xl bg-muted border border-border/30 text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
            />
            <div className="relative">
              <textarea
                ref={captionRef}
                value={caption}
                onChange={handleCaptionChange}
                rows={2}
                placeholder="Describe your outfit, occasion, brands... (use @BrandName to tag)"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border/30 text-sm placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
              />
              {/* @ mention autocomplete dropdown */}
              {mentionQuery !== null && filteredMentionBrands.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 w-full bg-white dark:bg-[#1A1A1A] border border-border/50 rounded-2xl shadow-xl p-1.5 z-50 max-h-40 overflow-y-auto no-scrollbar">
                  {filteredMentionBrands.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); handleSelectMentionBrand(b); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-primary/5 text-left transition-colors"
                    >
                      <span className="text-primary font-bold text-sm">@</span>
                      <span className="text-xs font-semibold text-foreground">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Add Item Section Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div className="space-y-3">
            {/* Added item chips */}
            {addedItems.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.brand}</p>
                    <p className="text-[10px] text-muted-foreground">{item.type}{item.subtype ? ` · ${item.subtype}` : ""}{item.price ? ` · ${item.price} TND` : ""}</p>
                  </div>
                  <button
                    onClick={() => setItemInfoIdx(idx)}
                    className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transit-all shrink-0"
                  >
                    {item.price ? "Edit info" : "Enter item info"}
                  </button>
                  <button onClick={() => handleRemoveItem(idx)} className="h-6 w-6 rounded-full hover:bg-red-500/10 flex items-center justify-center transit-all shrink-0">
                    <X className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Item Button */}
            <div className="relative">
              <button
                onClick={() => { setShowBrandDropdown(v => !v); setShowTypeDropdown(false); }}
                className="w-full h-11 rounded-xl border border-border/50 bg-muted/70 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-2 text-sm font-semibold text-foreground/80 transit-all"
              >
                <Plus className="h-4 w-4" />
                Add item
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transit-all ${showBrandDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Brand Dropdown — uses live DB brands with search and unregistered fallback */}
              {showBrandDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#1E1E1E] border border-border/40 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-up">
                  <div className="p-2 border-b border-border/20">
                    <input
                      type="text"
                      placeholder="Search or type unregistered brand..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full h-8 px-3 rounded-lg bg-muted text-xs focus:outline-none border border-border/30"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                    {filteredBrands.length === 0 && !brandSearch.trim() ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground italic">No approved brands yet</p>
                    ) : (
                      filteredBrands.map(brand => (
                        <button
                          key={brand.id}
                          onClick={() => {
                            handleAddBrand(brand.name, brand.id);
                            setBrandSearch("");
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-primary/8 hover:text-primary transit-all flex items-center gap-2.5"
                        >
                          <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary/30 to-orange-400/30 flex items-center justify-center text-[8px] font-black text-primary shrink-0">
                            {brand.name[0]}
                          </div>
                          {brand.name}
                        </button>
                      ))
                    )}
                    {brandSearch.trim() && !exactMatch && (
                      <button
                        onClick={() => {
                          handleAddBrand(brandSearch.trim()); // brandId will be undefined
                          setBrandSearch("");
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/10 border-t border-border/10 transit-all flex items-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tag unregistered brand: "{brandSearch.trim()}"
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Type Dropdown */}
              {showTypeDropdown && selectedBrand && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#1E1E1E] border border-border/40 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-up">
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="text-primary font-black">{selectedBrand}</span> · Choose product type
                  </p>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {PRODUCT_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => handleAddType(type)}
                        className="text-left px-3 py-2 text-xs font-semibold hover:bg-primary/8 hover:text-primary rounded-xl transit-all flex items-center gap-1.5"
                      >
                        <Shirt className="h-3 w-3 text-muted-foreground" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Targeting Section Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div className="rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-bold">Targeting</p>
              <Info className="h-3 w-3 text-muted-foreground/60 ml-0.5" />
              <p className="text-[10px] text-muted-foreground ml-0.5">Important for accurate sales</p>
            </div>

            {/* Body Size row */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 hover:bg-accent/30 cursor-pointer transit-all">
              <div className="flex items-center gap-2">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">Body Size</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {mannequinName ? mannequinName : "You don't have a Model"}
                </span>
                <div className="flex flex-col gap-0 text-muted-foreground">
                  <svg width="8" height="5" viewBox="0 0 8 5"><path d="M4 0L8 5H0L4 0Z" fill="currentColor" /></svg>
                  <svg width="8" height="5" viewBox="0 0 8 5"><path d="M4 5L0 0H8L4 5Z" fill="currentColor" /></svg>
                </div>
              </div>
            </div>

            {/* Advanced Targeting */}
            <button
              onClick={() => setShowAdvTargeting(true)}
              className="w-full flex items-center justify-between px-4 py-3 border-t border-border/20 hover:bg-accent/30 transit-all"
            >
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">Advanced targeting</span>
                {(advTargeting.categories.length > 0 || advTargeting.colors.length > 0) && (
                  <span className="bg-primary text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {advTargeting.categories.length + advTargeting.colors.length}
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Post Button Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-border/15">
          <button
            onClick={handlePost}
            disabled={isUploading}
            className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-orange-400 text-white font-extrabold text-sm hover:opacity-95 hover:scale-[1.01] transit-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Post"}
          </button>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Item Info Sub-Modal Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {itemInfoIdx !== null && addedItems[itemInfoIdx] && (
        <div className="absolute inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setItemInfoIdx(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
              <div>
                <h3 className="font-bold text-sm">Item Info</h3>
                <p className="text-[10px] text-muted-foreground">{addedItems[itemInfoIdx].brand} Ã‚Â· {addedItems[itemInfoIdx].type}</p>
              </div>
              <button onClick={() => setItemInfoIdx(null)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Price */}
              <div>
                <label className="text-xs font-bold mb-1.5 block">Price (TND)</label>
                <input
                  type="number"
                  placeholder="e.g. 89"
                  value={addedItems[itemInfoIdx].price}
                  onChange={e => handleItemInfoChange(itemInfoIdx, "price", e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-muted border border-border/30 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                />
              </div>

              {/* Subtype */}
              {addedItems[itemInfoIdx].type !== "Others" && SUBTYPES[addedItems[itemInfoIdx].type]?.length > 0 && (
                <div>
                  <label className="text-xs font-bold mb-1.5 block">Style / Fit Type</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBTYPES[addedItems[itemInfoIdx].type].map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleItemInfoChange(itemInfoIdx, "subtype", sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transit-all ${
                          addedItems[itemInfoIdx].subtype === sub
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                            : "bg-muted border-border/30 hover:border-primary/40 text-foreground/80"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Others Ã¢â‚¬â€ custom type input */}
              {addedItems[itemInfoIdx].type === "Others" && (
                <div>
                  <label className="text-xs font-bold mb-1.5 block">Item Type (describe)</label>
                  <input
                    type="text"
                    placeholder="e.g. Corset, Kimono..."
                    value={addedItems[itemInfoIdx].customType}
                    onChange={e => handleItemInfoChange(itemInfoIdx, "customType", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
                  />
                </div>
              )}

              {/* Colors */}
              <div>
                <label className="text-xs font-bold mb-2 block">Colors</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => {
                    const selected = addedItems[itemInfoIdx].colors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        title={color.name}
                        onClick={() => {
                          const cur = addedItems[itemInfoIdx].colors;
                          handleItemInfoChange(
                            itemInfoIdx,
                            "colors",
                            selected ? cur.filter(c => c !== color.name) : [...cur, color.name]
                          );
                        }}
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transit-all ${
                          selected ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-border/60"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
                {addedItems[itemInfoIdx].colors.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">{addedItems[itemInfoIdx].colors.join(", ")}</p>
                )}
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setItemInfoIdx(null)}
                className="w-full h-11 rounded-full bg-gradient-to-r from-primary to-orange-400 text-white font-bold text-sm hover:opacity-95 transit-all shadow-lg shadow-primary/20"
              >
                Save Item Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ã¢â€ â‚¬Ã¢â€ â‚¬ Advanced Targeting Modal Ã¢â€ â‚¬Ã¢â€ â‚¬ */}
      {showAdvTargeting && (
        <div className="absolute inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdvTargeting(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
              <div>
                <h3 className="font-bold text-sm">Advanced Targeting</h3>
                <p className="text-[10px] text-muted-foreground">Reach the right audience for accurate sales</p>
              </div>
              <button onClick={() => setShowAdvTargeting(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transit-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto no-scrollbar">
              {/* Category */}
              <div>
                <label className="text-xs font-bold mb-2 block flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" /> Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {ADV_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleAdvCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transit-all ${
                        advTargeting.categories.includes(cat)
                          ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                          : "bg-muted border-border/30 hover:border-primary/40 text-foreground/80"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-xs font-bold mb-2 block flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-primary" /> Colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => {
                    const selected = advTargeting.colors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        title={color.name}
                        onClick={() => toggleAdvColor(color.name)}
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transit-all ${
                          selected ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-border/60"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setShowAdvTargeting(false)}
                className="w-full h-11 rounded-full bg-gradient-to-r from-primary to-orange-400 text-white font-bold text-sm hover:opacity-95 transit-all shadow-lg shadow-primary/20"
              >
                Apply Targeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ HomeFeed Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function HomeFeed() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { addToBag } = useAppShell();

  // Load from database query
  const { data: dbPosts = [], isLoading: isPostsLoading } = trpc.posts.list.useQuery();
  // Load live brands for @mention autocomplete and brand tag display
  const { data: liveBrandsData = [] } = trpc.brands.list.useQuery();
  const liveBrands: Array<{ id: number; name: string }> = (liveBrandsData as any[]).map((b: any) => ({ id: b.id, name: b.name }));
  const utils = trpc.useUtils();
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      utils.posts.list.invalidate();
    }
  });

  // Sync DB posts to local state — no DUMMY fallback, always live data
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const likedStr = localStorage.getItem("styly_liked_posts");
    const likedIds = likedStr ? JSON.parse(likedStr) : [];
    const mapped = (dbPosts || []).map((p: any) => ({
      id: p.id,
      brandId: p.brandId || null,
      unregisteredBrand: p.unregisteredBrand || null,
      approvalStatus: p.approvalStatus || "pending",
      creator: p.creator || {
        name: "Styly User",
        username: "@user",
        avatar: "/logo.png",
        isBrand: false,
        verified: false,
      },
      image: p.image || p.imageUrl || "",
      caption: p.caption || "",
      likes: p.likes || 0,
      comments: p.comments || 0,
      taggedProduct: p.taggedProduct || null,
      category: p.category || "Casual",
      hotspots: p.hotspots || null,
      mediaType: p.mediaType || "image",
      hasLiked: likedIds.includes(p.id),
    }));
    setPosts(mapped as any);
  }, [dbPosts]);

  const [feedTab, setFeedTab] = useState<FeedTab>("trending");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // ── Filter state (full modal) ──
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterItemTypes, setFilterItemTypes]   = useState<string[]>([]);
  const [filterAesthetics, setFilterAesthetics] = useState<string[]>([]);
  const [filterGender, setFilterGender]         = useState<string>("All");
  const [filterPriceMin, setFilterPriceMin]     = useState(0);
  const [filterPriceMax, setFilterPriceMax]     = useState(2000);
  const [filterColors, setFilterColors]         = useState<string[]>([]);
  const [filterFollowing, setFilterFollowing]   = useState(false);
  const [filterVerified, setFilterVerified]     = useState(false);
  // draft (only applied on Done)
  const [draftCategories, setDraftCategories]   = useState<string[]>([]);
  const [draftItemTypes, setDraftItemTypes]     = useState<string[]>([]);
  const [draftAesthetics, setDraftAesthetics]   = useState<string[]>([]);
  const [draftGender, setDraftGender]           = useState<string>("All");
  const [draftPriceMin, setDraftPriceMin]       = useState(0);
  const [draftPriceMax, setDraftPriceMax]       = useState(2000);
  const [draftColors, setDraftColors]           = useState<string[]>([]);

  const FILTER_CATEGORIES  = ["Casual", "Work / Office", "Date Night", "Party", "Vacation / Travel", "Sporty / Activewear", "Streetwear", "Seasonal"];
  const FILTER_ITEM_TYPES  = ["Tops", "Bottoms", "Accessories", "Dresses & Jumpsuits", "Outerwear", "Shoes", "Loungewear & Intimates"];
  const FILTER_AESTHETICS  = ["Old Money", "Sporty Chic", "Hippie", "Baggy", "Minimalist", "Edgy / Grunge", "Boho"];
  const FILTER_COLORS_LIST = [
    { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" }, { name: "Red", hex: "#EF4444" },
    { name: "Green", hex: "#22C55E" }, { name: "Blue", hex: "#3B82F6" }, { name: "Yellow", hex: "#EAB308" },
    { name: "Orange", hex: "#F97316" }, { name: "Purple", hex: "#7C3AED" }, { name: "Pink", hex: "#F9A8D4" },
    { name: "Brown", hex: "#92400E" }, { name: "Gray", hex: "#9CA3AF" }, { name: "Cyan", hex: "#06B6D4" },
    { name: "Magenta", hex: "#EC4899" }, { name: "Lime", hex: "#84CC16" }, { name: "Navy", hex: "#1E3A5F" },
  ];

  const openFilterModal = () => {
    setDraftCategories(filterCategories);
    setDraftItemTypes(filterItemTypes);
    setDraftAesthetics(filterAesthetics);
    setDraftGender(filterGender);
    setDraftPriceMin(filterPriceMin);
    setDraftPriceMax(filterPriceMax);
    setDraftColors(filterColors);
    setShowFilterPanel(true);
  };

  const applyFilters = () => {
    setFilterCategories(draftCategories);
    setFilterItemTypes(draftItemTypes);
    setFilterAesthetics(draftAesthetics);
    setFilterGender(draftGender);
    setFilterPriceMin(draftPriceMin);
    setFilterPriceMax(draftPriceMax);
    setFilterColors(draftColors);
    setShowFilterPanel(false);
  };

  const clearAllFilters = () => {
    setDraftCategories([]); setDraftItemTypes([]); setDraftAesthetics([]);
    setDraftGender("All"); setDraftPriceMin(0); setDraftPriceMax(2000); setDraftColors([]);
  };

  const totalActiveFilters = filterCategories.length + filterItemTypes.length + filterAesthetics.length
    + filterColors.length + (filterGender !== "All" ? 1 : 0)
    + (filterPriceMin > 0 || filterPriceMax < 2000 ? 1 : 0)
    + (filterFollowing ? 1 : 0) + (filterVerified ? 1 : 0);


  // Virtual Fitting Room
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [tryOnSize, setTryOnSize] = useState("M");
  const [layeredItems, setLayeredItems] = useState<{ product: Product; size: string }[]>([]);
  const [activeFitTab, setActiveFitTab] = useState<"mannequin" | "advice">("mannequin");

  // Post Composer
  const [showComposer, setShowComposer] = useState(false);
  // Brand profile modal opened via @mention tap
  const [brandProfileModal, setBrandProfileModal] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const handler = () => setShowComposer(true);
    window.addEventListener("styly:open-composer", handler);
    if (window.location.search.includes("action=create-post")) {
      setShowComposer(true);
    }
    return () => window.removeEventListener("styly:open-composer", handler);
  }, []);

  const filteredPosts = posts.filter((p) => {
    // Category filter (from full modal)
    if (filterCategories.length > 0 && (!p.category || !filterCategories.includes(p.category))) return false;
    // Legacy selectedCategory chip (kept for body-shape filtering)
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    return true;
  });


  const handleLike = (id: number) => {
    setPosts((prev) => {
      const post = prev.find(p => p.id === id);
      const nextLiked = post ? !post.hasLiked : false;

      // Push notification when liking someone else's post
      if (nextLiked && post) {
        pushNotification({
          id: `like_${id}_${Date.now()}`,
          type: "like",
          message: `You liked ${post.creator.name}'s post Ã¢ÂÂ¤Ã¯Â¸Â`,
          postOwner: post.creator.username,
          time: new Date().toISOString(),
          read: false,
        });
      }

      const updated = prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            hasLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      });

      // Save to localStorage
      try {
        const likedIds = updated.filter(p => p.hasLiked).map(p => p.id);
        localStorage.setItem("styly_liked_posts", JSON.stringify(likedIds));
        // Update notification badge count
        const prevNotifs = JSON.parse(localStorage.getItem("styly_notifications") || "[]");
        const unread = prevNotifs.filter((n: any) => !n.read).length;
        window.dispatchEvent(new CustomEvent("styly_notif_update", { detail: { count: unread } }));
      } catch (e) {
        console.error(e);
      }

      return updated;
    });
  };

  const handleTryOn = (product: Product) => {
    setLayeredItems(prev => {
      // Avoid duplicates; max 4 items
      if (prev.some(i => i.product.id === product.id) || prev.length >= 4) return prev;
      return [...prev, { product, size: "M" }];
    });
    setTryOnProduct(product);
    setShowTryOn(true);
  };

  const handleNewPost = (postData: {
    title: string;
    caption: string;
    imagePreview: string;
    mediaType: "image" | "video";
    items: ComposerItem[];
    targeting: AdvTargeting;
    category: string;
  }) => {
    const newPost: Post = {
      id: Date.now(),
      creator: {
        name: "You",
        username: "@you",
        avatar: "/logo.png",
        isBrand: false,
        verified: false,
      },
      image: postData.imagePreview,
      mediaType: postData.mediaType,
      caption: [postData.title, postData.caption].filter(Boolean).join(" Ã¢â‚¬â€ "),
      likes: 0,
      comments: 0,
      taggedProduct: postData.items[0]
        ? {
            id: Date.now(),
            name: `${postData.items[0].brand} ${postData.items[0].type}`,
            price: parseFloat(postData.items[0].price) || 0,
            image: postData.imagePreview,
          }
        : { id: 0, name: "Outfit", price: 0, image: postData.imagePreview },
      category: postData.category,
      hasLiked: false,
    };

    setPosts(prev => [newPost, ...prev]);
    setShowComposer(false);

    // Call backend to persist
    createPostMutation.mutate({
      imageUrl: postData.imagePreview,
      caption: [postData.title, postData.caption].filter(Boolean).join(" — "),
      category: postData.category,
      mediaType: postData.mediaType,
      taggedProduct: postData.items[0]
        ? {
            id: Date.now(),
            name: `${postData.items[0].brand} ${postData.items[0].type}`,
            price: parseFloat(postData.items[0].price) || 0,
            image: postData.imagePreview,
          }
        : { id: 0, name: "Outfit", price: 0, image: postData.imagePreview }
    });

    toast.success("Your post is live! 🎉");
    setShowComposer(false);
    toast.success("Your post is live! Ã°Å¸Å½â€°");
  };

  return (
    <AppShell activePath="/feed" showRightPanel>
      <div className="pb-20 lg:pb-6 relative">

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Feed Header: tabs + view toggle Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#0F0F0F]/80 glassmorphic border-b border-border/30 px-4 lg:px-6">
          <div className="flex items-center justify-between py-3 max-w-3xl mx-auto">
            {/* Trending / Products tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {(["trending", "products"] as FeedTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFeedTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transit-all flex items-center gap-1.5 ${
                    feedTab === tab
                      ? "bg-white dark:bg-[#1A1A1A] text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "trending" ? <Flame className="h-3 w-3 text-orange-500" /> : <Package className="h-3 w-3" />}
                  {tab === "trending" ? "Trending" : "Products"}
                </button>
              ))}
            </div>

            {/* Right: filter icon + view toggle */}
            <div className="flex items-center gap-2">
              {/* Filter button */}
              <button
                id="feed-filter-btn"
                onClick={openFilterModal}
                className={`h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold border transit-all ${
                  totalActiveFilters > 0
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-muted border-border/30 text-foreground/80 hover:border-primary/40"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter{totalActiveFilters > 0 ? ` (${totalActiveFilters})` : ""}
              </button>

              <div className="flex items-center gap-0.5 bg-muted rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`h-7 w-7 rounded-lg flex items-center justify-center transit-all ${viewMode === "grid" ? "bg-white dark:bg-[#1A1A1A] shadow-sm text-primary" : "text-muted-foreground"}`}
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`h-7 w-7 rounded-lg flex items-center justify-center transit-all ${viewMode === "list" ? "bg-white dark:bg-[#1A1A1A] shadow-sm text-primary" : "text-muted-foreground"}`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Chips Row ── */}
        <div className="px-4 lg:px-6 pt-3 pb-1 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {/* Sliders icon */}
            <button onClick={openFilterModal} className="flex-shrink-0 h-8 w-8 rounded-full bg-muted border border-border/30 flex items-center justify-center hover:border-primary/40 transit-all">
              <SlidersHorizontal className="h-3.5 w-3.5 text-foreground/70" />
            </button>
            {/* Category chip */}
            <button onClick={openFilterModal} className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border flex items-center gap-1 transit-all ${filterCategories.length > 0 ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 hover:border-primary/40"}`}>
              Category <ChevronDown className="h-3 w-3" />
            </button>
            {/* Gender chip */}
            <button onClick={openFilterModal} className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border flex items-center gap-1 transit-all ${filterGender !== "All" ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 hover:border-primary/40"}`}>
              Gender <ChevronDown className="h-3 w-3" />
            </button>
            {/* Price chip */}
            <button onClick={openFilterModal} className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border flex items-center gap-1 transit-all ${(filterPriceMin > 0 || filterPriceMax < 2000) ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 hover:border-primary/40"}`}>
              Price <ChevronDown className="h-3 w-3" />
            </button>
            {/* Color chip */}
            <button onClick={openFilterModal} className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border flex items-center gap-1 transit-all ${filterColors.length > 0 ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 hover:border-primary/40"}`}>
              Color <ChevronDown className="h-3 w-3" />
            </button>
            {/* Following chip */}
            <button onClick={() => setFilterFollowing(v => !v)} className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transit-all ${filterFollowing ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 hover:border-primary/40"}`}>
              Following
            </button>
            {/* Verified Styler chip */}
            <button onClick={() => setFilterVerified(v => !v)} className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transit-all ${filterVerified ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 hover:border-primary/40"}`}>
              Verified Styler
            </button>
          </div>
        </div>

        {/* ── Feed Body ── */}
        <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-border/30 bg-white dark:bg-[#1A1A1A]">
              <p className="text-sm text-muted-foreground">No posts found for this filter.</p>
            </div>
          ) : viewMode === "list" ? (
            /* ── List View ── */
            <div className="space-y-5 max-w-md mx-auto lg:max-w-none">
              {filteredPosts.map((post, i) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden transit-all hover:scale-[1.005] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/15 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <PostHeader post={post} onFollow={() => toast.success(`Following ${post.creator.name}`)} />
                  <div className="aspect-[4/5] bg-muted overflow-hidden relative">
                    <ImageWithHotspots
                      image={post.image}
                      mediaType={post.mediaType}
                      caption={post.caption}
                      hotspotsJson={post.hotspots}
                      taggedProduct={post.taggedProduct}
                      onTryOn={() => handleTryOn(post.taggedProduct)}
                      onAddToBag={() => addToBag({ ...post.taggedProduct, size: "M" })}
                    />
                  </div>
                  <PostActions post={post} onLike={() => handleLike(post.id)} onTryOn={() => handleTryOn(post.taggedProduct)} onAddToBag={() => addToBag({ ...post.taggedProduct, size: "M" })} liveBrands={liveBrands} onBrandClick={b => setBrandProfileModal(b)} />
                </article>
              ))}
            </div>
          ) : (
            /* Ã¢â€ â‚¬Ã¢â€ â‚¬ Grid View (3-col) Ã¢â€ â‚¬Ã¢â€ â‚¬ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post, i) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden flex flex-col transit-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/15 animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <PostHeader post={post} compact onFollow={() => toast.success(`Following ${post.creator.name}`)} />
                  <div className="aspect-[4/5] bg-muted overflow-hidden relative">
                    <ImageWithHotspots
                      image={post.image}
                      mediaType={post.mediaType}
                      caption={post.caption}
                      hotspotsJson={post.hotspots}
                      taggedProduct={post.taggedProduct}
                      onTryOn={() => handleTryOn(post.taggedProduct)}
                      onAddToBag={() => addToBag({ ...post.taggedProduct, size: "M" })}
                    />
                  </div>
                  <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] leading-snug text-foreground/80 line-clamp-2">
                      <span className="font-bold mr-1">{post.creator.name}</span>
                      {renderCaption(post.caption, liveBrands, b => setBrandProfileModal(b))}
                    </p>
                    {/* Tag and Try row */}
                    {localStorage.getItem(`styly_user_lock_${post.creator.name}`) === "black" ? (
                      <div className="p-2 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> Unapproved Tag
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
                            <img src={post.taggedProduct.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[10px] truncate leading-snug">{post.taggedProduct.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-primary font-black text-[11px]">{post.taggedProduct.price} TND</span>
                              <span className="text-[9px] font-bold text-amber-500">★ 4.8</span>
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">In Stock</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addToBag({ ...post.taggedProduct, size: "M" })}
                          className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 text-white shadow-md shadow-orange-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transit-all shrink-0"
                          title="Add to Bag"
                        >
                          <Shirt className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                    {/* Like row */}
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 text-[10px] font-medium transit-all hover:text-primary">
                        <Heart className={`h-3.5 w-3.5 ${post.hasLiked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        <span className={post.hasLiked ? "text-primary font-bold" : "text-foreground/70"}>{post.likes.toLocaleString()}</span>
                      </button>
                      <button onClick={() => toast.success("Link copied!")} className="text-muted-foreground hover:text-foreground text-[10px]">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Post Composer Modal ── */}
      {showComposer && (
        <PostComposerModal
          onClose={() => setShowComposer(false)}
          onPost={handleNewPost}
          liveBrands={liveBrands}
        />
      )}

      {/* ── Brand Profile Modal (opened via @mention tap) ── */}
      {brandProfileModal && (
        <BrandProfileModal
          brand={brandProfileModal}
          posts={posts}
          onClose={() => setBrandProfileModal(null)}
          onFollow={() => {
            toast.success(`You are now following ${brandProfileModal.name}!`);
          }}
        />
      )}

      {/* Ã¢â€ â‚¬Ã¢â€ â‚¬ Try-On Experience Modal Ã¢â€ â‚¬Ã¢â€ â‚¬ */}
      {showTryOn && (() => {
        const gender = localStorage.getItem("mannequin_gender") || "woman";
        const height = parseFloat(localStorage.getItem("mannequin_height") || "172");
        const weight = parseFloat(localStorage.getItem("mannequin_weight") || "62");
        const belly = localStorage.getItem("mannequin_belly") || "average";
        const chest = localStorage.getItem("mannequin_chest") || "average";
        const name = localStorage.getItem("mannequin_nickname") || "My Mannequin";

        const itemCount = layeredItems.length;
        const baseScore = 95;
        const penaltyPerItem = itemCount > 1 ? (itemCount - 1) * 3 : 0;
        const sizePenalty = layeredItems.some(i => i.size === "XS" || i.size === "XL") ? 6 : 0;
        const fitScore = Math.max(60, baseScore - penaltyPerItem - sizePenalty);

        const adviceLines: string[] = [];
        if (itemCount === 0) adviceLines.push("Tap Ã¢Å“Â¦ Try on any post to add items to your fitting room.");
        if (itemCount >= 1) adviceLines.push(`Ã¢Å“â€œ ${itemCount} item${itemCount > 1 ? 's' : ''} layered Ã¢â‚¬â€  your mannequin looks ${fitScore >= 90 ? 'flawless' : fitScore >= 75 ? 'great' : 'decent'}.`);
        if (belly === "fuller") adviceLines.push("Tip: Go up one size for comfort around your waist.");
        if (chest === "fuller") adviceLines.push("Tip: A structured blazer will balance your silhouette.");
        if (weight > 75 && layeredItems.some(i => i.size === "S")) adviceLines.push("Ã¢Å¡Â Ã¯Â¸Â  Size S may feel tight Ã¢â‚¬â€  M recommended for your profile.");
        if (itemCount > 2) adviceLines.push("Style note: Bold layering detected. Keep accessories minimal.");

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTryOn(false)} />
            <div className="relative bg-white dark:bg-[#141414] rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-up">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shadow-md shadow-primary/30">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Virtual Fitting Room</h3>
                    <p className="text-[9px] text-muted-foreground">{name} Ã‚Â· {gender === "woman" ? "Female" : "Male"} Ã‚Â· {height}cm</p>
                  </div>
                </div>
                <button onClick={() => setShowTryOn(false)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-5 pt-3 gap-2">
                {(["mannequin", "advice"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFitTab(tab)}
                    className={`flex-1 h-8 rounded-xl text-[11px] font-bold capitalize transition-all ${
                      activeFitTab === tab ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {tab === "mannequin" ? "Ã°Å¸â€˜â€” Try On" : "Ã°Å¸â€™Â¡ Fit Advice"}
                  </button>
                ))}
              </div>

              {activeFitTab === "mannequin" ? (
                <div className="p-4 space-y-3">
                  {/* Mannequin + Layers side by side */}
                  <div className="relative w-full aspect-[3/5] rounded-2xl bg-[#F0F0F0] dark:bg-[#111] overflow-hidden border border-border/20">
                    <img
                      src={gender === "woman" ? "/mannequin_female.png" : "/mannequin_male.png"}
                      alt="Mannequin"
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Layer each item as overlay */}
                    {layeredItems.map((li, idx) => (
                      <img
                        key={li.product.id}
                        src={li.product.image}
                        alt={li.product.name}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        style={{ opacity: 0.35 - idx * 0.05, mixBlendMode: "multiply" }}
                      />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* Fit Score Badge */}
                    <div className={`absolute top-3 right-3 h-10 w-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
                      fitScore >= 90 ? "bg-green-500/90 border-green-300 text-white" :
                      fitScore >= 75 ? "bg-primary/90 border-primary/40 text-white" :
                      "bg-orange-400/90 border-orange-300 text-white"
                    }`}>
                      {fitScore}%
                    </div>
                    <p className="absolute bottom-3 left-3 text-white font-extrabold text-[11px] drop-shadow-md">
                      {itemCount === 0 ? "Add items below" : `${itemCount} item${itemCount > 1 ? 's' : ''} on`}
                    </p>
                  </div>

                  {/* Layered Items Tray */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Outfit Tray ({itemCount}/4)</p>
                    {layeredItems.length === 0 ? (
                      <div className="h-12 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground">Tap Ã¢Å“Â¦ Try on posts to add items here</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {layeredItems.map((li, idx) => (
                          <div key={li.product.id} className="flex items-center gap-1.5 bg-muted/80 rounded-xl px-2 py-1.5 border border-border/30 group">
                            <img src={li.product.image} className="h-7 w-7 rounded-lg object-cover" />
                            <div>
                              <p className="text-[9px] font-bold truncate max-w-[60px]">{li.product.name}</p>
                              {/* Size per item */}
                              <select
                                value={li.size}
                                onChange={e => {
                                  setLayeredItems(prev => prev.map((x, i) => i === idx ? { ...x, size: e.target.value } : x));
                                }}
                                className="text-[8px] font-bold text-primary bg-transparent border-none outline-none cursor-pointer"
                              >
                                {["XS","S","M","L","XL"].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <button
                              onClick={() => setLayeredItems(prev => prev.filter((_, i) => i !== idx))}
                              className="ml-0.5 h-4 w-4 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Advice Tab */
                <div className="p-4 space-y-3">
                  <div className={`p-3.5 rounded-2xl border ${
                    fitScore >= 90 ? "bg-green-500/5 border-green-500/20" :
                    fitScore >= 75 ? "bg-primary/5 border-primary/20" :
                    "bg-orange-400/5 border-orange-400/20"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className={`h-4 w-4 fill-current ${
                        fitScore >= 90 ? "text-green-500" : fitScore >= 75 ? "text-primary" : "text-orange-400"
                      }`} />
                      <p className="text-sm font-extrabold">Fit Score: {fitScore}%</p>
                    </div>
                    <div className="space-y-1.5">
                      {adviceLines.map((line, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground leading-relaxed pl-1">{line}</p>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">Your Profile</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[{label: "Height", val: `${height}cm`}, {label: "Weight", val: `${weight}kg`}, {label: "Belly", val: belly}].map(d => (
                        <div key={d.label} className="bg-background rounded-lg p-1.5">
                          <p className="text-[9px] text-muted-foreground">{d.label}</p>
                          <p className="text-[11px] font-extrabold capitalize">{d.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={() => { setShowTryOn(false); setLocation("/mannequin"); }}
                  className="flex-1 h-11 rounded-full border border-border/50 text-xs font-semibold hover:bg-accent transition-all flex items-center justify-center gap-1.5"
                >
                  <ChevronRight className="h-3.5 w-3.5" /> Adjust Mannequin
                </button>
                <button
                  onClick={() => {
                    layeredItems.forEach(li => addToBag({ ...li.product, size: li.size }));
                    setShowTryOn(false);
                    setLayeredItems([]);
                    toast.success(`${itemCount} item${itemCount > 1 ? 's' : ''} added to bag! Ã°Å¸â€ºÂÃ¯Â¸Â`);
                  }}
                  disabled={layeredItems.length === 0}
                  className="flex-1 h-11 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white text-xs font-bold hover:opacity-95 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Add All to Bag
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── Full Filter Modal (bottom sheet) ── */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterPanel(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300 z-50">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/20 shrink-0">
              <h2 className="text-base font-black text-foreground">Filters</h2>
              <button onClick={() => setShowFilterPanel(false)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transit-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 no-scrollbar">

              {/* ── All Categories section ── */}
              <div className="px-5 py-4 border-b border-border/20">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-foreground">All Categories</span>
                  <button
                    onClick={() => setDraftCategories([])}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transit-all ${
                      draftCategories.length === 0 ? "border-foreground bg-foreground" : "border-border/50"
                    }`}
                  >
                    {draftCategories.length === 0 && <div className="h-2 w-2 rounded-full bg-white" />}
                  </button>
                </div>
                {FILTER_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center justify-between py-3">
                    <span className="text-sm text-foreground/80">{cat}</span>
                    <button
                      onClick={() => setDraftCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                      className={`h-5 w-5 rounded-sm border-2 flex items-center justify-center transit-all ${
                        draftCategories.includes(cat) ? "border-foreground bg-foreground" : "border-border/50"
                      }`}
                    >
                      {draftCategories.includes(cat) && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Item Type section ── */}
              <div className="px-5 py-4 border-b border-border/20">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-foreground">Any item</span>
                  <button
                    onClick={() => setDraftItemTypes([])}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transit-all ${
                      draftItemTypes.length === 0 ? "border-foreground bg-foreground" : "border-border/50"
                    }`}
                  >
                    {draftItemTypes.length === 0 && <div className="h-2 w-2 rounded-full bg-white" />}
                  </button>
                </div>
                {FILTER_ITEM_TYPES.map(type => (
                  <div key={type} className="flex items-center justify-between py-3">
                    <span className="text-sm text-foreground/80">{type}</span>
                    <button
                      onClick={() => setDraftItemTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                      className={`h-5 w-5 rounded-sm border-2 flex items-center justify-center transit-all ${
                        draftItemTypes.includes(type) ? "border-foreground bg-foreground" : "border-border/50"
                      }`}
                    >
                      {draftItemTypes.includes(type) && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Aesthetics section ── */}
              <div className="px-5 py-4 border-b border-border/20">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-foreground">All Aesthetics</span>
                  <button
                    onClick={() => setDraftAesthetics([])}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transit-all ${
                      draftAesthetics.length === 0 ? "border-foreground bg-foreground" : "border-border/50"
                    }`}
                  >
                    {draftAesthetics.length === 0 && <div className="h-2 w-2 rounded-full bg-white" />}
                  </button>
                </div>
                {FILTER_AESTHETICS.map(aes => (
                  <div key={aes} className="flex items-center justify-between py-3">
                    <span className="text-sm text-foreground/80">{aes}</span>
                    <button
                      onClick={() => setDraftAesthetics(prev => prev.includes(aes) ? prev.filter(a => a !== aes) : [...prev, aes])}
                      className={`h-5 w-5 rounded-sm border-2 flex items-center justify-center transit-all ${
                        draftAesthetics.includes(aes) ? "border-foreground bg-foreground" : "border-border/50"
                      }`}
                    >
                      {draftAesthetics.includes(aes) && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Gender section ── */}
              <div className="px-5 py-4 border-b border-border/20">
                <h3 className="text-sm font-black text-foreground mb-3">Gender</h3>
                {["All genders", "Woman", "Man"].map(g => (
                  <div key={g} className="flex items-center justify-between py-3">
                    <span className="text-sm text-foreground/80">{g}</span>
                    <button
                      onClick={() => setDraftGender(g === "All genders" ? "All" : g)}
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transit-all ${
                        draftGender === (g === "All genders" ? "All" : g) ? "border-foreground" : "border-border/50"
                      }`}
                    >
                      {draftGender === (g === "All genders" ? "All" : g) && <div className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Price section ── */}
              <div className="px-5 py-4 border-b border-border/20">
                <h3 className="text-sm font-black text-foreground mb-1">Price</h3>
                <p className="text-sm text-foreground/60 mb-4">{draftPriceMin} – {draftPriceMax} TND</p>
                <div className="relative h-6 flex items-center">
                  <div className="w-full h-1.5 bg-muted rounded-full relative">
                    <div
                      className="absolute h-full rounded-full bg-primary"
                      style={{ left: `${(draftPriceMin / 2000) * 100}%`, right: `${100 - (draftPriceMax / 2000) * 100}%` }}
                    />
                  </div>
                  <input type="range" min={0} max={2000} step={50} value={draftPriceMin}
                    onChange={e => setDraftPriceMin(Math.min(Number(e.target.value), draftPriceMax - 50))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <input type="range" min={0} max={2000} step={50} value={draftPriceMax}
                    onChange={e => setDraftPriceMax(Math.max(Number(e.target.value), draftPriceMin + 50))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {/* Thumb Min */}
                  <div className="absolute h-5 w-5 rounded-full bg-primary shadow-md border-2 border-white pointer-events-none" style={{ left: `calc(${(draftPriceMin / 2000) * 100}% - 10px)` }} />
                  {/* Thumb Max */}
                  <div className="absolute h-5 w-5 rounded-full bg-primary shadow-md border-2 border-white pointer-events-none" style={{ left: `calc(${(draftPriceMax / 2000) * 100}% - 10px)` }} />
                </div>
              </div>

              {/* ── Color section ── */}
              <div className="px-5 py-4">
                <h3 className="text-sm font-black text-foreground mb-3">Color</h3>
                <div className="space-y-1">
                  {FILTER_COLORS_LIST.map(color => (
                    <div key={color.name} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full border border-border/30 shadow-sm" style={{ backgroundColor: color.hex }} />
                        <span className="text-sm text-foreground/80">{color.name}</span>
                      </div>
                      <button
                        onClick={() => setDraftColors(prev => prev.includes(color.name) ? prev.filter(c => c !== color.name) : [...prev, color.name])}
                        className={`h-5 w-5 rounded-sm border-2 flex items-center justify-center transit-all ${
                          draftColors.includes(color.name) ? "border-foreground bg-foreground" : "border-border/50"
                        }`}
                      >
                        {draftColors.includes(color.name) && <Check className="h-3 w-3 text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border/20 flex gap-3 shrink-0">
              <button
                onClick={clearAllFilters}
                className="flex-1 h-12 rounded-2xl bg-muted border border-border/30 text-sm font-bold text-foreground hover:bg-accent transit-all"
              >
                Clear all
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-orange-500 text-white text-sm font-bold hover:opacity-90 transit-all shadow-md shadow-primary/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}


// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PostHeader({ post, compact = false, onFollow }: { post: Post; compact?: boolean; onFollow: () => void }) {
  const [, setLocation] = useLocation();
  const brandId = post.taggedProduct?.brandId;
  const brandNameTag = post.taggedProduct?.brandName || (post.taggedProduct?.name ? post.taggedProduct.name.split(" ")[0] : null);
  const approvalStatus = (post as any).approvalStatus || (brandId ? "pending" : "grey");

  return (
    <div className={`flex items-start justify-between ${compact ? "p-2.5" : "p-3.5"}`}>
      <div 
        className={`flex items-start gap-2.5 ${brandId ? "cursor-pointer group/header" : ""}`}
        onClick={() => brandId && setLocation(`/brand-store/${brandId}`)}
      >
        <div className={`${compact ? "h-7 w-7" : "h-9 w-9"} rounded-full overflow-hidden border border-border/40 bg-muted shrink-0 transition-transform group-hover/header:scale-105 mt-0.5`}>
          <img src={post.creator.avatar} alt={post.creator.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className={`font-bold ${compact ? "text-[10px]" : "text-xs"} leading-none group-hover/header:text-primary transition-colors`}>{post.creator.name}</p>
            {post.creator.verified && <CheckCircle className="h-3 w-3 text-primary fill-primary" />}
          </div>
          <p className={`${compact ? "text-[8px]" : "text-[10px]"} text-muted-foreground mt-0.5`}>{post.creator.username}</p>

          {brandNameTag && (
            <div className="mt-1 flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                  approvalStatus === "green"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : approvalStatus === "red"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                    : approvalStatus === "pending"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/30"
                }`}
              >
                <Tag className="h-2.5 w-2.5" />
                @{brandNameTag}
                <span className="text-[8px] opacity-80 font-normal">
                  ({approvalStatus === "green" ? "Approved" : approvalStatus === "red" ? "Declined" : approvalStatus === "pending" ? "Pending" : "Unlisted"})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onFollow}
        className={`${compact ? "text-[9px] px-2 py-1" : "text-[11px] px-3 py-1.5"} font-bold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transit-all shrink-0`}
      >
        Follow
      </button>
    </div>
  );
}

function PostActions({ post, onLike, onTryOn, onAddToBag, liveBrands, onBrandClick }: {
  post: Post;
  onLike: () => void;
  onTryOn: () => void;
  onAddToBag: () => void;
  liveBrands: Array<{ id: number; name: string }>;
  onBrandClick: (b: { id: number; name: string }) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      {/* Like / share row */}
      <div className="flex items-center gap-4 border-b border-border/20 pb-3">
        <button onClick={onLike} className="flex items-center gap-1.5 text-sm font-medium transit-all hover:text-primary">
          <Heart className={`h-5 w-5 ${post.hasLiked ? "fill-primary text-primary scale-110" : "text-foreground/70"} transit-all`} />
          <span className={post.hasLiked ? "text-primary" : "text-foreground/70"}>{post.likes.toLocaleString()}</span>
        </button>
        <button onClick={() => toast.success("Link copied!")} className="ml-auto flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transit-all">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
      {/* Caption with orange @brand links */}
      <p className="text-xs leading-relaxed text-foreground/90">
        <span className="font-bold mr-1.5">{post.creator.name}</span>
        {renderCaption(post.caption, liveBrands, onBrandClick)}
      </p>
      {/* Product card with Price, Rating, Stock, and Orange Logo Button */}
      {localStorage.getItem(`styly_user_lock_${post.creator.name}`) === "black" ? (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
          <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> Unapproved Tag
          </span>
          <span className="text-[10px] text-muted-foreground">Normal post view</span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-muted/50 border border-border/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl overflow-hidden bg-muted border border-border/30 shrink-0">
              <img src={post.taggedProduct.image} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs truncate">{post.taggedProduct.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-primary font-black text-xs">${post.taggedProduct.price}</span>
                <span className="text-[10px] font-bold text-amber-500">★ 4.8</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">In Stock</span>
              </div>
            </div>
          </div>
          {/* Orange App Icon Logo Action Button */}
          <button
            onClick={onAddToBag}
            className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 text-white shadow-md shadow-orange-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transit-all shrink-0"
            title="Add item to bag"
          >
            <div className="relative flex items-center justify-center">
              <Shirt className="h-4 w-4 stroke-[2.5]" />
              <Plus className="h-2.5 w-2.5 absolute -top-1 -right-1 font-black stroke-[3]" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}


