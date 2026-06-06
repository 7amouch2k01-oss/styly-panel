import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Smartphone, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Overview() {
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.metrics.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery();

  const kpiCards = [
    {
      title: "Total Users",
      value: metrics?.totalUsers || "0",
      change: "+12.5%",
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Active Devices",
      value: metrics?.activeDevices || "0",
      change: "+8.2%",
      icon: Smartphone,
      color: "text-purple-400",
    },
    {
      title: "Total Revenue",
      value: metrics?.totalRevenue ? `$${metrics.totalRevenue}` : "$0",
      change: "+23.1%",
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: "Total Orders",
      value: metrics?.totalOrders || "0",
      change: "+5.4%",
      icon: ShoppingCart,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to the Styly Admin Dashboard. Here's your business at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {metricsLoading ? <Skeleton className="h-8 w-20" /> : card.value}
                </div>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {card.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions and updates across your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              activity.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{log.action}</p>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">{log.entityType}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.description || `${log.entityType} action`}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
