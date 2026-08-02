/**
 * GradePanel.tsx
 * Displays user grade, style points, commission rate, progress bar,
 * locked feature previews, and grade-up celebration.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Lock, TrendingUp, Award, Zap, Crown, Sparkles } from "lucide-react";

const GRADE_TIERS = [
  { grade: 1, title: "Starter",       emoji: "🌱", sp: 0,    rate: 1,  color: "#94a3b8", next: 200 },
  { grade: 2, title: "Influencer",    emoji: "✨", sp: 200,  rate: 2,  color: "#60a5fa", next: 600 },
  { grade: 3, title: "Ambassador",    emoji: "🔥", sp: 600,  rate: 3,  color: "#f97316", next: 1500 },
  { grade: 4, title: "Expert",        emoji: "💎", sp: 1500, rate: 4,  color: "#a78bfa", next: 4000 },
  { grade: 5, title: "Elite Creator", emoji: "👑", sp: 4000, rate: 5,  color: "#fbbf24", next: null },
];

const GRADE_UNLOCKS: Record<number, string[]> = {
  1: ["Post outfits", "1 mannequin slot", "Standard tag requests", "1% commission on sales"],
  2: ["2nd mannequin slot", "Explore featured section", "Post scheduling", "2% commission on sales"],
  3: ["3rd mannequin slot", "Verified ✓ badge on profile", "Priority tag review by brands", "Lookbook Canvas access", "3% commission on sales"],
  4: ["Custom profile theme & animated banner", "\"Expert Pick\" label on posts", "Direct message to brands", "VIP brand campaign access", "4% commission on sales"],
  5: ["Homepage Featured Influencer slot", "Unlimited mannequin slots", "AI Style Assistant full access", "Exclusive Elite Creator badge", "Offline brand event invitations", "5% commission on sales"],
};

interface GradePanelProps {
  userId?: number;
  compact?: boolean;
}

export function GradePanel({ userId, compact = false }: GradePanelProps) {
  const { data: grade, isLoading } = trpc.userGrade.get.useQuery();
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevGrade, setPrevGrade] = useState<number | null>(null);

  useEffect(() => {
    if (!grade) return;
    if (prevGrade !== null && grade.grade > prevGrade) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
    setPrevGrade(grade.grade);
  }, [grade?.grade]);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl bg-accent/40 h-48" />
    );
  }

  const currentTier = GRADE_TIERS.find(t => t.grade === (grade?.grade || 1)) || GRADE_TIERS[0];
  const nextTier = GRADE_TIERS.find(t => t.grade === (grade?.grade || 1) + 1);
  const currentSP = grade?.stylePoints || 0;
  const progressPct = nextTier
    ? Math.min(100, ((currentSP - currentTier.sp) / (nextTier.sp - currentTier.sp)) * 100)
    : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
        style={{ background: `${currentTier.color}20`, color: currentTier.color, border: `1px solid ${currentTier.color}40` }}>
        <span>{currentTier.emoji}</span>
        <span>{currentTier.title}</span>
        <span className="opacity-60 text-xs">G{currentTier.grade}</span>
      </div>
    );
  }

  return (
    <>
      {/* Grade-Up Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative text-center p-10 rounded-3xl max-w-md mx-4"
              style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)", border: `2px solid ${currentTier.color}` }}
            >
              {/* Confetti dots */}
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ background: currentTier.color, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  animate={{ y: [0, -60, 60, 0], opacity: [1, 0.5, 0], scale: [1, 1.5, 0] }}
                  transition={{ duration: 2, delay: Math.random() * 0.5, repeat: 1 }}
                />
              ))}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-7xl mb-4"
              >
                {currentTier.emoji}
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-1">Grade Up!</h2>
              <p className="text-xl font-bold mb-4" style={{ color: currentTier.color }}>
                You are now a {currentTier.title}!
              </p>
              <div className="text-left space-y-1 mb-6">
                <p className="text-white/60 text-sm font-semibold mb-2">🎁 New Unlocks:</p>
                {GRADE_UNLOCKS[currentTier.grade].map((u, i) => (
                  <p key={i} className="text-white/80 text-sm">✓ {u}</p>
                ))}
              </div>
              <button
                onClick={() => setShowCelebration(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-black"
                style={{ background: currentTier.color }}
              >
                Let's Go! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl p-6 space-y-5 bg-card border border-border/50 text-card-foreground shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{currentTier.emoji}</div>
            <div>
              <h3 className="font-black text-xl text-foreground">{currentTier.title}</h3>
              <p className="text-muted-foreground text-sm font-medium">Grade {currentTier.grade} of 5</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: currentTier.color }}>{currentTier.rate}%</p>
            <p className="text-muted-foreground text-xs font-semibold">User Commission Rate</p>
          </div>
        </div>

        {/* SP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>{currentSP.toLocaleString()} SP</span>
            <span>{nextTier ? `${nextTier.sp.toLocaleString()} SP for ${nextTier.emoji} ${nextTier.title}` : "Max Grade Achieved! 👑"}</span>
          </div>
          <div className="h-2.5 rounded-full bg-accent/60 overflow-hidden border border-border/30">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${currentTier.color}80, ${currentTier.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          {nextTier && (
            <p className="text-xs text-muted-foreground text-center font-medium">
              {(nextTier.sp - currentSP).toLocaleString()} SP until next grade
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Style Points", value: currentSP.toLocaleString(), icon: <Star className="w-4 h-4" /> },
            { label: "Total Earned", value: `${(grade?.totalEarned || 0).toFixed(0)} TND`, icon: <TrendingUp className="w-4 h-4" /> },
            { label: "Total Paid", value: `${(grade?.totalPaid || 0).toFixed(0)} TND`, icon: <Award className="w-4 h-4" /> },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 text-center bg-accent/30 border border-border/40">
              <div className="flex justify-center mb-1 opacity-80" style={{ color: currentTier.color }}>{stat.icon}</div>
              <p className="font-black text-foreground text-sm">{stat.value}</p>
              <p className="text-muted-foreground text-[11px] font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Current Grade Unlocks */}
        <div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Your Unlocked Features</p>
          <div className="space-y-1">
            {GRADE_UNLOCKS[currentTier.grade].map((unlock, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: currentTier.color }} />
                {unlock}
              </div>
            ))}
          </div>
        </div>

        {/* Next grade preview */}
        {nextTier && (
          <div className="rounded-xl p-4 border border-border/40 bg-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">UNLOCK AT GRADE {nextTier.grade} — {nextTier.title.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GRADE_UNLOCKS[nextTier.grade].map((unlock, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-accent text-muted-foreground font-medium border border-border/30">{unlock}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Compact grade badge for use in feed posts / profile headers
// ─────────────────────────────────────────────────────────────
export function GradeBadge({ grade = 1, size = "sm" }: { grade?: number; size?: "xs" | "sm" | "md" }) {
  const tier = GRADE_TIERS.find(t => t.grade === grade) || GRADE_TIERS[0];
  const sizeClasses = { xs: "text-xs px-1.5 py-0.5", sm: "text-sm px-2 py-1", md: "text-base px-3 py-1.5" };
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ background: `${tier.color}18`, color: tier.color, border: `1px solid ${tier.color}35` }}
    >
      <span>{tier.emoji}</span>
      <span>{tier.title}</span>
    </motion.span>
  );
}
