import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { DUMMY_POSTS, Post } from "./HomeFeed";
import { trpc } from "@/lib/trpc";
import { GradePanel, GradeBadge } from "@/components/GradePanel";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Building,
  User,
  ShoppingBag,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  Plus,
  Heart,
  Upload,
  Sparkles,
  CheckCircle,
  FileText,
  AlertCircle,
  LogOut,
  Building2,
  Trash2,
  X,
  Shirt,
  Image as ImageIcon,
  Tag,
  TrendingUp,
  Star,
  Award,
  Lock,
  HelpCircle,
  Shield,
  Edit3,
  Camera,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// ─── Interfaces & Types ──────────────────────────────────────────────────────

type ProfileTab = "outfits" | "orders" | "followers" | "profits" | "settings";
type OutfitsSubTab = "created" | "wardrobe" | "loved" | "stylista";

interface BrandRegistration {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  ownerIdFile: string;
  brandName: string;
  password?: string;
}

const LEVELS = [
  { name: "Starter", emoji: "🌱", minXP: 0, commission: 1, color: "#94a3b8" },
  { name: "Influencer", emoji: "✨", minXP: 200, commission: 2, color: "#60a5fa" },
  { name: "Ambassador", emoji: "🔥", minXP: 600, commission: 3, color: "#f97316" },
  { name: "Expert", emoji: "💎", minXP: 1500, commission: 4, color: "#a78bfa" },
  { name: "Elite Creator", emoji: "👑", minXP: 4000, commission: 5, color: "#fbbf24" },
];

function CommissionsPanel() {
  const mockCommissions = [
    { id: 1, brandName: "Zara", orderId: "ORD-9482", amount: 180, rate: 6, earned: 10.8, status: "completed", date: "2026-07-20" },
    { id: 2, brandName: "Gucci", orderId: "ORD-8472", amount: 1200, rate: 6, earned: 72.0, status: "completed", date: "2026-07-18" },
    { id: 3, brandName: "Nike", orderId: "ORD-7392", amount: 250, rate: 6, earned: 15.0, status: "pending", date: "2026-07-22" },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-border/40 rounded-2xl p-5 space-y-4 shadow-sm text-left">
      <div className="flex items-center justify-between pb-3 border-b border-border/10">
        <div>
          <h3 className="font-extrabold text-sm text-foreground">Commission History</h3>
          <p className="text-[11px] text-muted-foreground">Earnings from posts tagging brands</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-emerald-500" /> Active status
        </span>
      </div>

      <div className="space-y-2.5">
        {mockCommissions.map((comm) => (
          <div key={comm.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="font-black text-foreground">{comm.brandName}</span>
                <span className="text-[10px] text-muted-foreground">({comm.orderId})</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{comm.date} • {comm.rate}% of {comm.amount} TND</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-black text-foreground">+{comm.earned.toFixed(1)} TND</p>
              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                comm.status === "completed" 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "bg-amber-500/10 text-amber-500"
              }`}>
                {comm.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders Tracking Panel ────────────────────────────────────────────────────

const SHIP_STATUS_STEPS = ["pending", "preparing", "ready_for_pickup", "shipped", "delivered"];

const SHIP_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: "Pending",          color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  preparing:        { label: "Preparing",        color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
  ready_for_pickup: { label: "Ready for Pickup", color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
  shipped:          { label: "Shipped",          color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  delivered:        { label: "Delivered",        color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  canceled:         { label: "Canceled",         color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20" },
};

function OrdersTrackingPanel() {
  const { data: orders = [], isLoading } = trpc.delivery.myOrders.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/40 p-5 text-center py-12 space-y-3 shadow-sm animate-fade-up">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/45 mx-auto" />
        <h3 className="text-base font-bold">No orders placed yet</h3>
        <p className="text-xs text-muted-foreground">Products you purchase from social posts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {orders.map((order: any) => (
        <div key={order.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 shadow-sm overflow-hidden">
          {/* Order header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-muted/30">
            <div>
              <p className="text-xs font-black">Order #{order.id}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-primary">{order.totalAmount?.toLocaleString()} TND</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                <MapPin className="h-2.5 w-2.5" /> {order.city || order.shippingAddress || "—"}
              </p>
            </div>
          </div>

          {/* Shipments */}
          <div className="divide-y divide-border/15">
            {(order.shipments ?? []).map((sh: any) => {
              const cfg = SHIP_STATUS_CFG[sh.status] ?? SHIP_STATUS_CFG.pending;
              const stepIdx = SHIP_STATUS_STEPS.indexOf(sh.status);
              const isCanceled = sh.status === "canceled";
              return (
                <div key={sh.id} className="p-4 space-y-3">
                  {/* Brand + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{sh.brandName}</p>
                        <p className="text-[10px] text-muted-foreground">Shipment #{sh.id}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress timeline */}
                  {!isCanceled && (
                    <div className="flex items-center gap-0">
                      {SHIP_STATUS_STEPS.map((step, i) => {
                        const done = i <= stepIdx;
                        const isLast = i === SHIP_STATUS_STEPS.length - 1;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`h-2 w-2 rounded-full shrink-0 transit-all ${done ? "bg-primary" : "bg-border"}`} />
                            {!isLast && (
                              <div className={`flex-1 h-0.5 transit-all ${i < stepIdx ? "bg-primary" : "bg-border"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tracking info */}
                  {sh.carrier && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
                      <Truck className="h-3 w-3 text-primary shrink-0" />
                      <span className="font-semibold">{sh.carrier}</span>
                      {sh.trackingNumber && <span className="font-mono ml-1 text-foreground">{sh.trackingNumber}</span>}
                      {sh.estimatedDeliveryDate && (
                        <span className="ml-auto">ETA: {new Date(sh.estimatedDeliveryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {/* Items in this shipment */}
                  {sh.items?.length > 0 && (
                    <div className="space-y-1.5">
                      {sh.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productName} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{item.productName ?? "Item"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ×{item.quantity}{item.size ? ` · ${item.size}` : ""}
                            </p>
                          </div>
                          <p className="font-bold text-primary shrink-0">{(item.priceAtPurchase * item.quantity).toLocaleString()} TND</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Active view states
  const [activeTab, setActiveTab] = useState<ProfileTab>("outfits");
  const [activeSubTab, setActiveSubTab] = useState<OutfitsSubTab>("created");

  // Mannequin model state
  const [mannequin, setMannequin] = useState<{
    gender: "man" | "woman";
    height: string;
    weight: string;
    nickname: string;
    hasModel: boolean;
  }>({
    gender: "woman",
    height: "172",
    weight: "62",
    nickname: "Marwa_62kg",
    hasModel: false
  });

  // ── Settings modal states ──
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showGrade, setShowGrade] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Edit profile form
  const [editName, setEditName] = useState("Aria F.");
  const [editBio, setEditBio] = useState("Fashion curator & AI stylist enthusiast. Exploring the future of personal style.");
  const [editUsername, setEditUsername] = useState("AriaF");
  const [editEmail, setEditEmail] = useState(user?.email || "");

  // Grade / level — load from localStorage
  const [userXP, setUserXP] = useState<number>(() => {
    return Number(localStorage.getItem("styly_xp") || "120");
  });
  const [taggedPosts, setTaggedPosts] = useState<number>(() => {
    return Number(localStorage.getItem("styly_tagged_posts") || "12");
  });
  const [totalEarned, setTotalEarned] = useState<number>(() => {
    return Number(localStorage.getItem("styly_earned") || "24");
  });

  // Calculate current level, next level, and progress percentage dynamically based on userXP
  const curLevel = [...LEVELS].reverse().find(l => userXP >= l.minXP) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.minXP > userXP);
  const prevLevelMin = curLevel.minXP;
  const nextLevelMin = nextLevel ? nextLevel.minXP : curLevel.minXP;
  const progress = nextLevel
    ? Math.min(100, Math.floor(((userXP - prevLevelMin) / (nextLevelMin - prevLevelMin)) * 100))
    : 100;

  // Brand registration flow states
  const [showBrandPromo, setShowBrandPromo] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [brandRegistered, setBrandRegistered] = useState(false);
  const [ownerIdFileName, setOwnerIdFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BrandRegistration>({
    fullName: "",
    role: "",
    email: "",
    phone: "",
    ownerIdFile: "",
    brandName: "",
    password: "",
  });

  // tRPC Queries and Mutations
  const { data: dbPosts = [], refetch: refetchPosts } = trpc.posts.list.useQuery();
  const { data: brands = [] } = trpc.brands.list.useQuery();
  const { data: products = [] } = trpc.devices.list.useQuery();
  const createPostMutation = trpc.posts.create.useMutation();

  // Create post states
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postImagePreview, setPostImagePreview] = useState<string>("");
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const [postCategory, setPostCategory] = useState("Casual");
  const [selectedBrandId, setSelectedBrandId] = useState<number | "">("");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [isPosting, setIsPosting] = useState(false);
  const [tagX, setTagX] = useState<number | null>(null);
  const [tagY, setTagY] = useState<number | null>(null);

  const handlePostOutfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption || !selectedBrandId || !selectedProductId) {
      toast.error("Please fill in all fields");
      return;
    }

    const prod = products.find(p => p.id === Number(selectedProductId));
    if (!prod) {
      toast.error("Tagged product not found");
      return;
    }

    const brand = brands.find(b => b.id === Number(selectedBrandId));
    const tagText = brand ? ` @${brand.name.replace(/\s+/g, "")}` : "";

    setIsPosting(true);
    try {
      await createPostMutation.mutateAsync({
        imageUrl: postImageUrl,
        caption: postCaption + tagText,
        category: postCategory,
        taggedProduct: {
          id: prod.id,
          name: prod.name,
          price: Number(prod.price),
          image: prod.imageUrl || "/product_dress_1.png",
          brandId: prod.brandId
        },
        hotspots: tagX !== null && tagY !== null
          ? [{ x: tagX, y: tagY, brandId: Number(selectedBrandId), productId: Number(selectedProductId) }]
          : undefined
      });
      toast.success("Outfit posted successfully! 👕");
      setShowPostDialog(false);
      setPostCaption("");
      setSelectedBrandId("");
      setSelectedProductId("");
      setTagX(null);
      setTagY(null);
      await refetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to post outfit");
    } finally {
      setIsPosting(false);
    }
  };

  // Load brand registration status & mannequin double
  useEffect(() => {
    if (!loading && user) {
      const isReg = localStorage.getItem(`brand_registered_${user.id}`) === "true";
      setBrandRegistered(isReg);
    }
    const has = localStorage.getItem("has_mannequin") === "true";
    if (has) {
      setMannequin({
        gender: (localStorage.getItem("mannequin_gender") as "man" | "woman") || "woman",
        height: localStorage.getItem("mannequin_height") || "172",
        weight: localStorage.getItem("mannequin_weight") || "62",
        nickname: localStorage.getItem("mannequin_nickname") || "My Mannequin",
        hasModel: true
      });
    }
  }, [user, loading]);

  const handleOpenStoreSetup = () => {
    setShowBrandPromo(true);
  };

  const handleCreateBrandAccountClick = () => {
    setShowBrandPromo(false);
    setShowBrandForm(true);
  };

  const handleOwnerIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOwnerIdFileName(file.name);
      setForm({ ...form, ownerIdFile: file.name });
      toast.success(`Uploaded: ${file.name}`);
    }
  };

  const handleRegisterBrand = () => {
    if (!user) return;
    if (!form.fullName || !form.email || !form.phone || !form.brandName || !form.password) {
      toast.error("Please fill in all fields including Brand Name and Password");
      return;
    }
    // Set brand storage flags scoped to user.id
    localStorage.setItem(`brand_registered_${user.id}`, "true");
    localStorage.setItem(`brand_owner_name_${user.id}`, form.fullName);
    localStorage.setItem(`brand_name_${user.id}`, form.brandName);
    localStorage.setItem(`brand_email_${user.id}`, form.email);
    localStorage.setItem(`brand_password_${user.id}`, form.password);
    // Auto-login the brand dashboard on first creation — no extra login step needed
    localStorage.setItem(`brand_logged_in_${user.id}`, "true");
    
    setBrandRegistered(true);
    setShowBrandForm(false);
    toast.success("Congrats! Your brand account is verified and ready! 🎉");
  };

  const handleSwitchToBrandDashboard = () => {
    if (!user) return;
    // Save current active session state as brand mode scoped to user.id
    localStorage.setItem(`active_profile_mode_${user.id}`, "brand");
    setLocation("/brand");
  };

  return (
    <AppShell activePath="/profile" showRightPanel={false}>
      <div className="pb-20 lg:pb-6 max-w-md lg:max-w-6xl mx-auto space-y-5 lg:space-y-0 pt-4 lg:grid lg:grid-cols-12 lg:gap-6">
        
        {/* Left column (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-5 animate-fade-up">
          <div className="bg-white dark:bg-[#1A1A1A] border border-border/30 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-primary">
                <Shirt className="h-4 w-4" /> Body Double
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-bold">Live Model</span>
            </div>

            {/* Mannequin Image Box */}
            <div className="relative h-64 bg-gradient-to-b from-muted/30 to-muted/10 rounded-2xl flex items-center justify-center overflow-hidden border border-border/20 group">
              <img
                src={mannequin.gender === "woman" ? "/mannequin_female.png" : "/mannequin_male.png"}
                alt="Body Model"
                className="h-full w-auto object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <p className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] font-black text-white drop-shadow tracking-wider uppercase">
                {mannequin.nickname}
              </p>
            </div>

            {/* Mannequin stats */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/10 flex flex-col justify-center">
                <span className="text-[9px] text-muted-foreground uppercase">Height</span>
                <span className="text-foreground font-black mt-0.5">{mannequin.height} cm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/10 flex flex-col justify-center">
                <span className="text-[9px] text-muted-foreground uppercase">Weight</span>
                <span className="text-foreground font-black mt-0.5">{mannequin.weight} kg</span>
              </div>
            </div>

            <button
              onClick={() => setLocation("/mannequin")}
              className="w-full h-10 rounded-full border border-border/50 text-xs font-bold hover:bg-accent transit-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Adjust Measurements
            </button>
          </div>

          {/* Quick Style Goal Widget */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-border/30 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold text-foreground/80">Active style goal</h4>
            <div className="p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-orange-400/10 border border-primary/20 space-y-1">
              <p className="text-[10px] font-bold text-primary flex items-center gap-1">🎯 Streetwear Upgrade</p>
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Add 3 oversized sweaters and cargo bottoms matching your {mannequin.height}cm drape profile.
              </p>
            </div>
          </div>
        </div>

        {/* Middle main column */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
        
        {/* ── 1. Hero Card (Professional Banner & Info) ── */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-border/30 overflow-hidden shadow-sm">
          {/* Cover gradient */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-orange-400/20 to-primary/10 relative animate-fade-up" />
          
          <div className="px-5 pb-5 -mt-10 flex flex-col items-center text-center relative z-10 animate-fade-up">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white dark:border-[#1A1A1A] shadow-md bg-white">
              <img src="/logo.png" alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-base font-extrabold mt-2 text-foreground">Aria F.</h2>
            <p className="text-[10px] text-muted-foreground font-semibold">@AriaF</p>
            
            <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed px-2">
              Fashion curator & AI stylist enthusiast. Exploring the future of personal style.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-4 py-2 px-6 rounded-2xl bg-muted/40 border border-border/10 w-full max-w-xs">
              <div className="text-center">
                <p className="text-xs font-black text-foreground">12</p>
                <p className="text-[9px] text-muted-foreground">Outfits</p>
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="text-center">
                <p className="text-xs font-black text-foreground">1.4K</p>
                <p className="text-[9px] text-muted-foreground">Followers</p>
              </div>
              <div className="h-6 w-px bg-border/40" />
              <div className="text-center">
                <p className="text-xs font-black text-foreground">840</p>
                <p className="text-[9px] text-muted-foreground">Likes</p>
              </div>
            </div>

            {/* Switch / Store Button */}
            <div className="mt-4 w-full px-2">
              {brandRegistered ? (
                <button
                  onClick={handleSwitchToBrandDashboard}
                  className="w-full h-10 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary hover:text-white transit-all flex items-center justify-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Switch to Brand Dashboard
                </button>
              ) : (
                <button
                  onClick={handleOpenStoreSetup}
                  className="w-full h-10 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transit-all flex items-center justify-center gap-1.5"
                >
                  <Building className="h-3.5 w-3.5" />
                  Open brand store
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Search & Utility Bar ── */}
        <div className="px-1 animate-fade-up">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your profile..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white dark:bg-[#1A1A1A] border border-border/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            />
          </div>
        </div>

        {/* ── 3. Navigation Bar (Tabs) ── */}
        <div className="px-1 animate-fade-up">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 p-1 flex items-center justify-around gap-0.5 shadow-sm">
            {(["outfits", "orders", "followers", "profits", "settings"] as ProfileTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold capitalize rounded-xl transition-all ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. Tab Content Views ── */}
        <main className="px-1 py-2">
          
          {/* ── OUTFITS TAB (1.jpeg to 4.jpeg) ── */}
          {activeTab === "outfits" && (
            <div className="space-y-6">

            {/* Outfits Sub Tabs */}
            <div className="flex gap-2 justify-around border-b border-border/20 pb-2">
              <button
                onClick={() => setActiveSubTab("created")}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  activeSubTab === "created"
                    ? "bg-foreground text-background border-foreground shadow"
                    : "bg-muted border-border/40 hover:bg-accent"
                }`}
              >
                👕 Created by you
              </button>
              <button
                onClick={() => setActiveSubTab("wardrobe")}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  activeSubTab === "wardrobe"
                    ? "bg-foreground text-background border-foreground shadow"
                    : "bg-muted border-border/40 hover:bg-accent"
                }`}
              >
                👗 Wardrobe
              </button>
              <button
                onClick={() => setActiveSubTab("loved")}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  activeSubTab === "loved"
                    ? "bg-foreground text-background border-foreground shadow"
                    : "bg-muted border-border/40 hover:bg-accent"
                }`}
              >
                ❤️ Loved
              </button>
              <button
                onClick={() => setActiveSubTab("stylista")}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  activeSubTab === "stylista"
                    ? "bg-foreground text-background border-foreground shadow"
                    : "bg-muted border-border/40 hover:bg-accent"
                }`}
              >
                🪄 Stylista
              </button>
            </div>

            {/* Created Outfits Sub-tab */}
            {activeSubTab === "created" && (() => {
              const userPosts = dbPosts.filter((p: any) => p.userId === user?.id);
              return (
                <div className="space-y-5">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Created Looks</h3>
                    <button
                      onClick={() => setShowPostDialog(true)}
                      className="px-4 h-9 rounded-full bg-primary text-white text-xs font-bold shadow-sm flex items-center gap-1.5 hover:opacity-95"
                    >
                      <Plus className="h-4.5 w-4.5" /> Post Look
                    </button>
                  </div>

                  {userPosts.length === 0 ? (
                    <div className="text-center py-16 space-y-6 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 shadow-sm">
                      <div className="text-7xl">🧥💰</div>
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-foreground">No outfits posted yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                          Share your daily outfits, tag registered brands, and earn commissions on every order driven by your post!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPostDialog(true)}
                        className="px-6 h-11 rounded-full bg-primary text-white text-xs font-bold shadow-sm"
                      >
                        Post your first outfit
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {userPosts.map((post: any) => (
                        <div key={post.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-all duration-300">
                          <div className="aspect-[4/5] bg-muted overflow-hidden relative">
                            <img 
                              src={post.image || "/product_dress_1.png"} 
                              alt="Outfit" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                            />
                            {/* Tag approval badge */}
                            <div className="absolute top-2.5 right-2.5">
                              {post.approvalStatus === "green" ? (
                                <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-emerald-500 text-white shadow">
                                  Approved & Live
                                </span>
                              ) : post.approvalStatus === "red" ? (
                                <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-red-500 text-white shadow">
                                  Declined
                                </span>
                              ) : (
                                <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white shadow">
                                  Pending Approval
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            <p className="text-[11px] font-medium leading-relaxed line-clamp-2 text-foreground/80">
                              {post.caption}
                            </p>
                            {post.taggedProduct && (
                              <div className="p-1.5 rounded-lg bg-muted/60 border border-border/20 flex items-center gap-2">
                                <div className="h-7 w-7 rounded bg-muted overflow-hidden shrink-0">
                                  <img src={post.taggedProduct.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[8px] font-bold truncate leading-tight text-foreground/90">{post.taggedProduct.name}</p>
                                  <p className="text-[9px] font-black text-primary leading-tight">${post.taggedProduct.price}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Wardrobe Tab */}
            {activeSubTab === "wardrobe" && (() => {
              const savedBag = localStorage.getItem("styly_shopping_bag");
              const bagItems = savedBag ? JSON.parse(savedBag) : [];
              if (bagItems.length === 0) {
                return (
                  <div className="text-center py-16 space-y-5 animate-fade-up">
                    <div className="text-6xl">🐱👗</div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold">Your dressing room is empty</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Hang outfits while you shop, so they'll be ready here for virtual try-on.
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="space-y-4 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">{bagItems.length} items hung in wardrobe</p>
                    <button
                      onClick={() => setLocation("/checkout")}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      Go to checkout <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {bagItems.map((item: any) => (
                      <div key={`${item.id}-${item.size}`} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden flex flex-col p-3 gap-2">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-xs truncate leading-tight">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Size: {item.size} · Qty: {item.qty}</p>
                          <p className="text-primary font-black text-xs mt-1">${(item.price * item.qty).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Loved Tab */}
            {activeSubTab === "loved" && (() => {
              const likedStr = localStorage.getItem("styly_liked_posts");
              const likedIds = likedStr ? JSON.parse(likedStr) : [];
              // Import the posts pool or search local list
              const lovedPosts = DUMMY_POSTS.filter(p => likedIds.includes(p.id));

              if (lovedPosts.length === 0) {
                return (
                  <div className="text-center py-16 space-y-5 animate-fade-up">
                    <div className="text-6xl">💖🧦</div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold">You didn't like any outfit yet!</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Like outfits in the feed, and they'll be saved here for inspiration.
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="space-y-4 animate-fade-up">
                  <p className="text-xs font-bold text-muted-foreground">{lovedPosts.length} loved outfits</p>
                  <div className="grid grid-cols-2 gap-3">
                    {lovedPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => setLocation("/feed")}
                        className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/30 overflow-hidden cursor-pointer flex flex-col p-2.5 gap-2"
                      >
                        <div className="aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                          <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] truncate leading-none">{post.creator.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{post.creator.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Stylista AI tab */}
            {activeSubTab === "stylista" && (
              <StylistaAITab onTryOn={() => setLocation("/mannequin")} />
            )}

          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && <OrdersTrackingPanel />}


        {/* ── FOLLOWERS TAB ── */}
        {activeTab === "followers" && (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-border/40 p-4 text-center py-12 space-y-3 shadow-sm">
            <Users className="h-12 w-12 text-muted-foreground/45 mx-auto" />
            <h3 className="text-base font-bold">No followers yet</h3>
            <p className="text-xs text-muted-foreground">Post daily styles to grow your fashion circle!</p>
          </div>
        )}

        {/* ── PROFITS TAB ── */}
        {activeTab === "profits" && (
          <div className="space-y-5 animate-fade-up">
            {/* Grade card from SQLite */}
            <GradePanel />

            {/* Commission History */}
            <CommissionsPanel />
          </div>
        )}

        {/* ── SETTINGS TAB (7.jpeg) ── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1A1A1A] border border-border/40 rounded-2xl overflow-hidden shadow-sm divide-y divide-border/20">
              
              {[
                { label: t("editProfile"),       icon: User,          action: () => setShowEditProfile(true) },
                { label: t("languageLabel"),     icon: Globe,         action: () => setShowLanguageModal(true) },
                { label: t("yourGrade"),         icon: Star,          action: () => setShowGrade(true) },
                { label: t("help"),              icon: AlertCircle,   action: () => setShowHelp(true) },
                { label: t("generalCondition"),  icon: FileText,       action: () => setShowTerms(true) },
                { label: t("privacyPolicy"),     icon: CheckCircle,   action: () => setShowPrivacy(true) },
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/40 text-left transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">{label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}

            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                toast.success("Logged out successfully");
                setLocation("/auth");
              }}
              className="w-full h-12 rounded-full border-2 border-red-500/40 text-red-500 dark:text-red-400 font-bold text-xs hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}

      </main>

      {/* ── Brand Promo Panel Screen (5.jpeg) ── */}
      {showBrandPromo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBrandPromo(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center border-b border-border/20 pb-3">
              <h2 className="text-base font-bold">Open store</h2>
              <button onClick={() => setShowBrandPromo(false)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="h-40 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center">
                <Building2 className="h-20 w-20 text-primary/80" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black leading-tight">Get your brand its own online store</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Once your information is verified, you'll be ready to sell your products.
                </p>
              </div>
            </div>

            {brandRegistered ? (
              <button
                onClick={handleSwitchToBrandDashboard}
                className="w-full h-12 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-all shadow-sm"
              >
                Go to Brand Dashboard
              </button>
            ) : (
              <button
                onClick={handleCreateBrandAccountClick}
                className="w-full h-12 rounded-full bg-foreground text-background font-bold text-xs hover:opacity-90 transition-all shadow"
              >
                Create a brand account
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Brand Account Owner Form Screen (6.jpeg) ── */}
      {showBrandForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBrandForm(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 p-6 space-y-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border/20 pb-3 shrink-0">
              <h2 className="text-base font-bold">Brand account</h2>
              <button onClick={() => setShowBrandForm(false)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inputs Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Owner information</p>
              
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Brand credentials</p>

              <div>
                <input
                  type="text"
                  placeholder="Brand Name"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Brand Dashboard Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Owner ID file upload trigger */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={ownerIdFileName || "Owner ID Card Upload"}
                  readOnly
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 pl-4 pr-12 rounded-xl bg-muted border border-border/50 text-xs cursor-pointer focus:outline-none"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center shrink-0"
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleOwnerIdFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="shrink-0 pt-2">
              <button
                onClick={handleRegisterBrand}
                className="w-full h-12 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
              >
                Next
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Post Outfit Dialog ── */}
      <Dialog open={showPostDialog} onOpenChange={(open) => { setShowPostDialog(open); if (!open) { setPostImagePreview(""); setPostImageUrl(""); } }}>
        <DialogContent className="max-w-md bg-white dark:bg-[#1A1A1A] border border-border/40 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" /> Create Outfit Post
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostOutfit} className="space-y-4 pt-2">
            
            {/* Caption */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Caption</label>
              <textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="Write a caption (e.g. In love with my new look!)"
                className="w-full h-20 p-3 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-foreground"
                required
              />
            </div>

            {/* Local Photo Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Photo</label>

              {/* Hidden file input */}
              <input
                ref={postImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    setPostImagePreview(dataUrl);
                    
                    const formData = new FormData();
                    formData.append("image", file);
                    fetch("/api/upload", { method: "POST", body: formData })
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.url) {
                          setPostImageUrl(d.url);
                        } else {
                          setPostImageUrl(dataUrl);
                        }
                      })
                      .catch(() => {
                        setPostImageUrl(dataUrl);
                      });
                  };
                  reader.readAsDataURL(file);
                }}
              />

              {postImagePreview ? (
                <div
                  className="relative w-full h-56 rounded-2xl overflow-hidden border border-border/40 bg-muted cursor-crosshair animate-in fade-in duration-300"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                    setTagX(x);
                    setTagY(y);
                  }}
                >
                  <img src={postImagePreview} alt="Preview" className="w-full h-full object-cover select-none pointer-events-none" />
                  
                  {tagX !== null && tagY !== null && (
                    <div
                      className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-primary/95 border-2 border-white flex items-center justify-center animate-pulse shadow-md"
                      style={{ left: `${tagX}%`, top: `${tagY}%` }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}
                  
                  {/* Change Photo Overlay Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      postImageInputRef.current?.click();
                    }}
                    className="absolute top-3 right-3 h-8 px-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-black/80 transition-all"
                  >
                    <Camera className="h-3.5 w-3.5" /> Change Photo
                  </button>
                  
                  <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-black/60 text-white/90 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
                      {tagX !== null ? `✓ Tag positioned at ${tagX}%` : "⚡ Tap image to place tag marker"}
                    </span>
                  </div>
                </div>
              ) : (
                /* Upload drop zone */
                <button
                  type="button"
                  onClick={() => postImageInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/3 hover:bg-primary/6 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary">Upload from device</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WEBP · Max 10 MB</p>
                  </div>
                </button>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Style Category</label>
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              >
                {["Casual", "Formal", "Streetwear", "Bohemian", "Activewear"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Tag Brand */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tag Brand</label>
              <select
                value={selectedBrandId}
                onChange={(e) => {
                  const brandId = e.target.value ? Number(e.target.value) : "";
                  setSelectedBrandId(brandId);
                  setSelectedProductId("");
                }}
                className="w-full h-11 px-3 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                required
              >
                <option value="">Select a Brand</option>
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Tag Product */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tag Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
                className="w-full h-11 px-3 rounded-xl bg-muted border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                required
                disabled={!selectedBrandId}
              >
                <option value="">Select a Product</option>
                {products
                  .filter((p: any) => !selectedBrandId || p.brandId === Number(selectedBrandId))
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-border/20">
              <button
                type="button"
                onClick={() => setShowPostDialog(false)}
                className="flex-1 h-11 rounded-full border border-border/50 text-xs font-semibold hover:bg-accent text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPosting}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white text-xs font-bold hover:opacity-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
              >
                {isPosting ? "Posting..." : "Post Look"}
              </button>
            </div>

          </form>
        </DialogContent>
      </Dialog>

      </div>

      {/* ── Desktop Right Panel: Closet Analytics & Brands ── */}
      <div className="hidden lg:flex lg:col-span-3 flex-col gap-5 animate-fade-up">
        {/* Closet Analytics */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-border/30 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" /> Closet Analytics
          </h3>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-1.5 border-b border-border/10">
              <span className="text-xs text-muted-foreground">Fit Match Rate</span>
              <span className="text-xs font-black text-emerald-500">97% Confidence</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/10">
              <span className="text-xs text-muted-foreground">Estimated Closet Value</span>
              <span className="text-xs font-black text-foreground">$1,840</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/10">
              <span className="text-xs text-muted-foreground">Dominant Color</span>
              <span className="text-xs font-black text-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#111] border border-white" /> Black
              </span>
            </div>
          </div>
        </div>

        {/* Followed Brands */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-border/30 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
            <Building className="h-4 w-4 text-primary" /> Followed Brands
          </h3>

          <div className="space-y-2">
            {[
              { name: "Queen Rania Collection", category: "Formal / Luxury", avatar: "Q" },
              { name: "Urban Threads", category: "Casual / Linen", avatar: "U" },
              { name: "Kenzo Luxury", category: "Streetwear / Outerwear", avatar: "K" },
            ].map((brand, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 hover:bg-muted/80 transit-all cursor-pointer">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-[10px] font-black text-white">
                  {brand.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate">{brand.name}</p>
                  <p className="text-[9px] text-muted-foreground">{brand.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>

    {/* ═══════════════════════════════════════════════════════════════════════
        SETTINGS MODALS — rendered inside AppShell so they layer correctly
    ══════════════════════════════════════════════════════════════════════════ */}

  {/* ── Language Selection Modal ── */}
  {showLanguageModal && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLanguageModal(false)} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <h2 className="font-black text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> {t("languageLabel")}</h2>
          <button onClick={() => setShowLanguageModal(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3">
          {[
            { code: "en", name: "English" },
            { code: "fr", name: "Français" },
            { code: "ar", name: "العربية" }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any);
                toast.success(`Language updated to ${lang.name}!`);
                setShowLanguageModal(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                language === lang.code
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border/40 hover:bg-accent/40"
              }`}
            >
              <span>{lang.name}</span>
              {language === lang.code && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* ── Edit Profile Modal ── */}
  {showEditProfile && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <h2 className="font-black text-base flex items-center gap-2"><Edit3 className="h-4 w-4 text-primary" /> Edit Profile</h2>
          <button onClick={() => setShowEditProfile(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
                <img src="/logo.png" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Tap to change photo</p>
          </div>

          {/* Fields */}
          {[
            { label: "Full name",  value: editName,     setter: setEditName     },
            { label: "Username",   value: editUsername, setter: setEditUsername },
            { label: "Email",      value: editEmail,    setter: setEditEmail    },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
              <input
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Bio</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all resize-none"
            />
          </div>

          <button
            onClick={() => { toast.success("Profile updated! ✅"); setShowEditProfile(false); }}
            className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-sm hover:opacity-95 shadow-lg shadow-primary/20 transit-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ── Your Grade Modal ── */}
  {showGrade && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGrade(false)} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <h2 className="font-black text-base flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Your Grade</h2>
          <button onClick={() => setShowGrade(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">

            {/* Current Level Card */}
            <div className="p-5 rounded-2xl text-center space-y-2" style={{ background: `linear-gradient(135deg, ${curLevel.color}22, ${curLevel.color}08)`, border: `1px solid ${curLevel.color}44` }}>
              <div className="text-5xl">{curLevel.emoji}</div>
              <p className="text-xl font-black" style={{ color: curLevel.color }}>{curLevel.name}</p>
              <p className="text-xs text-muted-foreground">{userXP} XP earned</p>
            </div>

            {/* XP Progress Bar */}
            {nextLevel && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">{curLevel.name}</span>
                  <span className="text-primary">{nextLevel.name} at {nextLevel.minXP} XP</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: `linear-gradient(to right, ${curLevel.color}, ${nextLevel.color})` }}
                  />
                </div>
                <p className="text-[10px] text-center text-muted-foreground">{progress}% to next level</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Tagged Posts", value: taggedPosts,  icon: Tag },
                { label: "Total XP",     value: userXP,       icon: Star },
                { label: "Earned ($)",   value: `$${totalEarned}`, icon: DollarSign },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border/20 text-center space-y-1">
                  <Icon className="h-4 w-4 text-primary mx-auto" />
                  <p className="text-sm font-black text-foreground">{value}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Commission Table */}
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-foreground/80">Brand Tag Commission Rates</p>
              <div className="rounded-xl overflow-hidden border border-border/30 divide-y divide-border/20">
                {LEVELS.map(level => (
                  <div
                    key={level.name}
                    className={`flex items-center justify-between px-4 py-2.5 text-xs ${level.name === curLevel.name ? "bg-primary/8" : ""}`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <span>{level.emoji}</span>
                      <span style={{ color: level.color }}>{level.name}</span>
                      {level.name === curLevel.name && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                    </span>
                    <span className="font-black" style={{ color: level.commission > 0 ? "#10B981" : "#9CA3AF" }}>
                      {level.commission > 0 ? `${level.commission}% / tag` : "No commission"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to earn XP */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/20 space-y-2">
              <p className="text-xs font-extrabold">How to earn XP & commissions</p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">+10 XP</span> Brand tag approved by brand</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">+5 XP</span> Post gets 50+ likes</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold shrink-0">+2 XP</span> New follower</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold shrink-0">💵 Cash</span> Each approved tagged product sale earns your commission %</li>
              </ul>
            </div>

            <button
              onClick={() => {
                const newXP = userXP + 25;
                setUserXP(newXP);
                localStorage.setItem("styly_xp", String(newXP));
                toast.success("+25 XP added! Keep posting! 🔥");
              }}
              className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-sm hover:opacity-95 shadow-lg shadow-primary/20 transit-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Simulate +25 XP (Demo)
            </button>
          <GradePanel />
          <CommissionsPanel />
        </div>
      </div>
    </div>
  )}

  {/* ── Help Modal ── */}
  {showHelp && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <h2 className="font-black text-base flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" /> Help & Support</h2>
          <button onClick={() => setShowHelp(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {[
            { q: "How does brand tagging work?", a: "When you post an outfit, you can tag the brand of the item. The brand receives a notification to approve or decline your tag. If approved, you earn XP and commission on any sales generated." },
            { q: "How do I level up my grade?", a: "Each approved brand tag earns you +10 XP. Getting 50+ likes on a post adds +5 XP. Every new follower adds +2 XP. Reach higher levels to unlock better commission rates." },
            { q: "When do I receive commissions?", a: "Commissions are paid monthly via your registered payment method. You must be at Starter level or above to receive commissions. Minimum payout is 20 TND." },
            { q: "How does the virtual try-on work?", a: "Configure your mannequin with your body measurements in the Mannequin page. Then when you view a product, tap 'Try On' to see how it looks on your mannequin body double." },
            { q: "Can I delete a post?", a: "Yes. Go to the Outfits tab > Created by you, and swipe or tap the delete icon on any post you own." },
            { q: "How do I open a brand store?", a: "In the Profile tab, tap 'Open brand store'. Fill in your brand details and submit your owner ID for verification. Once approved (24–72h), your brand dashboard becomes active." },
          ].map(({ q, a }, i) => (
            <div key={i} className="p-4 rounded-2xl border border-border/30 bg-muted/20 space-y-2">
              <p className="text-xs font-bold text-foreground">{q}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-orange-400/10 border border-primary/20 text-center space-y-2">
            <p className="text-xs font-bold">Still need help?</p>
            <p className="text-[11px] text-muted-foreground">Contact us at <span className="text-primary font-semibold">support@styly.app</span></p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── General Conditions Modal ── */}
  {showTerms && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTerms(false)} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <h2 className="font-black text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> General Conditions</h2>
          <button onClick={() => setShowTerms(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p className="text-sm font-black text-foreground">Terms of Use — Styly Platform</p>
          <p>Last updated: July 2025</p>
          {[
            ["1. Acceptance", "By accessing or using the Styly platform, you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not access the service."],
            ["2. Account Responsibilities", "You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and update it as necessary. Styly reserves the right to terminate accounts that violate these terms."],
            ["3. Brand Tagging & Commissions", "Users may tag brands in their posts. Approved tags earn XP and commission on resulting sales according to your grade level. Commission fraud or fake tags will result in immediate account suspension and forfeiture of all earned commissions."],
            ["4. Content Policy", "You retain ownership of content you post. By posting, you grant Styly a non-exclusive licence to display, distribute, and promote your content on the platform. You must not post offensive, misleading, or infringing content."],
            ["5. Payments", "Commission payouts are processed monthly. Styly reserves the right to withhold payment if fraudulent activity is suspected. The minimum payout threshold is $20."],
            ["6. Modifications", "Styly reserves the right to modify these terms at any time. Continued use after changes constitutes acceptance of the new terms."],
          ].map(([title, text]) => (
            <div key={title} className="space-y-1">
              <p className="font-bold text-foreground/90 text-[11px]">{title}</p>
              <p>{text as string}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* ── Privacy Policy Modal ── */}
  {showPrivacy && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivacy(false)} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <h2 className="font-black text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Privacy Policy</h2>
          <button onClick={() => setShowPrivacy(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p className="text-sm font-black text-foreground">Privacy Policy — Styly</p>
          <p>Effective date: July 2025</p>
          {[
            ["Information We Collect", "We collect information you provide directly (name, email, profile photo, body measurements for the mannequin feature), as well as usage data such as posts, interactions, and purchase history."],
            ["How We Use Your Information", "Your data is used to personalise your feed, power the mannequin try-on feature, calculate brand tag commissions, process orders, and improve the platform. We do not sell your personal data to third parties."],
            ["Data Sharing", "Aggregated, anonymised style data may be shared with brand partners to help them understand trends. Your identity is never disclosed without your explicit consent."],
            ["Body Measurement Data", "Measurements you enter for the mannequin are stored locally on your device and optionally synced to your account. They are used solely for the virtual try-on experience and are never shared externally."],
            ["Your Rights", "You have the right to access, correct, or delete your personal data at any time by contacting support@styly.app. You may also export your data from the Settings page."],
            ["Cookies & Tracking", "We use essential cookies to keep you logged in and to maintain your preferences. Optional analytics cookies can be disabled in your browser settings."],
            ["Security", "We use industry-standard encryption (TLS 1.3) to protect your data in transit and AES-256 at rest. However, no system is 100% secure. Please keep your credentials safe."],
          ].map(([title, text]) => (
            <div key={title} className="space-y-1">
              <p className="font-bold text-foreground/90 text-[11px]">{title}</p>
              <p>{text as string}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  </AppShell>
  );
}

// ─── Theme Icons ─────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-amber-400">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-foreground/80">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}

// ─── AI Stylista Generator Tab ────────────────────────────────────────────────

const AI_OUTFIT_POOL = [
  { id: 1, name: "The Power Casual",        desc: "Linen blazer + straight-leg denim + white tee. Effortlessly curated.",         price: 389,  image: "/product_jacket.png"  },
  { id: 2, name: "Evening Silk Edit",       desc: "Silk midi dress + pearl earrings + block-heel mule. Timeless elegance.",        price: 1289, image: "/product_dress_1.png" },
  { id: 3, name: "Street-Ready Stack",      desc: "Cargo trousers + ribbed tank + oversized bomber. Bold, relaxed, statement.",    price: 628,  image: "/product_jacket.png"  },
  { id: 4, name: "Bohemian Garden",         desc: "Floral midi + woven sandals + straw tote. Free-spirited summer perfection.",    price: 349,  image: "/product_dress_1.png" },
  { id: 5, name: "Monochrome Moment",       desc: "Cream-on-cream trench + wide-leg trousers + loafers. Quiet luxury.",           price: 899,  image: "/product_jacket.png"  },
  { id: 6, name: "Gym-to-Street Look",      desc: "Performance shorts + zip-up hoodie + chunky sneakers. Moves with you.",        price: 479,  image: "/product_dress_1.png" },
];

const STYLE_TYPES = ["Casual", "Formal", "Streetwear", "Bohemian", "Minimalist", "Activewear"];
const COLOR_PREFS = ["Neutrals", "Bold Colors", "Pastels", "Earth Tones", "Monochrome", "Prints"];

function StylistaAITab({ onTryOn }: { onTryOn: () => void }) {
  const [styleType, setStyleType] = useState("");
  const [colorPref, setColorPref] = useState("");
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof AI_OUTFIT_POOL>([]);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!styleType || !colorPref) {
      toast.error("Please select a style type and color preference");
      return;
    }
    setLoading(true);
    setResults([]);
    setTimeout(() => {
      // Simulate AI selection: pick 3 relevant outfits
      const shuffled = [...AI_OUTFIT_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
      setResults(shuffled);
      setLoading(false);
      setGenerated(true);
      toast.success("Styly AI found your perfect outfits! ✨");
    }, 2000);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-orange-400/10 border border-primary/15">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-black text-sm">Styly AI Stylista</p>
          <p className="text-[10px] text-muted-foreground leading-snug">Tell us your vibe and we'll build your perfect outfit from your wardrobe and top brands.</p>
        </div>
      </div>

      {/* Preferences form */}
      <div className="space-y-4">
        {/* Style type */}
        <div>
          <p className="text-xs font-bold mb-2">Your Style Vibe</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_TYPES.map((s) => (
              <button
                key={s}
                onClick={() => setStyleType(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transit-all ${
                  styleType === s
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                    : "bg-muted border-border/30 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Color preference */}
        <div>
          <p className="text-xs font-bold mb-2">Color Preference</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_PREFS.map((c) => (
              <button
                key={c}
                onClick={() => setColorPref(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transit-all ${
                  colorPref === c
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                    : "bg-muted border-border/30 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div>
          <p className="text-xs font-bold mb-1.5">Occasion <span className="text-muted-foreground font-normal">(optional)</span></p>
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="e.g. Office meeting, Beach day, Date night…"
            className="w-full h-10 px-4 rounded-xl bg-muted border border-border/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transit-all"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-sm hover:opacity-95 hover:scale-[1.01] transit-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Generating outfits…
            </>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate My Outfits</>
          )}
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 p-3 rounded-2xl border border-border/30 animate-fade-up" style={{ animationDelay: `${n * 100}ms` }}>
              <div className="skeleton h-20 w-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-2/3" />
                <div className="skeleton h-2.5 w-full" />
                <div className="skeleton h-2.5 w-3/4" />
                <div className="skeleton h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated outfit results */}
      {generated && !loading && results.length > 0 && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold text-primary">3 outfits curated for you — {styleType} × {colorPref}</p>
          </div>
          {results.map((outfit, i) => (
            <div
              key={outfit.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-border/30 bg-white dark:bg-[#1A1A1A] transit-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/30">
                <img src={outfit.image} alt={outfit.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs leading-tight truncate">{outfit.name}</p>
                  <span className="shrink-0 text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">AI Pick</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{outfit.desc}</p>
                <p className="text-primary font-black text-sm">${outfit.price.toLocaleString()}</p>
                <button
                  onClick={onTryOn}
                  className="flex items-center gap-1 text-[9px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary hover:text-white transit-all"
                >
                  <Sparkles className="h-2.5 w-2.5" /> Try On
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => { setGenerated(false); setResults([]); setStyleType(""); setColorPref(""); setOccasion(""); }}
            className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/30 rounded-full transit-all hover:border-primary/30"
          >
            ↺ Generate New Outfits
          </button>
        </div>
      )}
    </div>
  );
}

