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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Analytics() {
  const salesData = [
    { date: "Jan 1", sales: 2400, revenue: 2210 },
    { date: "Jan 8", sales: 1398, revenue: 2290 },
    { date: "Jan 15", sales: 9800, revenue: 2000 },
    { date: "Jan 22", sales: 3908, revenue: 2108 },
    { date: "Jan 29", sales: 4800, revenue: 2310 },
    { date: "Feb 5", sales: 3800, revenue: 2250 },
    { date: "Feb 12", sales: 4300, revenue: 2210 },
  ];

  const userGrowthData = [
    { month: "Jan", users: 400, activeUsers: 240 },
    { month: "Feb", users: 600, activeUsers: 380 },
    { month: "Mar", users: 900, activeUsers: 620 },
    { month: "Apr", users: 1200, activeUsers: 890 },
    { month: "May", users: 1600, activeUsers: 1200 },
    { month: "Jun", users: 2100, activeUsers: 1600 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 24000 },
    { month: "Feb", revenue: 18000 },
    { month: "Mar", revenue: 32000 },
    { month: "Apr", revenue: 28000 },
    { month: "May", revenue: 42000 },
    { month: "Jun", revenue: 38000 },
  ];

  const topDevices = [
    { name: "iPhone 15 Pro", sales: 2400 },
    { name: "Samsung S24", sales: 1398 },
    { name: "Google Pixel 8", sales: 1800 },
    { name: "OnePlus 12", sales: 1200 },
    { name: "Xiaomi 14", sales: 980 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into sales, users, and revenue trends
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4">
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Sales Trends</CardTitle>
            <CardDescription>
              Daily sales and revenue over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 40, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="oklch(0.7 0.18 265)"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.65 0.2 265)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Total and active users over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 40, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="oklch(0.7 0.18 265)"
                  fill="oklch(0.7 0.18 265 / 0.3)"
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stackId="1"
                  stroke="oklch(0.65 0.2 265)"
                  fill="oklch(0.65 0.2 265 / 0.3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Monthly revenue performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 40, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="oklch(0.65 0.2 265)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Devices */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Top Selling Devices</CardTitle>
            <CardDescription>
              Best performing products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topDevices}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={190} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 20, 40, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="sales" fill="oklch(0.65 0.2 265)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
