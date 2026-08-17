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
  Truck, MapPin, Phone, ExternalLink, Bell, BellRing
} from "lucide-react";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
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
  lockType: "black" | "green" | "red" | "pending" | "grey"; // black/pending: pending, green: approved, red: declined
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


// No hardcoded followers — real follower data comes from the users DB


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
                  <h3 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                    {post.posterName}
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">Verified Creator</p>
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
  brandId: number;
}

function AddItemModal({ open, onClose, onAdd, brandId }: AddItemModalProps) {
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

  const createMutation = trpc.devices.brandCreate.useMutation({
    onSuccess: (res) => {
      onAdd({
        id: res.product.id,
        name: res.product.name,
        price: res.product.price,
        category: res.product.category,
        description: res.product.description || "",
        status: res.product.stock > 0 ? "in-stock" : "pending",
        image: res.product.imageUrl || "/product_jacket.png",
        locked: false,
        stock: res.product.stock,
      });
      toast.success(`"${res.product.name}" added to your store! 🎉`);
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create product");
      setIsSaving(false);
    }
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

    createMutation.mutate({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      stock: form.stock === "" ? 1 : Number(form.stock),
      description: form.description.trim() || undefined,
      brandId,
      imageUrl: imagePreview || "/product_jacket.png",
    });
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
function LockIcon({ type }: { type: "green" | "red" | "black" | "pending" | "grey" }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-500 text-white dark:bg-green-600 shadow border border-green-400/20",
    red: "bg-red-500 text-white dark:bg-red-600 shadow border border-red-400/20",
    black: "bg-black text-white dark:bg-neutral-800 shadow border border-neutral-700/20",
    pending: "bg-amber-500 text-white dark:bg-amber-600 shadow border border-amber-400/20",
    grey: "bg-neutral-400 text-white dark:bg-neutral-600 shadow border border-neutral-300/20",
  };

  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorMap[type] ?? colorMap.black} transition-transform hover:scale-110`}>
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
  const canDownloadFacture = true;

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all px-3 rounded-2xl">
      <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0 cursor-pointer border border-border/50" onClick={() => onSelect(post)}>
        <img src={post.postImage} alt="Post content" className="w-full h-full object-cover hover:scale-105 transition-transform" />
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(post)}>
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm text-foreground truncate">{post.posterName}</p>
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground truncate">{post.taggedProducts.join(", ")}</p>
      </div>

      <div className="text-right shrink-0 mr-2">
        <p className="font-mono font-bold text-sm text-foreground">+{post.revenue.toLocaleString()} TND</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{post.interactions.toLocaleString()} interactions</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); downloadFactureDoc(post); }}
        className="h-8 w-8 rounded-xl flex items-center justify-center border border-border/50 hover:bg-primary hover:text-white transition-all text-muted-foreground"
        title="Download Facture (DOCX)"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Store Tab ─────────────────────────────────────────────────────────────────

interface StoreTabProps {
  products: Product[];
  onProductAdded: () => void;
  taggedPosts: TaggedPost[];
  onApproveTag: (id: string) => void;
  onDeclineTag: (id: string) => void;
  onSelectPost: (post: TaggedPost) => void;
  onSelectProduct: (product: Product) => void;
  brandId: number;
}

function StoreTab({ products, onProductAdded, taggedPosts, onApproveTag, onDeclineTag, onSelectPost, onSelectProduct, brandId }: StoreTabProps) {
  const [filter, setFilter] = useState<StoreFilter>("in-stock");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [showProducts, setShowProducts] = useState(true);

  // Filters computed reactively from state/props
  const activeProducts = products.filter(p => p.status === "in-stock" && p.stock > 0).length;
  const outOfStockProducts = products.filter(p => p.stock === 0 && p.status === "in-stock").length;

  const pendingTags = taggedPosts.filter(p => p.lockType === "black" || p.lockType === "pending").length;
  const approvedTags = taggedPosts.filter(p => p.lockType === "green").length;
  const declinedTags = taggedPosts.filter(p => p.lockType === "red").length;

  const filters: { key: StoreFilter; label: string; count?: number }[] = [
    { key: "in-stock", label: "In Stock Outfits", count: activeProducts },
    { key: "out-of-stock", label: "Sold Out Outfits", count: outOfStockProducts },
    { key: "pending-tags", label: "Pending Tag Requests", count: pendingTags },
    { key: "approved-posts", label: "Approved Tags Feed", count: approvedTags },
    { key: "unapproved-posts", label: "Declined Tags Feed", count: declinedTags },
  ];

  const filteredProducts = products.filter((p) => {
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
        ? post.lockType === "black" || post.lockType === "pending"
        : filter === "approved-posts"
        ? post.lockType === "green"
        : filter === "unapproved-posts"
        ? post.lockType === "red"
        : false;
    const matchesSearch = post.posterName.toLowerCase().includes(search.toLowerCase()) || 
                          post.taggedProducts.some(p => p.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleAddProduct = () => {
    onProductAdded();
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
          <Button
            onClick={() => setModalOpen(true)}
            className="h-12 px-6 rounded-full font-bold flex items-center gap-1.5 shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="h-4 w-4" /> Add Outfit
          </Button>
        </div>

        {/* Tab filters switcher */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setShowProducts(f.key === "in-stock" || f.key === "out-of-stock");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
                  filter === f.key
                    ? "bg-foreground text-background border-foreground shadow-sm font-semibold"
                    : "bg-transparent text-foreground border-border/60 hover:bg-accent"
                }`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
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

      <AddItemModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddProduct} brandId={brandId} />
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

  // Future: fetch real followers from DB with trpc.brands.getFollowers.useQuery
  const followers: any[] = [];
  const filtered = followers.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

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

      <EmptyState
        icon={<Users className="h-20 w-20 text-muted-foreground/40" />}
        title="No followers yet"
        subtitle="Users who follow your brand will appear here. Get discovered by posting products and having your brand tags approved."
      />
    </div>
  );
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

// Note: Monthly revenue chart data now comes from trpc.delivery.brandMonthlyRevenue (live DB)

// ─── Commission Calculator ────────────────────────────────────────────────────

function CommissionCalculator({ commissionRate }: { commissionRate: number }) {
  const [extraPosts, setExtraPosts] = useState(5);
  const avgRevenuePerPost = 3200; // TND
  const estimatedExtra = extraPosts * avgRevenuePerPost;
  const commissionEarned = estimatedExtra * (commissionRate / 100);

  return (
    <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/40 text-foreground">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Commission & Yield Estimator</h3>
          <p className="text-[11px] text-muted-foreground">Forecast projected brand revenue from verified creator tagged looks</p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-muted-foreground">Monthly Active Creator Outfits</span>
          <span className="text-foreground font-black text-base font-mono">{extraPosts} Posts</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={extraPosts}
          onChange={(e) => setExtraPosts(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-primary cursor-pointer bg-muted"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>1 post</span>
          <span>30 posts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Projected Gross Sales</p>
          <p className="text-base font-black text-foreground mt-1 font-mono">{estimatedExtra.toLocaleString()} TND</p>
        </div>
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Platform Take ({commissionRate}%)</p>
          <p className="text-base font-black text-primary mt-1 font-mono">+{commissionEarned.toLocaleString()} TND</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Estimated from average {avgRevenuePerPost.toLocaleString()} TND checkout volume per creator outfit at your current {commissionRate}% commission tier.
      </p>
    </div>
  );
}

// ─── Profits Tab (Progression and Level Up CTAs) ─────────────────────────────

interface ProfitsTabProps {
  revenueTND: number;
  setRevenueTND: React.Dispatch<React.SetStateAction<number | null>>;
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
  // Live monthly revenue from real shipments
  const { data: monthlyChartData = [] } = trpc.delivery.brandMonthlyRevenue.useQuery({ brandId });

  // Real stats derived from commissions and shipments
  const pendingPayoutTND = commissions
    .filter((c: any) => c.status === "pending" || c.status === "approved")
    .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const totalRealOrders = monthlyChartData.reduce((sum: any, m: any) => sum + (m.orders || 0), 0);
  const totalCompletedGross = monthlyChartData.reduce((sum: any, m: any) => sum + (m.revenue || 0), 0);

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

  const approvedPosts = taggedPosts.filter((post) => post.lockType === "green");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Brand Level Standing Progression Card */}
      <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Partner Standing & Tier</span>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {currentLevel.name} Partner
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                Active Tier
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">Platform commission rates and analytics privileges scale automatically.</p>
          </div>

          <div className="bg-muted/40 border border-border/40 px-5 py-3 rounded-2xl shrink-0 text-center md:text-right">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Platform Commission</span>
            <span className="text-2xl font-black text-foreground">{currentLevel.commissionRate}%</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Applied per checkout sale</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Volume: {revenueTND.toLocaleString()} TND</span>
            {nextLevel ? (
              <span className="text-foreground font-bold">Next: {nextLevel.name} ({nextLevel.minRevenue.toLocaleString()} TND)</span>
            ) : (
              <span className="text-primary flex items-center gap-1 font-bold"><Sparkles className="h-3 w-3" /> Highest Partner Tier</span>
            )}
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/30 p-0.5">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Feature Unlocks Checklist */}
        <div className="mt-5 pt-4 border-t border-border/40">
          <p className="text-xs font-bold text-foreground mb-2.5 uppercase tracking-wider">Included Operational Privileges:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentLevel.features.map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Full Analytics Access & Facture Invoicing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brand XP Level Badge */}
      <BrandLevelBadge brandId={brandId} showDetails={true} />

      {/* Primary Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all duration-200">
          <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center mb-3 text-foreground border border-border/40">
            <DollarSign className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-foreground">{revenueTND.toLocaleString()} TND</p>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">Total Revenue Volume</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all duration-200">
          <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center mb-3 text-foreground border border-border/40">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-foreground">{(revenueTND * 0.14).toFixed(0)} TND</p>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">Estimated Monthly Run-Rate</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all duration-200">
          <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center mb-3 text-foreground border border-border/40">
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-foreground">{pendingPayoutTND.toFixed(2)} TND</p>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">Pending Influencer Payout</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all duration-200">
          <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center mb-3 text-foreground border border-border/40">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalRealOrders}</p>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">Total Fulfilled Orders</p>
        </div>
      </div>

      {/* Commission Estimator Calculator */}
      <CommissionCalculator commissionRate={currentLevel.commissionRate} />

      {/* Advanced Charts Section — Always Fully Unlocked */}
      <div className="bg-card border border-border/60 p-6 rounded-3xl space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Sales Performance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time revenue aggregation from completed orders</p>
          </div>
          <span className="text-[10px] text-muted-foreground font-bold bg-muted/60 border border-border/40 px-3 py-1 rounded-full uppercase tracking-wider">Live Synced</span>
        </div>

        {/* Revenue Area Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No revenue data recorded yet.
              </div>
            ) : (
              <AreaChart data={monthlyChartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value.toLocaleString()} TND`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Orders Bar Chart */}
        <div className="pt-3 border-t border-border/40">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Order Volume Trend</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              {monthlyChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No orders recorded yet.
                </div>
              ) : (
                <BarChart data={monthlyChartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}
                    formatter={(value: number) => [value, 'Orders']}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.9} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Influencer Referral Revenue Share Table — Real Live Data */}
      <div className="bg-card border border-border/60 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Influencer Referral Performance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top performing fashion creators generating sales for your brand</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground font-mono">Commission Share</span>
        </div>

        {(() => {
          // Group approved posts by creator
          const creatorMap = new Map<string, { name: string; avatar: string; orders: number; revenue: number }>();
          approvedPosts.forEach((p) => {
            const existing = creatorMap.get(p.posterName) || { name: p.posterName, avatar: p.posterAvatar, orders: 0, revenue: 0 };
            existing.orders += p.orders || 0;
            existing.revenue += p.revenue || 0;
            creatorMap.set(p.posterName, existing);
          });
          const creators = Array.from(creatorMap.values()).sort((a, b) => b.revenue - a.revenue);

          if (creators.length === 0) {
            return (
              <div className="p-8 bg-muted/20 border border-border/40 rounded-2xl text-center">
                <p className="text-xs text-muted-foreground">No creator referral orders recorded yet. As influencers post looks tagging your brand, their conversion performance will appear here.</p>
              </div>
            );
          }

          return (
            <div className="text-xs text-muted-foreground divide-y divide-border/30">
              <div className="flex justify-between py-2.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                <span>Influencer Name</span>
                <span>Orders Driven</span>
                <span>Attributed Revenue</span>
              </div>
              {creators.map((c) => (
                <div key={c.name} className="flex justify-between py-3 items-center text-foreground font-semibold">
                  <span className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] overflow-hidden">
                      {c.avatar ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0).toUpperCase()}
                    </div>
                    {c.name}
                  </span>
                  <span className="font-mono text-muted-foreground">{c.orders} orders</span>
                  <span className="font-mono font-bold text-foreground">{c.revenue.toLocaleString()} TND</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Approved Tagged Posts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Verified Tagged Outfit Looks
          </h3>
          <span className="text-xs text-muted-foreground font-mono">{approvedPosts.length} posts live</span>
        </div>

        {approvedPosts.length === 0 ? (
          <div className="p-8 bg-card border border-border/60 rounded-3xl text-center">
            <p className="text-xs text-muted-foreground">No approved tagged posts found. Approve incoming look requests in the Store tab.</p>
          </div>
        ) : (
          <div className="bg-card border border-border/60 rounded-3xl p-4 space-y-1 shadow-sm">
            {approvedPosts.map((post) => (
              <TaggedPostRow key={post.id} post={post} isFeatureUnlocked={isFeatureUnlocked} onSelect={onSelectPost} />
            ))}
          </div>
        )}
      </div>

      {/* Brand Payout Ledger Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" /> Brand Commission Payout Ledger
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and disburse verified creator commission requests</p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{commissions.length} requests</span>
        </div>

        {commissions.length === 0 ? (
          <div className="p-8 bg-card border border-border/60 rounded-3xl text-center">
            <p className="text-xs text-muted-foreground">No influencer commission requests logged yet.</p>
          </div>
        ) : (
          <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-3 shadow-sm divide-y divide-border/20">
            {commissions.map((comm: any, idx: number) => (
              <div key={comm.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${idx > 0 ? "pt-3" : ""}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">Creator #{comm.userId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      comm.status === "pending" ? "border-amber-500/30 bg-amber-500/10 text-amber-500" :
                      comm.status === "approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" :
                      comm.status === "paid" ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}>
                      {comm.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comm.description || "Referral commission request"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{new Date(comm.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <span className="font-black text-sm text-foreground font-mono">{Number(comm.amount).toFixed(2)} TND</span>
                  <div className="flex items-center gap-2">
                    {comm.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateCommission(comm.id, "approved")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateCommission(comm.id, "rejected")}
                          className="px-3 py-1.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {comm.status === "approved" && (
                      <button
                        onClick={() => handleUpdateCommission(comm.id, "paid")}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-sm"
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

function BrandDashboardInner({ userId, appUser }: { userId: number; appUser: any }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<MainTab>("store");
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // ─── Query brand store registration from backend ───
  const { data: brandStore, isLoading: brandStoreLoading, refetch: refetchBrandStore } = trpc.brandStore.get.useQuery();

  // Register brand store mutation
  const registerMutation = trpc.brandStore.register.useMutation({
    onSuccess: () => {
      toast.success("Brand store application submitted! Pending admin approval. 🎉");
      refetchBrandStore();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register brand store");
    }
  });

  const handleRegister = async (data: { brandName: string; ownerName: string; email: string; phone: string }) => {
    await registerMutation.mutateAsync(data);
  };

  // Resolve brand identity if store is approved
  const brandId = brandStore && brandStore.status === "approved" ? brandStore.brandId : null;
  const brandName = brandStore?.brandName || "My Style Store";
  const brandOwner = brandStore?.ownerName || appUser?.name || "Brand Owner";

  // ─── Live Database Queries for Approved Brands ───
  const { data: dbDevices = [], refetch: refetchDevices } = trpc.devices.list.useQuery(undefined, { enabled: !!brandId });
  const { data: dbTaggedPosts = [], refetch: refetchTaggedPosts } = trpc.posts.getBrandTaggedPosts.useQuery(
    { brandId: brandId! },
    { enabled: !!brandId, refetchInterval: 10000 }
  );
  const { data: shipments = [], refetch: refetchShipments } = trpc.delivery.brandListShipments.useQuery(
    { brandId: brandId! },
    { enabled: !!brandId, refetchInterval: 15000 }
  );

  const notificationsQuery = trpc.notifications.brandNotifications.useQuery(
    { brandId: brandId! },
    { enabled: !!brandId, refetchInterval: 15000 }
  );
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => notificationsQuery.refetch()
  });
  const brandNotifs: any[] = notificationsQuery.data?.items || [];
  const unreadNotifs = brandNotifs.filter(n => !n.read);
  const handleMarkAllRead = () => {
    if (unreadNotifs.length > 0) {
      markReadMutation.mutate({ ids: unreadNotifs.map(n => n.id) });
    }
  };

  const updateApprovalMutation = trpc.posts.updateApprovalStatus.useMutation();

  // Map backend devices array to expected Product UI interface
  const products: Product[] = dbDevices
    .filter((d: any) => d.brandId === brandId)
    .map((d: any) => ({
      id: d.id,
      name: d.name,
      price: d.price,
      category: d.category,
      description: d.description || "No description available.",
      status: d.stock > 0 ? "in-stock" : "pending",
      image: d.imageUrl || "/product_jacket.png",
      locked: false,
      stock: d.stock,
    }));

  const taggedPosts: TaggedPost[] = dbTaggedPosts || [];

  // Map backend shipments to Order UI interface for Sales/Orders tab
  const orders = shipments.map((s: any) => {
    const status = (s.status === "delivered" || s.status === "canceled") ? "history" : "active";
    const label = s.status.charAt(0).toUpperCase() + s.status.slice(1).replace(/_/g, " ");
    const amount = (s.items || []).reduce((acc: number, curr: any) => acc + (curr.priceAtPurchase * curr.quantity), 0);
    return {
      id: `SHP-${s.id}`,
      status,
      amount: amount || 150, // default fallback
      label,
      date: new Date(s.createdAt).toLocaleDateString(),
    };
  });

  const [selectedPost, setSelectedPost] = useState<TaggedPost | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Profit standing tier (mock/localStorage for tier features)
  const [activePaidTier, setActivePaidTier] = useState<string>(() => {
    try {
      return localStorage.getItem(`brand_paid_tier_${userId}`) || "";
    } catch {
      return "";
    }
  });

  const revenueTND = orders.reduce((acc, curr) => acc + (curr.label !== "Canceled" ? curr.amount : 0), 0);
  const [simulatedRevenue, setSimulatedRevenue] = useState<number | null>(null);

  const handleUpgradeTier = (tierName: string, price: number) => {
    setActivePaidTier(tierName);
    localStorage.setItem(`brand_paid_tier_${userId}`, tierName);
    toast.success(`Successfully activated ${tierName} standing for ${price} TND! 🎉`);
  };

  const handleApproveTag = async (id: string) => {
    const numericId = Number(id);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await updateApprovalMutation.mutateAsync({ postId: numericId, approvalStatus: "green" });
        await refetchTaggedPosts();
        toast.success("Post tag approved! It is now animated on the app feed. 🌟");
      } catch (err: any) {
        toast.error(err.message || "Failed to update tag status");
      }
    }
  };

  const handleDeclineTag = async (id: string) => {
    const numericId = Number(id);
    if (!isNaN(numericId) && numericId > 0) {
      try {
        await updateApprovalMutation.mutateAsync({ postId: numericId, approvalStatus: "red" });
        await refetchTaggedPosts();
        toast.error("Post tag declined. Tag reverted to normal text.");
      } catch (err: any) {
        toast.error(err.message || "Failed to update tag status");
      }
    }
  };

  const handleSelectPost = (post: TaggedPost) => {
    setSelectedPost(post);
    setPostModalOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const currentLevel = getBrandLevel(revenueTND);

  // Verify feature unlocks based on level threshold or active paid subscriptions
  const isFeatureUnlocked = (featureName: string): boolean => {
    const targetLevel = BRAND_LEVELS.find(l => l.name === featureName || l.features.includes(featureName));
    if (!targetLevel) return false;
    if (revenueTND < targetLevel.minRevenue) return false;
    if (!targetLevel.free && activePaidTier !== targetLevel.name) {
      const targetIndex = BRAND_LEVELS.indexOf(targetLevel);
      const activePaidIndex = BRAND_LEVELS.findIndex(l => l.name === activePaidTier);
      if (activePaidIndex < targetIndex) return false;
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

  // ─── RENDER LOADING STATE ───
  if (brandStoreLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Syncing brand store profile…</p>
        </div>
      </div>
    );
  }

  // ─── PORTAL REGISTER GATE ───
  if (!brandStore) {
    return (
      <BrandLoginScreen
        brandRegistered={false}
        storedEmail=""
        userId={userId}
        onLoginSuccess={() => refetchBrandStore()}
        onGoToProfile={() => setLocation("/profile")}
        onGoToFeed={() => setLocation("/feed")}
        onRegister={handleRegister}
      />
    );
  }

  // ─── PENDING APPROVAL GATE ───
  if (brandStore.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0C0F17] text-white px-4 relative overflow-hidden font-sans gap-6">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-[#121624] -z-10" />
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-amber-500/10 items-center justify-center border border-amber-500/30 text-amber-500 mb-2">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Verification Pending</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Your brand store application for <span className="text-white font-bold">"{brandStore.brandName}"</span> is currently pending administrator verification.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-500/90 leading-relaxed">
            We confirm all registrations manually to keep the Styly community secure from fake brands.
          </div>
          <Button
            variant="outline"
            onClick={() => { refetchBrandStore(); toast.info("Refreshed application status!"); }}
            className="w-full h-11 border-white/10 text-neutral-300 hover:bg-white/5 font-semibold"
          >
            Refresh Status
          </Button>
          <button
            onClick={() => setLocation("/")}
            className="w-full h-11 rounded-full border border-white/10 text-neutral-300 font-bold text-xs hover:bg-white/5 transition-all"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  // ─── REJECTED GATE ───
  if (brandStore.status === "rejected") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0C0F17] text-white px-4 relative overflow-hidden font-sans gap-6">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-[#121624] -z-10" />
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-red-500/10 items-center justify-center border border-red-500/30 text-red-500 mb-2">
            <X className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-red-400">Application Rejected</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Your brand store registration application was declined. Please verify your details or submit a support claim.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="w-full h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm hover:shadow-lg transition-all"
          >
            Back to Feed
          </button>
        </div>
      </div>
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
                {currentLevel.name && (
                  <span className="text-[10px] font-bold text-foreground bg-muted/60 border border-border/50 px-2 py-0.5 rounded-full">
                    {currentLevel.name.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Switcher Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1A1A1A] border border-border/50 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setShowDropdown(false);
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
                    logout();
                    toast.success("Logged out of Brand Dashboard successfully");
                    setLocation("/");
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifPanel(true)}
              className="relative h-9 w-9 flex items-center justify-center hover:bg-accent rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                  {unreadNotifs.length}
                </span>
              )}
            </button>
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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "store" && (
          <StoreTab
            products={products}
            onProductAdded={refetchDevices}
            taggedPosts={taggedPosts}
            onApproveTag={handleApproveTag}
            onDeclineTag={handleDeclineTag}
            onSelectPost={handleSelectPost}
            onSelectProduct={handleSelectProduct}
            brandId={brandId || 1}
          />
        )}
        {activeTab === "orders" && (
          <OrdersTab orders={orders} />
        )}
        {activeTab === "shipments" && (
          <ShipmentsTab brandId={brandId || 1} />
        )}
        {activeTab === "followers" && (
          <FollowersTab />
        )}
        {activeTab === "profits" && (
          <ProfitsTab
            revenueTND={simulatedRevenue ?? revenueTND}
            setRevenueTND={setSimulatedRevenue}
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

      {/* Notifications Panel */}
      {showNotifPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotifPanel(false)} />
          <div className="relative w-full max-w-sm h-full bg-background border-l border-border/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadNotifs.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>
                )}
                <button onClick={() => setShowNotifPanel(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {brandNotifs.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm mt-10">No notifications yet.</div>
              ) : (
                brandNotifs.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl border ${!n.read ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/20'}`}>
                    <div className="flex gap-2">
                      <span className="text-xl shrink-0">{n.type === "new_order" ? "📦" : n.type === "brand_approval" ? "🏷️" : "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{n.title || n.message}</p>
                        {n.title && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.createdAt || n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
  const updateMutation = trpc.delivery.updateShipment.useMutation();
  const utils = trpc.useUtils();

  const handleQuickUpdate = (newStatus: string) => {
    updateMutation.mutate({ shipmentId: shipment.id, status: newStatus as any }, {
      onSuccess: () => {
        toast.success(`Shipment updated to ${newStatus}`);
        utils.delivery.brandListShipments.invalidate();
      }
    });
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-4 space-y-3">
      {/* Customer Info Card */}
      <div className="p-3 bg-muted/50 rounded-xl border border-border/30 text-xs">
         <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1"><UserIcon className="h-3.5 w-3.5" /> Customer Details</p>
         <p className="text-muted-foreground"><span className="font-medium text-foreground">Name:</span> {shipment.deliveryAddress?.split(',')[0] || "Customer Name"}</p>
         <p className="text-muted-foreground"><span className="font-medium text-foreground">Phone:</span> {shipment.order?.phone || "N/A"}</p>
         <p className="text-muted-foreground"><span className="font-medium text-foreground">Address:</span> {shipment.deliveryAddress || shipment.shippingAddress}</p>
      </div>

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
        <div className="flex flex-col gap-2 mt-2">
          {shipment.status === 'pending' && (
            <button onClick={() => handleQuickUpdate('preparing')} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all">
              Prepare Order
            </button>
          )}
          {shipment.status === 'preparing' && (
            <button onClick={() => handleQuickUpdate('ready_for_pickup')} className="w-full bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all">
              Ready for Pickup
            </button>
          )}
          <button
            onClick={() => onUpdate(shipment)}
            className="w-full h-9 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transit-all flex items-center justify-center gap-1.5"
          >
            <Truck className="h-3.5 w-3.5" /> Update Status & Tracking
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Brand Registration Portal Screen ──────────────────────────────────────────

interface BrandLoginScreenProps {
  brandRegistered: boolean;
  storedEmail: string;
  userId: number;
  onLoginSuccess: () => void;
  onGoToProfile: () => void;
  onGoToFeed: () => void;
  onRegister: (data: { brandName: string; ownerName: string; email: string; phone: string }) => Promise<void>;
}

function BrandLoginScreen({
  userId,
  onLoginSuccess,
  onGoToProfile,
  onGoToFeed,
  onRegister,
}: BrandLoginScreenProps) {
  const [loading, setLoading] = useState(false);

  // Registration States
  const [regFullName, setRegFullName] = useState("");
  const [regBrandName, setRegBrandName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const { theme, toggleTheme } = useTheme();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regBrandName || !regEmail || !regPhone) {
      toast.error("Please fill in all fields to submit your brand registration.");
      return;
    }
    setLoading(true);
    try {
      await onRegister({
        brandName: regBrandName.trim(),
        ownerName: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
      });
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit brand application");
    } finally {
      setLoading(false);
    }
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
              Brand Store Registry
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">
              Register your official storefront to list items and track sales
            </p>
          </div>
        </div>

        {/* Card Panel */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 relative overflow-hidden transition-colors duration-300 p-8 rounded-2xl w-full space-y-6">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Store Application</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                Provide business details. Applications are approved manually by administration.
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

            {/* Brand Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Contact Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +216 99 999 999"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
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
                    <span>Submit Store Application</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onGoToFeed}
                className="w-full h-10 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all text-center font-medium text-xs"
              >
                Back to Feed
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


