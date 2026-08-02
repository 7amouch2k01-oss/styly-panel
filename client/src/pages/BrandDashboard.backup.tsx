import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Search, Sun, Moon, Plus, Store, ShoppingBag, Users, DollarSign,
  CheckCircle2, Heart, UserCheck, ArrowUpRight, Lock, ChevronRight,
  Building2, Banknote, TrendingUp, Star, Package, Clock, RefreshCw,
  AlertCircle, X, Upload, ImagePlus, Tag, Layers, User as UserIcon, LogOut,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoreFilter = "in-stock" | "out-of-stock" | "pending";
type OrderFilter = "history" | "active" | "processing" | "return";
type MainTab = "store" | "orders" | "followers" | "profits";

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

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Queen Rania S Dress", price: 1200, category: "Dresses", description: "Elegant blue embroidered abaya dress.", status: "in-stock", image: "/product_dress_1.png", locked: true, stock: 3 },
  { id: 2, name: "Queen Rania", price: 1200, category: "Dresses", description: "Classic rania collection piece.", status: "in-stock", image: "/product_dress_1.png", locked: true, stock: 5 },
  { id: 3, name: "Suede Jacket", price: 480, category: "Jackets", description: "Premium brown suede jacket.", status: "in-stock", image: "/product_jacket.png", locked: false, stock: 8 },
  { id: 4, name: "Linen Co-ord Set", price: 320, category: "Sets", description: "Light linen two-piece set.", status: "in-stock", image: "/product_jacket.png", locked: false, stock: 12 },
  { id: 5, name: "Velvet Blazer", price: 650, category: "Jackets", description: "Rich velvet formal blazer.", status: "pending", image: "/product_jacket.png", locked: true, stock: 0 },
  { id: 6, name: "Silk Wrap Dress", price: 890, category: "Dresses", description: "Flowing silk wrap-style dress.", status: "pending", image: "/product_dress_1.png", locked: true, stock: 0 },
];

const ORDERS = [
  { id: "314000000000000002", status: "history", amount: 80, label: "init" },
  { id: "2512", status: "history", amount: 175, label: "Order history" },
  { id: "2198", status: "history", amount: 1400, label: "init" },
  { id: "1884", status: "history", amount: 0, label: "init" },
  { id: "942", status: "history", amount: 150, label: "Order history" },
  { id: "3310", status: "active", amount: 320, label: "init" },
  { id: "3290", status: "active", amount: 890, label: "init" },
  { id: "3105", status: "active", amount: 140, label: "init" },
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
                <DollarSign className="h-4 w-4 text-primary" /> Price ($) *
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

          {/* ── Status ── */}
          <div>
            <p className="text-sm font-semibold mb-2">Listing Status</p>
            <div className="flex gap-3">
              {(["in-stock", "pending"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all duration-150 ${
                    form.status === s
                      ? s === "in-stock"
                        ? "bg-green-500/10 border-green-500/60 text-green-600 dark:text-green-400"
                        : "bg-amber-500/10 border-amber-500/60 text-amber-600 dark:text-amber-400"
                      : "bg-muted border-border/50 hover:bg-accent"
                  }`}
                >
                  {s === "in-stock" ? "✅ In Stock" : "⏳ Pending Approval"}
                </button>
              ))}
            </div>
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
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Adding…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-6 opacity-60">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {subtitle && <p className="text-muted-foreground text-sm max-w-xs">{subtitle}</p>}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5">
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
          <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow">
            <Lock className="h-3.5 w-3.5 text-foreground" />
          </div>
        )}
        {product.status === "pending" && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
              Pending
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-primary font-bold text-sm">${product.price.toLocaleString()}</p>
          {product.category && (
            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{product.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: typeof ORDERS[0] }) {
  return (
    <div className="flex items-center gap-3 py-4 border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors px-1 rounded-lg">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <ShoppingBag className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">Order : {order.id}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{order.label}</p>
      </div>
      <p className="font-bold text-sm shrink-0">${order.amount.toLocaleString()}</p>
    </div>
  );
}

function FollowerCard({ follower }: { follower: typeof FOLLOWERS[0] }) {
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted group cursor-pointer border border-border/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
      <img
        src={follower.image}
        alt={follower.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3EPhoto%3C/text%3E%3C/svg%3E";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-1 mb-1.5">
          <p className="text-white font-semibold text-sm truncate">{follower.name}</p>
          {follower.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 fill-blue-400" />}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-white/90 text-xs">
            <Heart className="h-3 w-3 fill-white" /> {follower.likes}
          </span>
          <span className="flex items-center gap-1 text-white/90 text-xs">
            <UserCheck className="h-3 w-3" /> {follower.shares}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Store Tab ─────────────────────────────────────────────────────────────────

function StoreTab() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("brand_products");
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const [filter, setFilter] = useState<StoreFilter>("in-stock");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Persist products
  useEffect(() => {
    localStorage.setItem("brand_products", JSON.stringify(products));
  }, [products]);

  const filters: { key: StoreFilter; label: string }[] = [
    { key: "in-stock", label: "In stock" },
    { key: "out-of-stock", label: "Out of stock" },
    { key: "pending", label: "Pending Approval" },
  ];

  const filtered = products.filter((p) => {
    const matchesFilter =
      filter === "out-of-stock"
        ? p.stock === 0 && p.status === "in-stock"
        : filter === "pending"
        ? p.status === "pending"
        : p.status === "in-stock" && p.stock > 0;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    // If the new item status is "in-stock" switch to show it
    setFilter(product.status === "pending" ? "pending" : "in-stock");
  };

  return (
    <>
      <div className="space-y-5">
        {/* Search + Store icon */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your outfits"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-full bg-muted border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <button className="h-12 w-12 rounded-full bg-muted border border-border/40 flex items-center justify-center hover:bg-accent transition-colors">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Add new item */}
        <button
          id="add-new-item-btn"
          onClick={() => setModalOpen(true)}
          className="w-full h-12 rounded-full border-2 border-border/60 font-semibold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Add new item
        </button>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                filter === f.key
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-transparent text-foreground border-border/60 hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Product count */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Product Grid / Empty State */}
        {filtered.length === 0 ? (
          filter === "out-of-stock" ? (
            <EmptyState
              icon={<div className="text-8xl select-none">📦</div>}
              title="None of your items is out of stock"
              subtitle="Once one of your items stock level reaches 0, it gets into this list."
            />
          ) : filter === "pending" ? (
            <EmptyState
              icon={<div className="text-8xl select-none">👗</div>}
              title="No items pending approval"
              subtitle="Items awaiting review will appear here."
            />
          ) : (
            <EmptyState
              icon={<div className="text-8xl select-none">🛍️</div>}
              title="No items in stock"
              subtitle='Click "Add new item" to list your first product.'
            />
          )
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <AddItemModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddProduct} />
    </>
  );
}

// ─── Orders Tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [filter, setFilter] = useState<OrderFilter>("history");

  const orderFilters: { key: OrderFilter; label: string; dot: string }[] = [
    { key: "history", label: "Order history", dot: "bg-muted-foreground" },
    { key: "active", label: "Active", dot: "bg-green-500" },
    { key: "processing", label: "Processing", dot: "bg-amber-500" },
    { key: "return", label: "Return", dot: "bg-red-500" },
  ];

  const displayOrders = filter === "history" ? ORDERS : ORDERS.filter((o) => o.status === filter);

  const emptyStates: Record<string, { emoji: string; title: string; subtitle: string }> = {
    processing: { emoji: "📦", title: "You don't have orders under processing", subtitle: "Make some orders to fill this list" },
    return: { emoji: "😞", title: "You dont have returned orders", subtitle: "" },
    active: { emoji: "✨", title: "No active orders right now", subtitle: "Active orders will appear here" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border/50">
        <div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            Total cashback <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground text-[9px] flex items-center justify-center">i</span>
          </p>
          <p className="text-3xl font-bold mt-1">$0.00</p>
        </div>
        <button className="px-4 py-2 rounded-full border border-border/60 text-sm font-medium hover:bg-accent transition-colors flex items-center gap-1.5">
          Shop more outfits <ChevronRight className="h-3.5 w-3.5" />
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
        <div className="rounded-2xl bg-card border border-border/50 p-4">
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
          {filtered.map((f) => <FollowerCard key={f.id} follower={f} />)}
        </div>
      )}
    </div>
  );
}

// ─── Profits Tab ───────────────────────────────────────────────────────────────

function ProfitsTab() {
  const stats = [
    { label: "Total Revenue", value: "$0.00", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "This Month", value: "$0.00", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pending Payout", value: "$0.00", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total Orders", value: "5", icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              Total sales <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground text-[9px] flex items-center justify-center">i</span>
            </p>
            <p className="text-4xl font-bold mt-1.5">$0.00</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 h-12 rounded-full border border-border/60 text-sm font-semibold hover:bg-accent transition-all duration-200 flex items-center justify-center gap-2">
            <Banknote className="h-4 w-4" /> Edit Bank
          </button>
          <button className="flex-1 h-12 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
            <DollarSign className="h-4 w-4" /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
            <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border border-border/50 bg-card">
        <div className="relative h-48 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-end p-4">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary to-orange-400" />
          <div className="flex items-center gap-2 relative z-10">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Styly</p>
              <p className="text-white/70 text-xs">@styly_brand</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="font-semibold text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> That type of content
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Start tagging products in your posts to earn commission on every sale made through your store.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BrandDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<MainTab>("store");
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();

  // Read persisted brand info
  const brandName = localStorage.getItem("brand_name") || "My Style Store";
  const brandOwner = localStorage.getItem("brand_owner_name") || "Brand Owner";

  const tabs: { key: MainTab; label: string }[] = [
    { key: "store", label: "Store" },
    { key: "orders", label: "Orders" },
    { key: "followers", label: "Followers" },
    { key: "profits", label: "Profits" },
  ];

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
              <p className="text-sm font-bold leading-none truncate max-w-[140px]">{brandName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{brandOwner}</p>
            </div>

            {/* Switcher Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1A1A1A] border border-border/50 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    localStorage.setItem("active_profile_mode", "user");
                    setLocation("/feed");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-accent/60 transition-colors text-left text-foreground"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Switch to User Account</span>
                </button>
                <div className="h-px bg-border/20 my-1.5" />
                <button
                  onClick={async () => {
                    setShowDropdown(false);
                    try {
                      await logout();
                      toast.success("Logged out successfully");
                      setLocation("/auth");
                    } catch (e: any) {
                      toast.error("Failed to log out: " + e.message);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-500/10 text-red-500 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
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
        {activeTab === "store" && <StoreTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "followers" && <FollowersTab />}
        {activeTab === "profits" && <ProfitsTab />}
      </main>
    </div>
  );
}
