import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ProductFormDialog } from "@/components/ProductFormDialog";
import { UpdateStockDialog } from "@/components/UpdateStockDialog";
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

export default function Products() {
  const { data: products = [], isLoading } = trpc.devices.list.useQuery();
  const { data: brands = [] } = trpc.brands.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  
  const deleteMutation = trpc.devices.delete.useMutation();
  const utils = trpc.useUtils();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || 
                            product.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">In Stock</Badge>;
    } else if (stock > 0) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Low Stock</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Out of Stock</Badge>;
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormDialogOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setFormDialogOpen(true);
  };

  const handleUpdateStock = (product: any) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  };

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: productToDelete.id });
      await utils.devices.list.invalidate();
      toast.success("Product deleted successfully");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Products Inventory</h1>
        <p className="text-muted-foreground">
          Manage fashion products, stock levels, and inventory information
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="shoes">Shoes</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Button className="gap-2" onClick={handleAddProduct}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
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
                ) : filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card key={product.id} className="border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>
                      {product.brandId ? (brands.find((b: any) => b.id === product.brandId)?.name || "Fashion Product") : "No Brand"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                        Edit Product
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStock(product)}>
                        Update Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-semibold">${product.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  <span className="font-semibold">{product.stock} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStockBadge(product.stock)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No products found
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        product={selectedProduct}
      />

      {/* Update Stock Dialog */}
      <UpdateStockDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={selectedProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {productToDelete?.name}? This action cannot be undone.
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
