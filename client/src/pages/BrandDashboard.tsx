import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BrandLevelBadge } from "@/components/BrandLevelBadge";
import {
  Search, Sun, Moon, Plus, Store, ShoppingBag, Users, DollarSign,
  CheckCircle2, Heart, UserCheck, ArrowUpRight, Lock, ChevronRight,
  Building2, Banknote, TrendingUp, Star, Package, Clock, RefreshCw,
  AlertCircle, X, Upload, ImagePlus, Tag, Layers, User as UserIcon, User, Mail, LogOut,
  Download, FileText, Check, Ban, Sparkles, Award, ShieldAlert, Calculator, LogIn,
  Truck, MapPin, Phone, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoreFilter = "in-stock" | "out-of-stock" | "pending-tags" | "approved-posts" | "unapproved-posts";
type OrderFilter = "history" | "active" | "processing" | "return";
type MainTab = "store" | "orders" | "followers" | "profits" | "shipments";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  status: "in-stock" | "out-of-stock" | "pending";
  image: string;
  locked: boolean;
  stock: number;
}

interface TaggedPost {
  id: string;
  posterName: string;
  posterAvatar: string;
  postImage: string;
  likes: number;
  shares: number;
  comments: number;
  interactions: number;
  clicks: number;
  orders: number;
  revenue: number;
  commissionEarned: number;
  taggedProducts: string[];
  lockType: "black" | "green" | "red"; // black: pending, green: approved, red: declined
  postText: string;
  taggedAt: string;
}

// ─── Level Constants ─────────────────────────────────────────────────────────

interface BrandLevel {
  name: string;
  minRevenue: number;
  commissionRate: number;
  levelUpPrice: number; // monthly fee to unlock
  free: boolean;
  color: string;
  features: string[];
  statsDescription: string;
}

// PDF Section 9.1 — Professional Seller Tiers (minRevenue in TND/month)
const BRAND_LEVELS: BrandLevel[] = [
  {
    name: "Starter",
    minRevenue: 0,
    commissionRate: 15,
    levelUpPrice: 0,
    free: true,
    color: "from-slate-400 to-slate-500",
    features: ["Post tag approval workflow", "Basic post detail modal view", "Up to 20 products", "Manual tag approval"],
    statsDescription: "View basic post metrics (Interactions & Clicks)"
  },
  {
    name: "Growth",
    minRevenue: 10000,
    commissionRate: 13,
    levelUpPrice: 165,
    free: false,
    color: "from-emerald-400 to-green-500",
    features: ["Expanded analytics & visibility", "Up to 50 products", "Basic analytics (views, clicks)", "Low-stock automatic alerts"],
    statsDescription: "View basic metrics + order conversions count"
  },
  {
    name: "Pro",
    minRevenue: 50000,
    commissionRate: 10,
    levelUpPrice: 350,
    free: false,
    color: "from-blue-400 to-indigo-500",
    features: ["Advanced analytics suite", "Up to 100 products", "Revenue & conversion tracking", "Influencer tier filters", "Priority support email"],
    statsDescription: "View all post statistics (Interactions, Clicks, Orders, Revenue)"
  },
  {
    name: "Elite",
    minRevenue: 250000,
    commissionRate: 7,
    levelUpPrice: 550,
    free: false,
    color: "from-yellow-400 to-amber-500",
    features: ["Full advanced features", "Unlimited products", "Premium placement & homepage banner", "Auto-approval whitelist", "AI-powered tag verification", "VIP Influencer campaign management"],
    statsDescription: "Full access to analytics, forecasts & VIP campaign tools"
  },
];

// Helper to determine brand level based on revenue
const getBrandLevel = (revenue: number): BrandLevel => {
  let matched = BRAND_LEVELS[0];
  for (const level of BRAND_LEVELS) {
    if (revenue >= level.minRevenue) {
      matched = level;
    }
  }
  return matched;
};

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Queen Rania S Dress", price: 1200, category: "Dresses", description: "Elegant blue embroidered abaya dress.", status: "in-stock", image: "/product_dress_1.png", locked: true, stock: 3 },
  { id: 2, name: "Queen Rania", price: 1200, category: "Dresses", description: "Classic rania collection piece.", status: "in-stock", image: "/product_dress_1.png", locked: true, stock: 5 },
  { id: 3, name: "Suede Jacket", price: 480, category: "Jackets", description: "Premium brown suede jacket.", status: "in-stock", image: "/product_jacket.png", locked: false, stock: 8 },
  { id: 4, name: "Linen Co-ord Set", price: 320, category: "Sets", description: "Light linen two-piece set.", status: "in-stock", image: "/product_jacket.png", locked: false, stock: 12 },
  { id: 5, name: "Velvet Blazer", price: 650, category: "Jackets", description: "Rich velvet formal blazer.", status: "in-stock", image: "/product_jacket.png", locked: true, stock: 0 },
  { id: 6, name: "Silk Wrap Dress", price: 890, category: "Dresses", description: "Flowing silk wrap-style dress.", status: "in-stock", image: "/product_dress_1.png", locked: true, stock: 0 },
];

const INITIAL_TAGGED_POSTS: TaggedPost[] = [
  {
    id: "PST-493821",
    posterName: "Amira Belhaj",
    posterAvatar: "/follower_1.png",
    postImage: "/product_dress_1.png",
    likes: 1240,
    shares: 310,
    comments: 89,
    interactions: 24500,
    clicks: 1800,
    orders: 45,
    revenue: 54000,
    commissionEarned: 2700,
    taggedProducts: ["Queen Rania S Dress"],
    lockType: "green",
    postText: "In love with this Queen Rania S Dress from @styly! The embroidery is absolutely stunning. ✨ #fashion #dress #styly",
    taggedAt: "2026-06-25",
  },
  {
    id: "PST-773412",
    posterName: "Yasmine Khelifi",
    posterAvatar: "/follower_2.png",
    postImage: "/product_jacket.png",
    likes: 850,
    shares: 120,
    comments: 42,
    interactions: 15400,
    clicks: 950,
    orders: 22,
    revenue: 10560,
    commissionEarned: 528,
    taggedProducts: ["Suede Jacket"],
    lockType: "green",
    postText: "This premium brown suede jacket is my go-to for chilly evenings. Get yours on Styly! @styly #ootd #jacket",
    taggedAt: "2026-06-28",
  },
  {
    id: "PST-890212",
    posterName: "Ines Saadi",
    posterAvatar: "/follower_2.png",
    postImage: "/product_dress_1.png",
    likes: 410,
    shares: 55,
    comments: 19,
    interactions: 6800,
    clicks: 420,
    orders: 8,
    revenue: 9600,
    commissionEarned: 480,
    taggedProducts: ["Silk Wrap Dress"],
    lockType: "black",
    postText: "New silk wrap dress arrived! Can't wait to style it. Tell me what you think! @styly",
    taggedAt: "2026-07-01",
  },
  {
    id: "PST-210344",
    posterName: "Sami Ben Ali",
    posterAvatar: "/follower_1.png",
    postImage: "/product_jacket.png",
    likes: 95,
    shares: 12,
    comments: 5,
    interactions: 1200,
    clicks: 80,
    orders: 1,
    revenue: 320,
    commissionEarned: 16,
    taggedProducts: ["Linen Co-ord Set"],
    lockType: "red",
    postText: "Simple linen set for a hot summer day. @styly #summerlook",
    taggedAt: "2026-06-20",
  }
];

const INITIAL_ORDERS = [
  { id: "SLY-2026-O8213", status: "history", amount: 80, label: "Delivered", date: "2026-06-15" },
  { id: "SLY-2026-O9412", status: "history", amount: 175, label: "Delivered", date: "2026-06-18" },
  { id: "SLY-2026-O2108", status: "history", amount: 1400, label: "Delivered", date: "2026-06-20" },
  { id: "SLY-2026-O1187", status: "history", amount: 0, label: "Cancelled", date: "2026-06-22" },
  { id: "SLY-2026-O0493", status: "history", amount: 150, label: "Delivered", date: "2026-06-25" },
  { id: "SLY-2026-O3310", status: "active", amount: 320, label: "Confirmed", date: "2026-06-29" },
  { id: "SLY-2026-O3290", status: "active", amount: 890, label: "Shipped", date: "2026-07-01" },
  { id: "SLY-2026-O3105", status: "active", amount: 140, label: "Placed", date: "2026-07-02" },
];

const FOLLOWERS = [
  { id: 1, name: "Soumaya Sebai", likes: 1, shares: 0, verified: true, image: "/follower_1.png" },
  { id: 2, name: "Yasmine Khelifi", likes: 4, shares: 2, verified: false, image: "/follower_2.png" },
  { id: 3, name: "Lina Bouaziz", likes: 7, shares: 1, verified: true, image: "/follower_1.png" },
  { id: 4, name: "Nour Mansouri", likes: 2, shares: 0, verified: false, image: "/follower_2.png" },
  { id: 5, name: "Amira Belhaj", likes: 12, shares: 5, verified: true, image: "/follower_1.png" },
  { id: 6, name: "Ines Saadi", likes: 3, shares: 1, verified: false, image: "/follower_2.png" },
];

const CATEGORIES = ["Dresses", "Jackets", "Sets", "Tops", "Bottoms", "Accessories", "Shoes", "Bags", "Other"];

// ─── Facture Generator Function ──────────────────────────────────────────────

const downloadFactureDoc = (post: TaggedPost) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "STYLY BRAND PARTNERSHIP FACTURE",
                bold: true,
                color: "9C27B0",
                size: 28,
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Post ID: ${post.id} | Generated on ${new Date().toLocaleDateString()}`,
                italics: true,
                color: "666666",
              }),
            ],
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Influencer Information", bold: true, size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Poster Name: `, bold: true }),
              new TextRun({ text: post.posterName }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Tagged Products: `, bold: true }),
              new TextRun({ text: post.taggedProducts.join(", ") }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Post Engagement & Financial Statistics", bold: true, size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Interactions (App)" })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: post.interactions.toLocaleString() })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Clicks Generated" })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: post.clicks.toLocaleString() })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Total Revenue Generated" })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `${post.revenue.toLocaleString()} TND` })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Commission Earned" })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `${post.commissionEarned.toLocaleString()} TND` })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Thank you for partnering with Styly. Powered by Styly platform.",
                italics: true,
                color: "888888",
              }),
            ],
            spacing: { before: 1000 },
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `facture_${post.posterName.replace(/\s+/g, "_")}_post_${post.id}.docx`);
    toast.success("Facture downloaded successfully! 📄");
  }).catch((err) => {
    console.error(err);
    toast.error("Failed to generate Facture.");
  });
};

// ─── Post Detail Modal (Completely Unlocked Stats) ───────────────────────────

interface PostDetailModalProps {
  post: TaggedPost | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  isFeatureUnlocked: (featureName: string) => boolean;
}

function PostDetailModal({ post, open, onClose, onApprove, onDecline, isFeatureUnlocked }: PostDetailModalProps) {
  if (!open || !post) return null;

  const canDownloadFacture = true; // Open for everyone

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Tagged Post Details
              {post.lockType === "green" ? (
                <Lock className="h-4.5 w-4.5 text-green-500" />
              ) : post.lockType === "red" ? (
                <Lock className="h-4.5 w-4.5 text-red-500" />
              ) : (
                <Lock className="h-4.5 w-4.5 text-neutral-900 dark:text-neutral-100" />
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Post ID: {post.id}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Post Image & Creator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-[3/4] rounded-2xl bg-muted overflow-hidden border border-border/50">
              <img src={post.postImage} alt="Post content" className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 overflow-hidden border-2 border-primary/20">
                  <img src={post.posterAvatar} alt={post.posterName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1">
                    {post.posterName}
                    <CheckCircle2 className="h-4 w-4 fill-blue-500 text-white shrink-0" />
                  </h3>
                  <p className="text-xs text-muted-foreground">Influencer Partner</p>
                </div>
              </div>

              <div className="bg-accent/40 p-3 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Tag Mockup View</p>
                <div className="p-3 bg-card border border-border/50 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">@styly_brand</span>
                  {post.lockType === "green" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 animate-bounce flex items-center gap-1 border border-green-500/40">
                      <Sparkles className="h-3 w-3" /> Approved & Animated
                    </span>
                  ) : post.lockType === "red" ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      Declassified (Normal Text)
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Pending review
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Post Text</p>
                <p className="text-xs text-foreground italic leading-relaxed">"{post.postText}"</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Tagged Products</p>
                <div className="flex flex-wrap gap-1.5">
                  {post.taggedProducts.map((p) => (
                    <span key={p} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Grid (Now fully visible for all brand levels in the Store modal) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" /> Post Statistics
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-card border border-border/50 rounded-xl">
                <p className="text-[10px] font-medium text-muted-foreground">Interactions</p>
                <p className="text-base font-bold mt-0.5">{post.interactions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-card border border-border/50 rounded-xl">
                <p className="text-[10px] font-medium text-muted-foreground">Clicks</p>
                <p className="text-base font-bold mt-0.5">{post.clicks.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-card border border-border/50 rounded-xl">
                <p className="text-[10px] font-medium text-muted-foreground">Conversions (Orders)</p>
                <p className="text-base font-bold mt-0.5">{post.orders.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-card border border-border/50 rounded-xl">
                <p className="text-[10px] font-medium text-muted-foreground">Revenue Generated</p>
                <p className="text-base font-bold mt-0.5 text-green-600 dark:text-green-400">
                  {post.revenue.toLocaleString()} TND
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50 flex gap-3 shrink-0 bg-background">
          {post.lockType === "black" ? (
            <>
              <button
                onClick={() => { onDecline(post.id); onClose(); }}
                className="flex-1 h-11 rounded-full border border-red-500/30 text-red-500 text-sm font-semibold hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <Ban className="h-4 w-4" /> Decline Tag
              </button>
              <button
                onClick={() => { onApprove(post.id); onClose(); }}
                className="flex-1 h-11 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-500 active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Check className="h-4 w-4" /> Approve Tag
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-full border border-border/60 text-sm font-semibold hover:bg-accent transition-all"
              >
                Close View
              </button>
              {post.lockType === "green" && (
                <button
                  disabled={!canDownloadFacture}
                  onClick={() => downloadFactureDoc(post)}
                  className={`flex-1 h-11 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all ${
                    canDownloadFacture
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-neutral-400 cursor-not-allowed opacity-60"
                  }`}
                  title={canDownloadFacture ? "Download Microsoft Word Facture" : "Upgrade standing level to unlock facture downloads"}
                >
                  <Download className="h-4 w-4" /> Facture
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Detail Modal ───────────────────────────────────────────────────

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

function ProductDetailModal({ product, open, onClose }: ProductDetailModalProps) {
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold">Product Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Product ID: {product.id}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-extrabold text-foreground">{product.name}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-semibold">{product.category}</span>
            </div>
            
            <p className="text-primary font-black text-xl">{product.price.toLocaleString()} TND</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description || "No description available for this item."}</p>
            
            <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs font-bold">
              <span className="text-muted-foreground">In Stock Count:</span>
              <span className={product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}>
                {product.stock > 0 ? `${product.stock} units` : "Out of Stock"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50 bg-background flex">
          <button onClick={onClose} className="w-full h-11 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
}

function AddItemModal({ open, onClose, onAdd }: AddItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    stock: "",
    status: "in-stock" as "in-stock" | "pending",
  });

  const resetForm = () => {
    setForm({ name: "", price: "", category: "", description: "", stock: "", status: "in-stock" });
    setImagePreview("");
    setErrors({});
    setIsDragging(false);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Item name is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = "Enter a valid price greater than 0.";
    if (!form.category) newErrors.category = "Please select a category.";
    if (form.stock !== "" && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
      newErrors.stock = "Stock must be 0 or more.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);

    // Simulate brief async save (replace with real API call when backend is ready)
    await new Promise((r) => setTimeout(r, 800));

    const newProduct: Product = {
      id: Date.now(),
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      description: form.description.trim(),
      status: form.status,
      image: imagePreview || "/product_jacket.png",
      locked: false,
      stock: form.stock === "" ? 1 : Number(form.stock),
    };

    onAdd(newProduct);
    toast.success(`"${newProduct.name}" added to your store! 🎉`);
    handleClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add new item"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold">Add new item</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below to list a product</p>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* ── Image Upload ── */}
          <div>
            <label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <ImagePlus className="h-4 w-4 text-primary" /> Product Photo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : imagePreview
                  ? "border-transparent"
                  : "border-border/60 hover:border-primary/60 hover:bg-accent/50"
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5 text-white" />
                      <span className="text-white text-xs font-medium">Change photo</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setImagePreview(""); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Drop a photo or click to browse</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              id="item-image-upload"
            />
          </div>

          {/* ── Item Name ── */}
          <div>
            <label htmlFor="item-name" className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Tag className="h-4 w-4 text-primary" /> Item Name *
            </label>
            <input
              id="item-name"
              type="text"
              placeholder="e.g. Queen Rania Dress"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full h-11 px-4 rounded-xl bg-muted border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                errors.name ? "border-destructive" : "border-border/50"
              }`}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* ── Price + Category row ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="item-price" className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <DollarSign className="h-4 w-4 text-primary" /> Price (TND) *
              </label>
              <input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={`w-full h-11 px-4 rounded-xl bg-muted border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                  errors.price ? "border-destructive" : "border-border/50"
                }`}
              />
              {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
            </div>
            <div>
              <label htmlFor="item-stock" className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Layers className="h-4 w-4 text-primary" /> Stock Qty
              </label>
              <input
                id="item-stock"
                type="number"
                min="0"
                placeholder="e.g. 10"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={`w-full h-11 px-4 rounded-xl bg-muted border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                  errors.stock ? "border-destructive" : "border-border/50"
                }`}
              />
              {errors.stock && <p className="text-xs text-destructive mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* ── Category ── */}
          <div>
            <label htmlFor="item-category" className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Package className="h-4 w-4 text-primary" /> Category *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                    form.category === cat
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-muted border-border/50 hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
          </div>

          {/* ── Description ── */}
          <div>
            <label htmlFor="item-desc" className="text-sm font-semibold mb-2 block">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="item-desc"
              rows={3}
              placeholder="Describe your item — fabric, style, occasion…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border/50 flex gap-3 shrink-0 bg-background">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 h-12 rounded-full border border-border/60 text-sm font-semibold hover:bg-accent transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 h-12 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? "Adding…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────


function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card border border-border/50 rounded-3xl">
      <div className="mb-6 opacity-60">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {subtitle && <p className="text-muted-foreground text-sm max-w-xs">{subtitle}</p>}
    </div>
  );
}

// Lock Indicator component
function LockIcon({ type }: { type: "green" | "red" | "black" }) {
  const colorMap = {
    green: "bg-green-500 text-white dark:bg-green-600 shadow border border-green-400/20",
    red: "bg-red-500 text-white dark:bg-red-600 shadow border border-red-400/20",
    black: "bg-black text-white dark:bg-neutral-800 shadow border border-neutral-700/20",
  };

  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorMap[type]} transition-transform hover:scale-110`}>
      <Lock className="h-3.5 w-3.5" />
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3EImage%3C/text%3E%3C/svg%3E";
          }}
        />
        {product.locked && (
          <div className="absolute bottom-2 right-2">
            <LockIcon type="green" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-primary font-bold text-sm">{product.price.toLocaleString()} TND</p>
          {product.category && (
            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{product.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Post Approval Request Card (Store Tab) ──────────────────────────────────

interface TagRequestCardProps {
  post: TaggedPost;
  onSelect: (post: TaggedPost) => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}

function TagRequestCard({ post, onSelect, onApprove, onDecline }: TagRequestCardProps) {
  return (
    <div className="relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="aspect-[4/3] bg-muted relative group overflow-hidden cursor-pointer" onClick={() => onSelect(post)}>
        <img src={post.postImage} alt="Tagged Post Content" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <LockIcon type={post.lockType} />
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            Inspect details
          </span>
        </div>
      </div>
      
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10">
            <img src={post.posterAvatar} alt={post.posterName} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{post.posterName}</p>
            <p className="text-[10px] text-muted-foreground truncate">tagged products</p>
          </div>
        </div>

        {post.lockType === "black" && (
          <div className="flex gap-2">
            <button
              onClick={() => onDecline(post.id)}
              className="flex-1 h-9 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 flex items-center justify-center gap-1 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" /> Decline
            </button>
            <button
              onClick={() => onApprove(post.id)}
              className="flex-1 h-9 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-500 flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
          </div>
        )}

        {post.lockType === "green" && (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-center py-1.5 rounded-xl border border-green-500/20 text-[10px] font-bold flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Tag Approved (Animated)
          </div>
        )}

        {post.lockType === "red" && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-center py-1.5 rounded-xl border border-red-500/20 text-[10px] font-bold flex items-center justify-center gap-1">
            <Ban className="h-3.5 w-3.5" /> Tag Declined (Plain text)
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Row ───────────────────────────────────────────────────────────────

interface Order {
  id: string;
  status: string;
  amount: number;
  label: string;
  date: string;
}

function OrderRow({ order }: { order: Order }) {
  const getBadgeClass = (label: string) => {
    switch (label) {
      case "Placed": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "Confirmed": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "Shipped": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "Delivered": return "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
      default: return "bg-neutral-500/10 text-neutral-600 border border-neutral-500/20";
    }
  };

  return (
    <div className="flex items-center gap-3 py-4 border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors px-2 rounded-xl">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <ShoppingBag className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-foreground truncate">{order.id}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeClass(order.label)}`}>
            {order.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Ordered on: {order.date}</p>
      </div>
      <p className="font-extrabold text-sm shrink-0">{order.amount.toLocaleString()} TND</p>
    </div>
  );
}

// ─── Tagged Post Row (Profits Tab) ──────────────────────────────────────────

interface TaggedPostRowProps {
  post: TaggedPost;
  isFeatureUnlocked: (featureName: string) => boolean;
  onSelect: (post: TaggedPost) => void;
}

function TaggedPostRow({ post, isFeatureUnlocked, onSelect }: TaggedPostRowProps) {
  const canDownloadFacture = true; // Open for everyone
  const canSeeDetailedPostRev = isFeatureUnlocked("Established");

  return (
    <div className="flex items-center gap-3 py-4 border-b border-border/40 last:border-0 hover:bg-accent/30 transition-all px-3 rounded-2xl">
      <div className="h-14 w-11 rounded-lg overflow-hidden bg-muted shrink-0 cursor-pointer" onClick={() => onSelect(post)}>
        <img src={post.postImage} alt="Post content" className="w-full h-full object-cover hover:scale-105 transition-transform" />
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(post)}>
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm text-foreground truncate">{post.posterName}</p>
          <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground truncate">{post.taggedProducts.join(", ")}</p>
      </div>

      <div className="text-right shrink-0 mr-1">
        {canSeeDetailedPostRev ? (
          <>
            <p className="font-extrabold text-sm text-green-600 dark:text-green-400">+{post.revenue.toLocaleString()} TND</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{post.interactions.toLocaleString()} interactions</p>
          </>
        ) : (
          <div className="flex flex-col items-end">
            <span className="blur-xs font-extrabold text-sm text-green-600">9,999 TND</span>
            <span className="text-[8px] text-muted-foreground block mt-0.5">Locked (Free)</span>
          </div>
        )}
      </div>

      <button
        disabled={!canDownloadFacture}
        onClick={(e) => { e.stopPropagation(); downloadFactureDoc(post); }}
        className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all ${
          canDownloadFacture
            ? "border-border/60 hover:bg-primary hover:text-white"
            : "border-border/30 text-muted-foreground/40 bg-muted/40 cursor-not-allowed"
        }`}
        title={canDownloadFacture ? "Download Facture" : "Upgrade standing level to unlock facture downloads"}
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Store Tab ─────────────────────────────────────────────────────────────────

interface StoreTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  taggedPosts: TaggedPost[];
  onApproveTag: (id: string) => void;
  onDeclineTag: (id: string) => void;
  onSelectPost: (post: TaggedPost) => void;
  onSelectProduct: (product: Product) => void;
}

function StoreTab({ products, setProducts, taggedPosts, onApproveTag, onDeclineTag, onSelectPost, onSelectProduct }: StoreTabProps) {
  const [filter, setFilter] = useState<StoreFilter>("in-stock");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filters: { key: StoreFilter; label: string; count?: number; icon?: React.ReactNode }[] = [
    { key: "in-stock", label: "In Stock" },
    { key: "out-of-stock", label: "Out of Stock" },
    { key: "pending-tags", label: "Pending Tags", count: taggedPosts.filter(p => p.lockType === "black").length, icon: <Lock className="h-3 w-3 text-foreground" /> },
    { key: "approved-posts", label: "Approved Tags", count: taggedPosts.filter(p => p.lockType === "green").length, icon: <Lock className="h-3 w-3 text-green-500" /> },
    { key: "unapproved-posts", label: "Declined Tags", count: taggedPosts.filter(p => p.lockType === "red").length, icon: <Lock className="h-3 w-3 text-red-500" /> },
  ];

  // Filter logic
  const showProducts = filter === "in-stock" || filter === "out-of-stock";
  
  const filteredProducts = products.filter((p) => {
    // Only display non-pending items in store page products grid
    const matchesFilter =
      filter === "out-of-stock"
        ? p.stock === 0 && p.status === "in-stock"
        : p.status === "in-stock" && p.stock > 0;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredPosts = taggedPosts.filter((post) => {
    const matchesFilter =
      filter === "pending-tags"
        ? post.lockType === "black"
        : filter === "approved-posts"
        ? post.lockType === "green"
        : filter === "unapproved-posts"
        ? post.lockType === "red"
        : false;
    const matchesSearch = post.posterName.toLowerCase().includes(search.toLowerCase()) || 
                          post.taggedProducts.some(p => p.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    setFilter("in-stock");
  };

  return (
    <>
      <div className="space-y-5">
        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={showProducts ? "Search your outfits..." : "Search tagged influencers or products..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-full bg-muted border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <button className="h-12 w-12 rounded-full bg-muted border border-border/40 flex items-center justify-center hover:bg-accent transition-colors">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full h-12 rounded-full border-2 border-border/60 font-semibold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Add new item
        </button>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5 ${
                filter === f.key
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-transparent text-foreground border-border/60 hover:bg-accent"
              }`}
            >
              {f.icon && f.icon}
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Display Grid */}
        {showProducts ? (
          filteredProducts.length === 0 ? (
            <EmptyState
              icon={<div className="text-8xl select-none">📦</div>}
              title="No items found"
              subtitle="Adjust filters or add a new outfit to your catalog."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
              ))}
            </div>
          )
        ) : (
          filteredPosts.length === 0 ? (
            <EmptyState
              icon={<div className="text-8xl select-none">📸</div>}
              title="No tags in this category"
              subtitle="All tagged posts and influencer mentions are grouped here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {filteredPosts.map((post) => (
                <TagRequestCard
                  key={post.id}
                  post={post}
                  onSelect={onSelectPost}
                  onApprove={onApproveTag}
                  onDecline={onDeclineTag}
                />
              ))}
            </div>
          )
        )}
      </div>

      <AddItemModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddProduct} />
    </>
  );
}

// ─── Orders Tab ────────────────────────────────────────────────────────────────

interface OrdersTabProps {
  orders: Order[];
}

function OrdersTab({ orders }: OrdersTabProps) {
  const [filter, setFilter] = useState<OrderFilter>("history");

  const orderFilters: { key: OrderFilter; label: string; dot: string }[] = [
    { key: "history", label: "Order history", dot: "bg-muted-foreground" },
    { key: "active", label: "Active", dot: "bg-green-500" },
    { key: "processing", label: "Processing", dot: "bg-amber-500" },
    { key: "return", label: "Return", dot: "bg-red-500" },
  ];

  const displayOrders = filter === "history" ? orders : orders.filter((o) => o.status === filter);

  const emptyStates: Record<string, { emoji: string; title: string; subtitle: string }> = {
    processing: { emoji: "📦", title: "No processing orders", subtitle: "Orders currently prepared for shipment appear here." },
    return: { emoji: "😞", title: "No returned orders", subtitle: "Disputed or returned items from fashion buyers." },
    active: { emoji: "✨", title: "No active orders right now", subtitle: "Active outfits orders waiting for full delivery." },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
        <div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            Total sales value <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground text-[9px] flex items-center justify-center">i</span>
          </p>
          <p className="text-3xl font-extrabold mt-1 text-primary">
            {orders.reduce((acc, curr) => acc + (curr.label !== "Cancelled" ? curr.amount : 0), 0).toLocaleString()} TND
          </p>
        </div>
        <button className="px-4 py-2 rounded-full border border-border/60 text-sm font-medium hover:bg-accent transition-colors flex items-center gap-1.5">
          View invoices <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 min-w-max">
          {orderFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
                filter === f.key
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-transparent text-foreground border-border/60 hover:bg-accent"
              }`}
            >
              {f.label}
              <span className={`h-2 w-2 rounded-full ${f.dot}`} />
            </button>
          ))}
        </div>
      </div>

      {displayOrders.length === 0 && emptyStates[filter] ? (
        <EmptyState
          icon={<div className="text-8xl select-none">{emptyStates[filter].emoji}</div>}
          title={emptyStates[filter].title}
          subtitle={emptyStates[filter].subtitle}
        />
      ) : (
        <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-1 shadow-sm">
          {displayOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Followers Tab ─────────────────────────────────────────────────────────────

function FollowersTab() {
  const [search, setSearch] = useState("");
  const [lockStatuses, setLockStatuses] = useState<Record<string, "green" | "orange" | "red">>(() => {
    const initial: Record<string, "green" | "orange" | "red"> = {};
    FOLLOWERS.forEach((f) => {
      const stored = localStorage.getItem(`styly_user_lock_${f.name}`);
      initial[f.name] = (stored as "green" | "orange" | "red") || "orange";
    });
    return initial;
  });

  const toggleLock = (e: React.MouseEvent, followerName: string) => {
    e.stopPropagation();
    const current = lockStatuses[followerName] || "orange";
    const next = current === "orange" ? "green" : current === "green" ? "red" : "orange";
    localStorage.setItem(`styly_user_lock_${followerName}`, next);
    setLockStatuses((prev) => ({ ...prev, [followerName]: next }));
    toast.success(
      `${followerName}'s lock status set to ${
        next === "green"
          ? "🟢 Green (Auto-Approve Tags)"
          : next === "red"
          ? "🔴 Red (Banned / Auto-Decline Tags)"
          : "🟧 Orange (Normal / Pending Review)"
      }`
    );
  };

  const filtered = FOLLOWERS.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search followers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-full bg-muted border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <button className="h-12 w-12 rounded-full bg-muted border border-border/40 flex items-center justify-center hover:bg-accent transition-colors">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-20 w-20 text-muted-foreground/40" />} title="No followers found" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((follower) => {
            const status = lockStatuses[follower.name] || "orange";
            return (
              <div key={follower.id} className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted group cursor-pointer border border-border/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                <img
                  src={follower.image}
                  alt={follower.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* 3-State Lock Status Toggle */}
                <button
                  onClick={(e) => toggleLock(e, follower.name)}
                  className={`absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${
                    status === "green"
                      ? "bg-emerald-500 text-white border-emerald-400/50 shadow"
                      : status === "red"
                      ? "bg-red-500 text-white border-red-400/50 shadow"
                      : "bg-amber-500 text-white border-amber-400/50 shadow"
                  }`}
                  title={
                    status === "green"
                      ? "🟢 Green Lock: Auto-Approve posts from this user"
                      : status === "red"
                      ? "🔴 Red Lock: Banned / Auto-Decline posts from this user"
                      : "🟧 Orange Lock: Normal (Requires Approval)"
                  }
                >
                  <Lock className="h-3.5 w-3.5" />
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <p className="text-white font-semibold text-sm truncate">{follower.name}</p>
                    {follower.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 fill-blue-400" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-white/90 text-xs">
                      <Heart className="h-3 w-3 fill-white" /> {follower.likes}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      status === "green" ? "bg-emerald-500/80 text-white" : status === "red" ? "bg-red-500/80 text-white" : "bg-amber-500/80 text-white"
                    }`}>
                      {status === "green" ? "Auto" : status === "red" ? "Banned" : "Review"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

const MONTHLY_CHART_DATA = [
  { month: "Feb", revenue: 18400, orders: 24 },
  { month: "Mar", revenue: 24200, orders: 31 },
  { month: "Apr", revenue: 19800, orders: 27 },
  { month: "May", revenue: 31500, orders: 42 },
  { month: "Jun", revenue: 28900, orders: 38 },
  { month: "Jul", revenue: 36200, orders: 49 },
];

// ─── Commission Calculator ────────────────────────────────────────────────────

function CommissionCalculator({ commissionRate }: { commissionRate: number }) {
  const [extraPosts, setExtraPosts] = useState(5);
  const avgRevenuePerPost = 3200; // TND
  const estimatedExtra = extraPosts * avgRevenuePerPost;
  const commissionEarned = estimatedExtra * (commissionRate / 100);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-card border border-primary/20 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Calculator className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Commission Estimator</h3>
          <p className="text-[10px] text-muted-foreground">See how more tagged posts boost your earnings</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-muted-foreground">Extra tagged posts this month</span>
          <span className="text-primary font-black text-base">{extraPosts}</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={extraPosts}
          onChange={(e) => setExtraPosts(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>1 post</span>
          <span>30 posts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Estimated Revenue</p>
          <p className="text-sm font-black text-foreground mt-0.5">{estimatedExtra.toLocaleString()} TND</p>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Your Commission ({commissionRate}%)</p>
          <p className="text-sm font-black text-green-600 dark:text-green-400 mt-0.5">+{commissionEarned.toLocaleString()} TND</p>
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground text-center">
        Based on avg. {avgRevenuePerPost.toLocaleString()} TND revenue per approved post at your current {commissionRate}% commission tier.
      </p>
    </div>
  );
}

// ─── Profits Tab (Progression and Level Up CTAs) ─────────────────────────────

interface ProfitsTabProps {
  revenueTND: number;
  setRevenueTND: React.Dispatch<React.SetStateAction<number>>;
  activePaidTier: string;
  onUpgradeTier: (tierName: string, price: number) => void;
  taggedPosts: TaggedPost[];
  onSelectPost: (post: TaggedPost) => void;
  isFeatureUnlocked: (featureName: string) => boolean;
  brandId: number;
}

function ProfitsTab({ revenueTND, setRevenueTND, activePaidTier, onUpgradeTier, taggedPosts, onSelectPost, isFeatureUnlocked, brandId }: ProfitsTabProps) {
  const { data: commissions = [], refetch: refetchCommissions } = trpc.commissions.brandCommissions.useQuery({ brandId });
  const updateStatusMutation = trpc.commissions.updateStatus.useMutation();

  const handleUpdateCommission = async (id: number, status: "approved" | "paid" | "rejected") => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success(`Commission updated to ${status}!`);
      refetchCommissions();
    } catch (e: any) {
      toast.error(e.message || "Failed to update commission");
    }
  };

  const currentLevel = getBrandLevel(revenueTND);
  const nextLevel = BRAND_LEVELS[BRAND_LEVELS.indexOf(currentLevel) + 1] || null;

  // Calculate progress percent to next level
  let progressPercent = 100;
  if (nextLevel) {
    const range = nextLevel.minRevenue - currentLevel.minRevenue;
    const currentOffset = revenueTND - currentLevel.minRevenue;
    progressPercent = Math.min(Math.max((currentOffset / range) * 100, 0), 100);
  }

  // Check if current level requires paid activation and isn't active yet
  const needsPaidActivation = !currentLevel.free && activePaidTier !== currentLevel.name;

  const approvedPosts = taggedPosts.filter((post) => post.lockType === "green");
  const showCharts = isFeatureUnlocked("Profits tab analytics chart");
  const showInfluencerBreakdown = isFeatureUnlocked("Gold Partner");

  return (
    <div className="space-y-6">
      {/* Brand Level Standing Progression Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 border border-border/50 shadow-md relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Brand Level Progress</span>
            <div className="flex items-center gap-2">
              <h2 className={`text-2xl font-black bg-gradient-to-r ${currentLevel.color} bg-clip-text text-transparent`}>
                {currentLevel.name}
              </h2>
              {!currentLevel.free && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  activePaidTier === currentLevel.name
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }`}>
                  {activePaidTier === currentLevel.name ? "Paid & Active" : "Requires Activation"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-md">Commission rate decreases as standing level scales.</p>
          </div>

          <div className="bg-muted/50 border border-border/40 px-4 py-3 rounded-2xl shrink-0 text-center md:text-right">
            <span className="text-[10px] font-medium text-muted-foreground block">Active Commission Rate</span>
            <span className="text-xl font-black text-foreground">{currentLevel.commissionRate}%</span>
            <span className="text-[9px] text-muted-foreground block mt-0.5">charged per in-app sale</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Volume: {revenueTND.toLocaleString()} TND</span>
            {nextLevel ? (
              <span className="text-primary">Next: {nextLevel.name} ({nextLevel.minRevenue.toLocaleString()} TND)</span>
            ) : (
              <span className="text-yellow-500 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Max Stylista Level</span>
            )}
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/20 p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Feature Unlocks Checklist */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <p className="text-xs font-bold text-foreground mb-2.5">Current Tier Unlocked Features:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentLevel.features.map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>{currentLevel.statsDescription}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live SQLite Brand XP Level system */}
      <BrandLevelBadge brandId={brandId} showDetails={true} />

      {/* Level Up activation paywall CTA */}
      {needsPaidActivation && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-dashed border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-extrabold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5 justify-center md:justify-start">
              <Sparkles className="h-4 w-4" /> Activate {currentLevel.name} Standing
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Pay the monthly subscription fee of **{currentLevel.levelUpPrice} TND/month** to activate this tier's privileges, decrease transaction fees, and unlock advanced statistic facture reports.
            </p>
          </div>
          <button
            onClick={() => onUpgradeTier(currentLevel.name, currentLevel.levelUpPrice)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full text-xs shadow-sm flex items-center gap-1 whitespace-nowrap"
          >
            Activate Level ({currentLevel.levelUpPrice} TND)
          </button>
        </div>
      )}

      {/* Simulated controls to review level locks easily */}
      <div className="p-4 rounded-2xl bg-accent/40 border border-border/50 space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Standing Simulation Controls
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {BRAND_LEVELS.map((level) => (
            <button
              key={level.name}
              onClick={() => setRevenueTND(level.minRevenue + 1000)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                revenueTND >= level.minRevenue && (BRAND_LEVELS[BRAND_LEVELS.indexOf(level) + 1] === undefined || revenueTND < BRAND_LEVELS[BRAND_LEVELS.indexOf(level) + 1].minRevenue)
                  ? "bg-primary text-white border-primary"
                  : "bg-card hover:bg-accent border-border/40"
              }`}
            >
              {level.name} ({level.minRevenue >= 1000000 ? `${level.minRevenue / 1000000}M` : `${level.minRevenue / 1000}K`})
            </button>
          ))}
        </div>
      </div>

      {/* Primary Financial Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all duration-200">
          <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-xl font-bold">{revenueTND.toLocaleString()} TND</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Total Revenue</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all duration-200">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold">{(revenueTND * 0.12).toLocaleString()} TND</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">This Month Est.</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all duration-200">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold">14,200 TND</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Pending Payout</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all duration-200">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold">{approvedPosts.reduce((acc, curr) => acc + curr.orders, 0) + 8}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Total Orders</p>
        </div>
      </div>

      {/* Commission Calculator Widget */}
      <CommissionCalculator commissionRate={currentLevel.commissionRate} />

      {/* Advanced charts segment (Unlocked on Silver Partner) */}
      <div className="relative">
        {!showCharts && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-border/50">
            <Lock className="h-7 w-7 text-primary mb-2" />
            <p className="text-xs font-bold text-foreground">Analytics Charts Locked</p>
            <p className="text-[10px] text-muted-foreground max-w-xs mt-0.5">Unlocks on Silver Partner level or higher. Keep driving sales to level up!</p>
          </div>
        )}
        <div className="bg-card border border-border/50 p-5 rounded-2xl space-y-5 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Revenue & Orders
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold bg-accent px-2 py-0.5 rounded-full">Last 6 months</span>
          </div>

          {/* Revenue Bar Chart */}
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 11 }}
                  formatter={(value: number) => [`${value.toLocaleString()} TND`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Bar Chart */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Orders per Month</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_CHART_DATA} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 11 }}
                    formatter={(value: number) => [value, 'Orders']}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Influencer performance breakdown (Unlocked on Gold Partner) */}
      {showInfluencerBreakdown && (
        <div className="bg-card border border-border/50 p-5 rounded-2xl space-y-3 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
            <Award className="h-4 w-4 text-yellow-500" /> Gold Level: Influencer Revenue Share
          </h3>
          <div className="text-xs text-muted-foreground divide-y divide-border/40">
            <div className="flex justify-between py-2 font-bold">
              <span>Influencer name</span>
              <span>Orders driven</span>
              <span>Revenue share</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Amira Belhaj</span>
              <span>45 orders</span>
              <span>54,000 TND</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Yasmine Khelifi</span>
              <span>22 orders</span>
              <span>10,560 TND</span>
            </div>
          </div>
        </div>
      )}

      {/* Tagged Posts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Award className="h-4 w-4 text-primary" /> Approved Tagged Posts
          </h3>
          <span className="text-xs text-muted-foreground">{approvedPosts.length} posts approved</span>
        </div>

        {approvedPosts.length === 0 ? (
          <div className="p-6 bg-card border border-border/50 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground">No approved tagged posts found. Approve posts in the Store tab.</p>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-1 shadow-sm">
            {approvedPosts.map((post) => (
              <TaggedPostRow key={post.id} post={post} isFeatureUnlocked={isFeatureUnlocked} onSelect={onSelectPost} />
            ))}
          </div>
        )}
      </div>

      {/* Brand Payout Ledger Section */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Banknote className="h-4 w-4 text-primary" /> Brand Payout Ledger
          </h3>
          <span className="text-xs text-muted-foreground">{commissions.length} payout requests</span>
        </div>

        {commissions.length === 0 ? (
          <div className="p-6 bg-card border border-border/50 rounded-2xl text-center">
            <p className="text-xs text-muted-foreground">No payout requests from influencers found yet.</p>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3 shadow-sm divide-y divide-border/20">
            {commissions.map((comm: any, idx: number) => (
              <div key={comm.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${idx > 0 ? "pt-3" : ""}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">User #{comm.userId}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white ${
                      comm.status === "pending" ? "bg-amber-500" :
                      comm.status === "approved" ? "bg-emerald-500" :
                      comm.status === "paid" ? "bg-blue-500" : "bg-red-500"
                    }`}>
                      {comm.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comm.description || "Commission Payout Request"}</p>
                  <p className="text-[10px] text-muted-foreground/60">{new Date(comm.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <span className="font-black text-sm text-foreground">{Number(comm.amount).toFixed(2)} TND</span>
                  <div className="flex items-center gap-1.5">
                    {comm.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateCommission(comm.id, "approved")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-500/20 font-bold transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateCommission(comm.id, "rejected")}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/20 font-bold transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {comm.status === "approved" && (
                      <button
                        onClick={() => handleUpdateCommission(comm.id, "paid")}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-500/20 font-bold transition-all"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BrandDashboard() {
  const { user: appUser, loading: appLoading } = useAuth();
  const [, setLocation] = useLocation();

  // While the app session is loading, show a spinner
  if (appLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed into Styly → redirect to auth
  if (!appUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0C0F17] text-white px-4 relative overflow-hidden font-sans gap-6">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-[#121624] -z-10" />
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[150px] -z-10" />
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-[#FF8C42] items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">Sign in to Styly first</h1>
          <p className="text-xs text-neutral-400">You need to be signed in to your Styly account to access your Brand Dashboard.</p>
          <button
            onClick={() => setLocation("/auth")}
            className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-[#FF8C42] text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            Sign In to Styly
          </button>
          <button
            onClick={() => setLocation("/")}
            className="w-full h-11 rounded-full border border-white/10 text-neutral-300 font-bold text-xs hover:bg-white/5 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Signed in — hand off to inner component with the resolved userId
  return <BrandDashboardInner userId={appUser.id} appUser={appUser} />;
}

// ─── Inner component (receives resolved, stable userId) ───────────────────────

function BrandDashboardInner({ userId, appUser }: { userId: number; appUser: any }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<MainTab>("store");
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();

  // Helper to scope every localStorage key to this user's account
  const key = (name: string) => `${name}_${userId}`;

  const brandRegistered = localStorage.getItem(key("brand_registered")) === "true";

  // brand_logged_in_X can be:
  //   null / missing → never explicitly logged out → auto-grant if registered
  //   "true"  → explicitly logged in
  //   "false" → explicitly logged out → must log in again
  const brandLoggedInRaw = localStorage.getItem(key("brand_logged_in"));
  const initiallyLoggedIn = brandRegistered && brandLoggedInRaw !== "false";

  const [brandLoggedIn, setBrandLoggedIn] = useState(initiallyLoggedIn);

  // State with user-scoped initial values
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`brand_products_${userId}`);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Read persisted brand info (user-scoped)
  const brandName = localStorage.getItem(key("brand_name")) || "My Style Store";
  const brandOwner = localStorage.getItem(key("brand_owner_name")) || appUser?.name || "Brand Owner";

  // Resolve brand ID by name
  const { data: allBrands = [] } = trpc.brands.list.useQuery();
  const matchedBrand = allBrands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  const brandId = matchedBrand?.id || 1;

  // Query server database for live tagged posts
  const { data: dbTaggedPosts = [], refetch: refetchTaggedPosts } = trpc.posts.getBrandTaggedPosts.useQuery(
    { brandName },
    { enabled: !!brandName }
  );

  const updateApprovalMutation = trpc.posts.updateApprovalStatus.useMutation();

  const [taggedPosts, setTaggedPosts] = useState<TaggedPost[]>(() => {
    try {
      const saved = localStorage.getItem(`brand_tagged_posts_${userId}`);
      return saved ? JSON.parse(saved) : INITIAL_TAGGED_POSTS;
    } catch {
      return INITIAL_TAGGED_POSTS;
    }
  });

  const [revenueTND, setRevenueTND] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`brand_revenue_tnd_${userId}`);
      return saved ? Number(saved) : 6000000;
    } catch {
      return 6000000;
    }
  });

  const [activePaidTier, setActivePaidTier] = useState<string>(() => {
    try {
      return localStorage.getItem(`brand_paid_tier_${userId}`) || "";
    } catch {
      return "";
    }
  });

  const [selectedPost, setSelectedPost] = useState<TaggedPost | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Sync state to user-scoped storage keys
  useEffect(() => {
    localStorage.setItem(key("brand_products"), JSON.stringify(products));
  }, [products]);

  // Synchronize database posts and merge with seeded initial posts
  useEffect(() => {
    if (dbTaggedPosts) {
      const merged = [...dbTaggedPosts];
      INITIAL_TAGGED_POSTS.forEach((item) => {
        if (!merged.some((m) => m.id === item.id)) {
          merged.push(item);
        }
      });
      setTaggedPosts(merged);
    }
  }, [dbTaggedPosts]);

  useEffect(() => {
    localStorage.setItem(key("brand_tagged_posts"), JSON.stringify(taggedPosts));
  }, [taggedPosts]);

  useEffect(() => {
    localStorage.setItem(key("brand_revenue_tnd"), revenueTND.toString());
  }, [revenueTND]);

  useEffect(() => {
    localStorage.setItem(key("brand_paid_tier"), activePaidTier);
  }, [activePaidTier]);

  const handleApproveTag = async (id: string) => {
    const numericId = Number(id);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await updateApprovalMutation.mutateAsync({ postId: numericId, approvalStatus: "green" });
        await refetchTaggedPosts();
      } catch (err: any) {
        toast.error(err.message || "Failed to update tag status");
      }
    } else {
      setTaggedPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, lockType: "green" } : post))
      );
    }
    toast.success("Post tag approved! It is now animated on the app feed. 🌟");
  };

  const handleDeclineTag = async (id: string) => {
    const postObj = taggedPosts.find((p) => p.id === id);
    if (postObj) {
      localStorage.setItem(`styly_user_lock_${postObj.posterName}`, "black");
      toast.info(`Poster ${postObj.posterName} is now marked as black lock (permanently unapproved).`);
    }

    const numericId = Number(id);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await updateApprovalMutation.mutateAsync({ postId: numericId, approvalStatus: "red" });
        await refetchTaggedPosts();
      } catch (err: any) {
        toast.error(err.message || "Failed to update tag status");
      }
    } else {
      setTaggedPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, lockType: "red" } : post))
      );
    }
    toast.error("Post tag declined. Tag reverted to normal text.");
  };

  const handleSelectPost = (post: TaggedPost) => {
    setSelectedPost(post);
    setPostModalOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleUpgradeTier = (tierName: string, price: number) => {
    setActivePaidTier(tierName);
    toast.success(`Successfully activated ${tierName} standing for ${price} TND! 🎉`);
  };

  const currentLevel = getBrandLevel(revenueTND);

  // Helper function to verify feature unlocks based on paid tier activations
  const isFeatureUnlocked = (featureName: string): boolean => {
    const matchedLevel = getBrandLevel(revenueTND);
    
    // If it's a free tier feature, check if current level satisfies it
    const targetLevel = BRAND_LEVELS.find(l => l.name === featureName || l.features.includes(featureName));
    if (!targetLevel) return false;

    // Check if user has sufficient revenue for the target level
    if (revenueTND < targetLevel.minRevenue) return false;

    // If target level requires paid monthly fee, verify it's active
    if (!targetLevel.free && activePaidTier !== targetLevel.name) {
      // Allow fallback if they active a higher paid tier
      const targetIndex = BRAND_LEVELS.indexOf(targetLevel);
      const activePaidIndex = BRAND_LEVELS.findIndex(l => l.name === activePaidTier);
      if (activePaidIndex < targetIndex) {
        return false;
      }
    }

    return true;
  };

  const tabs: { key: MainTab; label: string }[] = [
    { key: "store", label: "Store" },
    { key: "orders", label: "Orders" },
    { key: "shipments", label: "Shipments" },
    { key: "followers", label: "Followers" },
    { key: "profits", label: "Profits" },
  ];

  if (!brandLoggedIn) {
    return (
      <BrandLoginScreen
        brandRegistered={brandRegistered}
        storedEmail={localStorage.getItem(key("brand_email")) || ""}
        onLoginSuccess={() => {
          localStorage.setItem(key("brand_logged_in"), "true");
          setBrandLoggedIn(true);
        }}
        onGoToProfile={() => setLocation("/profile")}
        onGoToFeed={() => setLocation("/feed")}
        userId={userId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/70 glassmorphic border-b border-border/50 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Brand profile avatar + name with dropdown */}
          <div className="relative flex items-center gap-3">
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 shadow-sm cursor-pointer hover:scale-105 transition-all"
            >
              <img
                src="/logo.png"
                alt="Brand"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23FF6B6B' rx='20'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='16' font-weight='bold'%3E${brandName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <p className="text-sm font-bold leading-none truncate max-w-[140px] mb-1">{brandName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{brandOwner}</p>
                </div>
                <BrandLevelBadge brandId={brandId} showDetails={false} />
                {currentLevel.name === "Stylista" && activePaidTier === "Stylista" ? (
                  <span className="text-[9px] font-black tracking-wider uppercase text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30 flex items-center gap-0.5">
                    <Star className="h-2 w-2 fill-yellow-500" /> Stylista
                  </span>
                ) : activePaidTier ? (
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{activePaidTier.toUpperCase()}</span>
                ) : null}
              </div>
            </div>

            {/* Switcher Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1A1A1A] border border-border/50 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    localStorage.setItem(key("active_profile_mode"), "user");
                    setLocation("/feed");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-accent/60 transition-colors text-left text-foreground"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Switch to User Account</span>
                </button>
                <div className="h-px bg-border/20 my-1.5" />
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Mark brand as logged-out for THIS user only
                    localStorage.setItem(key("brand_logged_in"), "false");
                    setBrandLoggedIn(false);
                    toast.success("Logged out of Brand Dashboard successfully");
                    setLocation("/feed");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-500/10 text-red-500 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout from Brand Dashboard</span>
                </button>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.key
                    ? "text-primary font-bold border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "store" && (
          <StoreTab
            products={products}
            setProducts={setProducts}
            taggedPosts={taggedPosts}
            onApproveTag={handleApproveTag}
            onDeclineTag={handleDeclineTag}
            onSelectPost={handleSelectPost}
            onSelectProduct={handleSelectProduct}
          />
        )}
        {activeTab === "orders" && (
          <OrdersTab orders={INITIAL_ORDERS} />
        )}
        {activeTab === "shipments" && (
          <ShipmentsTab brandId={brandId} />
        )}
        {activeTab === "followers" && (
          <FollowersTab />
        )}
        {activeTab === "profits" && (
          <ProfitsTab
            revenueTND={revenueTND}
            setRevenueTND={setRevenueTND}
            activePaidTier={activePaidTier}
            onUpgradeTier={handleUpgradeTier}
            taggedPosts={taggedPosts}
            onSelectPost={handleSelectPost}
            isFeatureUnlocked={isFeatureUnlocked}
            brandId={brandId}
          />
        )}
      </main>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onApprove={handleApproveTag}
        onDecline={handleDeclineTag}
        isFeatureUnlocked={isFeatureUnlocked}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
      />
    </div>
  );
}

// ─── Shipments Tab ────────────────────────────────────────────────────────────

const SHIPMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: "Pending",          color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  preparing:        { label: "Preparing",        color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  ready_for_pickup: { label: "Ready for Pickup", color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
  shipped:          { label: "Shipped",          color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" },
  delivered:        { label: "Delivered",        color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
  canceled:         { label: "Canceled",         color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
};

function ShipmentsTab({ brandId }: { brandId: number }) {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({ status: "", carrier: "", trackingNumber: "", estimatedDeliveryDate: "", notes: "" });

  const { data: shipments = [], isLoading, refetch } = trpc.delivery.brandListShipments.useQuery(
    { brandId },
    { enabled: brandId > 0 }
  );

  const updateMutation = trpc.delivery.updateShipment.useMutation({
    onSuccess: () => {
      toast.success("Shipment updated!");
      setSelected(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const openUpdate = (shipment: any) => {
    setSelected(shipment);
    setForm({
      status: shipment.status,
      carrier: shipment.carrier ?? "",
      trackingNumber: shipment.trackingNumber ?? "",
      estimatedDeliveryDate: shipment.estimatedDeliveryDate ?? "",
      notes: shipment.notes ?? "",
    });
  };

  const submitUpdate = () => {
    if (!selected) return;
    updateMutation.mutate({
      shipmentId: selected.id,
      status: form.status as any,
      carrier: form.carrier || undefined,
      trackingNumber: form.trackingNumber || undefined,
      estimatedDeliveryDate: form.estimatedDeliveryDate || undefined,
      notes: form.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const grouped = {
    active: shipments.filter(s => !["delivered", "canceled"].includes(s.status)),
    done:   shipments.filter(s => ["delivered", "canceled"].includes(s.status)),
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Shipments & Fulfillment
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your outgoing orders and delivery tracking</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border/30 text-xs font-semibold hover:bg-accent transit-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: shipments.length,                                    color: "text-foreground" },
          { label: "Active",   value: grouped.active.length,                               color: "text-blue-500" },
          { label: "Delivered", value: shipments.filter(s => s.status === "delivered").length, color: "text-emerald-500" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {shipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary/50" />
          </div>
          <div>
            <p className="font-bold text-lg">No shipments yet</p>
            <p className="text-sm text-muted-foreground mt-1">When customers order your products, shipments will appear here.</p>
          </div>
        </div>
      )}

      {/* Active shipments */}
      {grouped.active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Active ({grouped.active.length})</h3>
          {grouped.active.map(shipment => (
            <ShipmentCard key={shipment.id} shipment={shipment} onUpdate={openUpdate} />
          ))}
        </div>
      )}

      {/* Completed shipments */}
      {grouped.done.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Completed ({grouped.done.length})</h3>
          {grouped.done.map(shipment => (
            <ShipmentCard key={shipment.id} shipment={shipment} onUpdate={openUpdate} />
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-border/30 w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Update Shipment #{selected.id}
              </h3>
              <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transit-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(SHIPMENT_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Carrier</label>
                <input
                  type="text"
                  value={form.carrier}
                  onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))}
                  placeholder="e.g. DHL, Amana, CTM"
                  className="w-full h-10 px-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tracking Number</label>
                <input
                  type="text"
                  value={form.trackingNumber}
                  onChange={e => setForm(p => ({ ...p, trackingNumber: e.target.value }))}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full h-10 px-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={form.estimatedDeliveryDate}
                  onChange={e => setForm(p => ({ ...p, estimatedDeliveryDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any notes for this shipment..."
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>

            <button
              onClick={submitUpdate}
              disabled={updateMutation.isPending}
              className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-bold hover:opacity-95 transit-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {updateMutation.isPending ? (
                <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Updating…</>
              ) : (
                <><Check className="h-4 w-4" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShipmentCard({ shipment, onUpdate }: { shipment: any; onUpdate: (s: any) => void }) {
  const cfg = SHIPMENT_STATUS_CONFIG[shipment.status] ?? SHIPMENT_STATUS_CONFIG.pending;
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Order #{shipment.orderId} · Shipment #{shipment.id}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {shipment.shippingAddress}
            </p>
          </div>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      {shipment.items?.length > 0 && (
        <div className="space-y-1.5">
          {shipment.items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 text-xs bg-muted rounded-xl px-3 py-2">
              {item.productImage && (
                <img src={item.productImage} alt={item.productName} className="h-8 w-8 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.productName ?? "Product"}</p>
                <p className="text-muted-foreground">×{item.quantity}{item.size ? ` · ${item.size}` : ""}</p>
              </div>
              <p className="font-bold text-primary shrink-0">{(item.priceAtPurchase * item.quantity).toLocaleString()} TND</p>
            </div>
          ))}
        </div>
      )}

      {/* Tracking info */}
      {shipment.carrier && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
          <Truck className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-semibold">{shipment.carrier}</span>
          {shipment.trackingNumber && (
            <span className="font-mono ml-1 text-foreground">{shipment.trackingNumber}</span>
          )}
          {shipment.estimatedDeliveryDate && (
            <span className="ml-auto">ETA: {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {!["delivered", "canceled"].includes(shipment.status) && (
        <button
          onClick={() => onUpdate(shipment)}
          className="w-full h-9 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transit-all flex items-center justify-center gap-1.5"
        >
          <Truck className="h-3.5 w-3.5" /> Update Status & Tracking
        </button>
      )}
    </div>
  );
}

// ─── Brand Login Screen ───────────────────────────────────────────────────────


interface BrandLoginScreenProps {
  brandRegistered: boolean;
  storedEmail: string;
  userId: number;
  onLoginSuccess: () => void;
  onGoToProfile: () => void;
  onGoToFeed: () => void;
}

function BrandLoginScreen({
  brandRegistered,
  storedEmail,
  userId,
  onLoginSuccess,
  onGoToProfile,
  onGoToFeed,
}: BrandLoginScreenProps) {
  const [email, setEmail] = useState(storedEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(!brandRegistered);

  // Inline Registration States
  const [regFullName, setRegFullName] = useState("");
  const [regBrandName, setRegBrandName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const { theme, toggleTheme } = useTheme();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const registeredEmail = localStorage.getItem(`brand_email_${userId}`) || "";
      const registeredPassword = localStorage.getItem(`brand_password_${userId}`) || "";

      if (
        email.trim().toLowerCase() === registeredEmail.toLowerCase() &&
        password === registeredPassword
      ) {
        onLoginSuccess();
        toast.success("Welcome back to your Brand Dashboard! 🏪");
      } else {
        toast.error("Wrong email or password. Use the credentials from your brand registration.");
      }
      setLoading(false);
    }, 900);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regBrandName || !regEmail || !regPassword) {
      toast.error("Please fill in all fields to create your brand store.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem(`brand_registered_${userId}`, "true");
      localStorage.setItem(`brand_owner_name_${userId}`, regFullName);
      localStorage.setItem(`brand_name_${userId}`, regBrandName);
      localStorage.setItem(`brand_email_${userId}`, regEmail);
      localStorage.setItem(`brand_password_${userId}`, regPassword);
      localStorage.setItem(`brand_logged_in_${userId}`, "true");
      toast.success("Congrats! Your brand account is verified and ready! 🎉");
      onLoginSuccess();
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-tr from-neutral-50 via-neutral-100 to-red-50/20 dark:from-neutral-900 dark:via-neutral-950 dark:to-black text-neutral-900 dark:text-white px-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-300" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-300" />

      {/* Theme Toggle */}
      {toggleTheme && (
        <div className="absolute top-4 right-4 z-20 animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            onClick={toggleTheme}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-sm dark:shadow-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-orange-500" /> : <Moon className="h-5 w-5 text-neutral-700" />}
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[460px] z-10 animate-in fade-in zoom-in duration-500 my-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2.5 mb-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full overflow-hidden shadow-xl shadow-red-500/15 border border-white/10">
            <img src="/logo.png" alt="Styly Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] bg-clip-text text-transparent">
              Brand Portal
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">
              Manage your fashion collection & brand analytics
            </p>
          </div>
        </div>

        {/* Card Panel */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 relative overflow-hidden transition-colors duration-300 p-8 rounded-2xl w-full space-y-6">
          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Create Brand Account</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                  Register your official brand store to track sales, tags, and revenue.
                </p>
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Owner / Representative Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="pl-10 h-10 w-full bg-white/95 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 text-xs"
                  />
                </div>
              </div>

              {/* Brand Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Brand / Store Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maison Zara"
                    value={regBrandName}
                    onChange={(e) => setRegBrandName(e.target.value)}
                    className="pl-10 h-10 w-full bg-white/95 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 text-xs"
                  />
                </div>
              </div>

              {/* Brand Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Brand Business Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="contact@brand.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="pl-10 h-10 w-full bg-white/95 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 text-xs"
                  />
                </div>
              </div>

              {/* Brand Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-10 h-10 w-full bg-white/95 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Building2 className="h-4 w-4" />
                      <span>Register & Create Brand Account</span>
                    </>
                  )}
                </button>

                {brandRegistered && (
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="w-full text-center text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium"
                  >
                    Already have a brand account? Sign In
                  </button>
                )}

                <button
                  type="button"
                  onClick={onGoToFeed}
                  className="w-full h-10 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center font-medium text-xs"
                >
                  Back to Feed
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Welcome back</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                  Sign in using the credentials entered during brand registration.
                </p>
              </div>

              {/* Brand Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Brand Email</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="email@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-11 w-full bg-white/95 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-11 w-full bg-white/95 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Log In to Dashboard</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="w-full text-center text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium"
                >
                  Need to update or re-register your brand? Click here
                </button>

                <button
                  type="button"
                  onClick={onGoToFeed}
                  className="w-full h-11 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center font-medium text-xs"
                >
                  Back to Main App
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

