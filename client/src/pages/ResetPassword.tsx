import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token");
    if (tok) {
      setToken(tok);
    } else {
      toast.error("Invalid reset link. No token provided.");
    }
  }, []);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: (data) => {
      setIsSubmitted(true);
      toast.success(data.message);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing password reset token");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetPasswordMutation.mutate({ token, newPassword });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border/40 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Set New Password</h1>
          <p className="text-xs text-muted-foreground">
            Enter your new password below to regain access to your Styly account.
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-4 py-4 animate-fade-in">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold">Password Reset Complete!</h2>
            <p className="text-xs text-muted-foreground">
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>
            <button
              onClick={() => setLocation("/auth")}
              className="w-full h-11 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block text-foreground/80">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/40 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block text-foreground/80">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/40 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending || !token}
              className="w-full h-11 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetPasswordMutation.isPending ? "Updating Password…" : "Reset Password"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setLocation("/auth")}
                className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
