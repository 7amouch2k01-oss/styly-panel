import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Loader2, DollarSign, TrendingUp, TrendingDown, Undo2, BadgePercent, Sparkles } from "lucide-react";

export default function Analytics() {
  const { data: fullAnalytics = [], isLoading: fullLoading } = trpc.analytics.full.useQuery();
  const { data: salesTrends = [] } = trpc.analytics.salesTrends.useQuery();
  const { data: userGrowth = [] } = trpc.analytics.userGrowth.useQuery();
  const { data: financial, isLoading: financeLoading } = trpc.analytics.financialSummary.useQuery();

  const isLoading = fullLoading || financeLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Platform Financials & Growth</h1>
        <p className="text-sm text-muted-foreground">
          Live financial ledger of money gained, creator commissions paid, and customer refunds processed.
        </p>
      </div>

      {/* 4 Financial Performance Overview Cards (Money Gained & Lost) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Gross Order Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {isLoading ? "..." : `${(financial?.grossRevenue || 0).toFixed(2)} TND`}
            </div>
            <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> Total incoming transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Money Refunded</CardTitle>
              <Undo2 className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-500">
              {isLoading ? "..." : `-${(financial?.totalRefunds || 0).toFixed(2)} TND`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {financial?.refundsCount || 0} returned orders refunded
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Commissions Disbursed</CardTitle>
              <BadgePercent className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">
              {isLoading ? "..." : `-${(financial?.commissionsPaid || 0).toFixed(2)} TND`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {(financial?.commissionsPending || 0).toFixed(2)} TND pending payout
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Retained Net Gain</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              {isLoading ? "..." : `+${(financial?.netGain || 0).toFixed(2)} TND`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Gross sales minus refunds & creator payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Orders Trends */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Monthly Sales & Net Revenue</CardTitle>
            <CardDescription className="text-xs">Gross checkouts vs customer refunds and net retained volume (TND)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fullAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} dot={false} name="Gross Sales (TND)" />
                <Line type="monotone" dataKey="refunds" stroke="#a855f7" strokeWidth={2} dot={false} name="Refunds Processed (TND)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="netRevenue" stroke="#10b981" strokeWidth={2.5} dot={false} name="Net Revenue (TND)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Audience & Creator Acquisition</CardTitle>
            <CardDescription className="text-xs">Cumulative registered accounts on the Styly fashion platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="rgba(139,92,246,0.15)" name="Total Users" />
                <Area type="monotone" dataKey="newUsers" stroke="#06b6d4" fill="rgba(6,182,212,0.1)" name="New This Month" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
