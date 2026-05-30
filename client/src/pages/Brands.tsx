import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Brands() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<any>(null);

  // Mock brands data for now
  const brands = [
    { id: 1, name: "Nike", country: "USA", category: "Mixed", productsCount: 45, status: "active" },
    { id: 2, name: "Adidas", country: "Germany", category: "Mixed", productsCount: 38, status: "active" },
    { id: 3, name: "Zara", country: "Spain", category: "Clothing", productsCount: 52, status: "active" },
    { id: 4, name: "H&M", country: "Sweden", category: "Clothing", productsCount: 61, status: "active" },
    { id: 5, name: "Gucci", country: "Italy", category: "Accessories", productsCount: 28, status: "active" },
    { id: 6, name: "Zen", country: "Tunisia", category: "Clothing", productsCount: 15, status: "active" },
    { id: 7, name: "Exist", country: "Tunisia", category: "Mixed", productsCount: 22, status: "active" },
    { id: 8, name: "Carthage", country: "Tunisia", category: "Accessories", productsCount: 18, status: "active" },
    { id: 9, name: "Tommy Hilfiger", country: "USA", category: "Clothing", productsCount: 35, status: "active" },
    { id: 10, name: "Calvin Klein", country: "USA", category: "Mixed", productsCount: 42, status: "active" },
  ];

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBrands = brands.length;
  const activeBrands = brands.filter(b => b.status === "active").length;
  const totalProducts = brands.reduce((sum, b) => sum + b.productsCount, 0);

  const handleDeleteBrand = (brand: any) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    toast.success(`${brandToDelete?.name} deleted successfully`);
    setDeleteDialogOpen(false);
    setBrandToDelete(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Brands Management</h1>
        <p className="text-muted-foreground">
          Manage fashion brands, view product counts, and track brand performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Brands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{totalBrands}</div>
            <p className="text-xs text-green-500">+2 this month</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Brands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{activeBrands}</div>
            <p className="text-xs text-green-500">100% active</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{totalProducts}</div>
            <p className="text-xs text-green-500">Across all brands</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands by name or country..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Brands Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Brand Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Country</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Products</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium">{brand.name}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{brand.country}</td>
                    <td className="px-6 py-3 text-sm">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {brand.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">{brand.productsCount}</td>
                    <td className="px-6 py-3 text-sm">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {brand.status.charAt(0).toUpperCase() + brand.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Brand</DropdownMenuItem>
                          <DropdownMenuItem>View Products</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteBrand(brand)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {brandToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
