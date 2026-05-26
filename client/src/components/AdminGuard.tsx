import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      setLocation("/unauthorized");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
