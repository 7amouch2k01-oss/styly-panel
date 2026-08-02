/**
 * BrandLevelBadge.tsx
 * Displays brand XP level badge, progress ring, and level-up celebration.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Crown } from "lucide-react";

// PDF Section 9.1 — Professional Seller Tiers (xp thresholds mirror TND revenue milestones)
const BRAND_TIERS = [
  { level: 1, title: "Starter", emoji: "🌱", xp: 0,      color: "#94a3b8", commission: 15, feeLabel: "Free",        revenueLabel: "Under 10,000 TND/mo",     next: 10000  },
  { level: 2, title: "Growth",  emoji: "🔥", xp: 10000,  color: "#10b981", commission: 13, feeLabel: "165 TND/mo",  revenueLabel: "10,000 – 50,000 TND/mo",  next: 50000  },
  { level: 3, title: "Pro",     emoji: "⭐", xp: 50000,  color: "#60a5fa", commission: 10, feeLabel: "350 TND/mo",  revenueLabel: "50,000 – 250,000 TND/mo", next: 250000 },
  { level: 4, title: "Elite",   emoji: "👑", xp: 250000, color: "#fbbf24", commission: 7,  feeLabel: "550 TND/mo",  revenueLabel: "Above 250,000 TND/mo",    next: null   },
];

const LEVEL_UNLOCKS: Record<number, string[]> = {
  1: ["Basic storefront listing", "Up to 20 products", "Manual tag approval", "15% platform commission"],
  2: ["Expanded analytics & visibility", "Up to 50 products", "Basic analytics (views, clicks)", "Low-stock automatic alerts", "13% platform commission"],
  3: ["Advanced analytics suite", "Up to 100 products", "Revenue & conversion tracking", "Influencer tier filters", "Priority support email", "10% platform commission"],
  4: ["Full advanced features", "Unlimited products", "Premium placement & homepage banner", "Auto-approval whitelist", "AI-powered tag verification", "VIP Influencer campaign management", "7% platform commission"],
};

interface BrandLevelBadgeProps {
  brandId: number;
  showDetails?: boolean;
}

export function BrandLevelBadge({ brandId, showDetails = false }: BrandLevelBadgeProps) {
  const { data: level, isLoading } = trpc.brandLevel.get.useQuery({ brandId });
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!level) return;
    if (prevLevel !== null && level.level > prevLevel) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
    setPrevLevel(level.level);
  }, [level?.level]);

  if (isLoading) return <div className="w-10 h-10 rounded-full animate-pulse bg-accent/40" />;

  const currentTier = BRAND_TIERS.find(t => t.level === (level?.level || 1)) || BRAND_TIERS[0];
  const nextTier = BRAND_TIERS.find(t => t.level === (level?.level || 1) + 1);
  const currentXP = level?.xp || 0;
  const progressPct = nextTier
    ? Math.min(100, ((currentXP - currentTier.xp) / (nextTier.xp - currentTier.xp)) * 100)
    : 100;

  // Compact badge (for header)
  if (!showDetails) {
    return (
      <>
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCelebration(false)}
            >
              <motion.div
                initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="text-center p-10 rounded-3xl max-w-md mx-4"
                style={{ background: "linear-gradient(135deg, #0f0f0f, #1a1a1a)", border: `2px solid ${currentTier.color}` }}
              >
                <div className="text-7xl mb-4">{currentTier.emoji}</div>
                <h2 className="text-3xl font-black text-white mb-1">Level Up!</h2>
                <p className="text-xl font-bold mb-4" style={{ color: currentTier.color }}>Your brand is now {currentTier.title}!</p>
                <div className="text-left space-y-1 mb-6">
                  <p className="text-white/60 text-sm font-semibold mb-2">🎁 New Features Unlocked:</p>
                  {LEVEL_UNLOCKS[currentTier.level].map((u, i) => (
                    <p key={i} className="text-white/80 text-sm">✓ {u}</p>
                  ))}
                </div>
                <button onClick={() => setShowCelebration(false)} className="px-6 py-2.5 rounded-xl font-bold text-black" style={{ background: currentTier.color }}>
                  Awesome! 🚀
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 cursor-pointer">
          {/* XP Ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke={currentTier.color} strokeWidth="3"
                strokeLinecap="round"
                style={{ strokeDasharray: `${(progressPct / 100) * 100.53} 100.53` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg">{currentTier.emoji}</div>
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-none">{currentTier.title}</p>
            <p className="text-muted-foreground text-xs font-medium">{currentXP.toLocaleString()} XP</p>
          </div>
        </motion.div>
      </>
    );
  }

  // Full detail panel
  return (
    <div className="rounded-2xl p-6 space-y-5 bg-card border border-border/50 text-card-foreground shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
              <motion.circle
                cx="22" cy="22" r="18" fill="none"
                stroke={currentTier.color} strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 113.1" }}
                animate={{ strokeDasharray: `${(progressPct / 100) * 113.1} 113.1` }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">{currentTier.emoji}</div>
          </div>
          <div>
            <h3 className="font-black text-xl text-foreground">{currentTier.title}</h3>
            <p className="text-muted-foreground text-sm font-medium">Level {currentTier.level} of 4</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: currentTier.color }}>{currentTier.revenueLabel}</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-2xl font-black" style={{ color: currentTier.color }}>{currentXP.toLocaleString()}</p>
          <p className="text-muted-foreground text-xs font-semibold">Brand XP</p>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${currentTier.color}20`, color: currentTier.color }}>
              {currentTier.commission}% fee
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground font-semibold border border-border/40">
              {currentTier.feeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>{currentXP.toLocaleString()} XP</span>
          <span>{nextTier ? `${nextTier.xp.toLocaleString()} XP for ${nextTier.emoji} ${nextTier.title}` : "Max Level! 👑"}</span>
        </div>
        <div className="h-2.5 rounded-full bg-accent/60 overflow-hidden border border-border/30">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${currentTier.color}70, ${currentTier.color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        {nextTier && (
          <p className="text-xs text-muted-foreground text-center font-medium">
            {(nextTier.xp - currentXP).toLocaleString()} XP until {nextTier.title}
          </p>
        )}
      </div>

      {/* Current unlocks */}
      <div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Active Features</p>
        <div className="space-y-1">
          {LEVEL_UNLOCKS[currentTier.level].map((unlock, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground font-medium">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: currentTier.color }} />
              {unlock}
            </div>
          ))}
        </div>
      </div>

      {/* Next level locked preview */}
      {nextTier && (
        <div className="rounded-xl p-4 border border-border/40 bg-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">UNLOCK AT LEVEL {nextTier.level} — {nextTier.title.toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LEVEL_UNLOCKS[nextTier.level].map((unlock, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-accent text-muted-foreground font-medium border border-border/30">{unlock}</span>
            ))}
          </div>
        </div>
      )}

      {/* XP Earning Guide */}
      <div className="rounded-xl p-4 bg-accent/30 border border-border/40">
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">How to Earn XP</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium">✦ Approved influencer tag</span><span className="text-right font-black" style={{ color: currentTier.color }}>+10 XP</span>
          <span className="text-muted-foreground font-medium">✦ Completed order via tag</span><span className="text-right font-black" style={{ color: currentTier.color }}>+20 XP</span>
          <span className="text-muted-foreground font-medium">✦ New brand follower</span><span className="text-right font-black" style={{ color: currentTier.color }}>+5 XP</span>
          <span className="text-muted-foreground font-medium">✦ Commission payout cycle</span><span className="text-right font-black" style={{ color: currentTier.color }}>+50 XP</span>
        </div>
      </div>
    </div>
  );
}
