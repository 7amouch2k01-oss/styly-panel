import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Devices() {
  const { data: devices, isLoading } = trpc.devices.list.useQuery();

  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">In Stock</Badge>;
    } else if (stock > 0) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Low Stock</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Out of Stock</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Devices Inventory</h1>
        <p className="text-muted-foreground">
          Manage phone inventory, stock levels, and product information
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="samsung">Samsung</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="oneplus">OnePlus</SelectItem>
            <SelectItem value="xiaomi">Xiaomi</SelectItem>
          </SelectContent>
        </Select>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : devices && devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.id} className="border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <CardDescription>{device.category}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Device</DropdownMenuItem>
                      <DropdownMenuItem>Update Stock</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-semibold">${device.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  <span className="font-semibold">{device.stock} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStockBadge(device.stock)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No devices found
          </div>
        )}
      </div>
    </div>
  );
}
