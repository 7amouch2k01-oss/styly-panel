import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, MoreHorizontal, Check, X, Building2, Store, Eye,
  Award, Globe, Package, Trash2, CheckCircle2, ShieldCheck, MapPin, Tag
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BrandFormDialog } from "@/components/BrandFormDialog";

export default function Brands() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [viewBrandModal, setViewBrandModal] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<any>(null);

  const { data: brands = [], isLoading: brandsLoading, refetch: refetchBrands } = trpc.brands.list.useQuery();
  const { data: devices = [], isLoading: devicesLoading } = trpc.devices.list.useQuery();
  const { data: pendingRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = trpc.brandStore.listPending.useQuery();

  const approveMutation = trpc.brandStore.approve.useMutation();
  const deleteMutation = trpc.brands.delete.useMutation();
  const updateBrandMutation = trpc.brands.update.useMutation();
  const utils = trpc.useUtils();

  const isLoading = brandsLoading || devicesLoading || requestsLoading;

  const filteredBrands = brands.filter((brand: any) =>
    (brand.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.country || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overview metrics calculations
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b: any) => b.isActive).length;
  const pendingCount = (pendingRequests as any[]).length;
  const totalProducts = devices.filter((d: any) => d.brandId !== null).length;

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setFormDialogOpen(true);
  };

  const handleEditBrand = (brand: any) => {
    setSelectedBrand(brand);
    setFormDialogOpen(true);
  };

  const handleDeleteBrand = (brand: any) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (brand: any) => {
    try {
      await updateBrandMutation.mutateAsync({
        id: brand.id,
        isActive: !brand.isActive,
      });
      await refetchBrands();
      toast.success(`Brand ${brand.name} is now ${!brand.isActive ? "Active" : "Inactive"}`);
    } catch {
      toast.error("Failed to update brand status");
    }
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: brandToDelete.id });
      await utils.brands.list.invalidate();
      toast.success(`${brandToDelete?.name} deleted successfully`);
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  const handleApproveStore = async (storeId: number, approve: boolean) => {
    try {
      await approveMutation.mutateAsync({ storeId, approve });
      toast.success(approve ? "Brand store application approved! 🎉" : "Brand store application rejected.");
      await refetchRequests();
      await refetchBrands();
    } catch (error: any) {
      toast.error(error.message || "Failed to process approval");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Fashion Brands Management</h1>
        <p className="text-sm text-muted-foreground">
          Review official brand partner registrations, toggle partner active status, and inspect catalog products.
        </p>
      </div>

      {/* 4 Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Registered Brands</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : totalBrands}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Partners in platform database</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Stores</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{isLoading ? <Skeleton className="h-8 w-16" /> : activeBrands}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Live taggable storefronts</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pending Applications</CardTitle>
              <Store className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : pendingCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Owner approvals needed</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Catalog Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-500">{isLoading ? <Skeleton className="h-8 w-16" /> : totalProducts}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Products across all brands</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList className="rounded-xl p-1 bg-muted/60">
            <TabsTrigger value="all" className="rounded-lg text-xs font-bold">
              All Brands ({brands.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs font-bold relative">
              Pending Applications
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                className="pl-10 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddBrand} className="rounded-xl gap-1.5 text-xs font-bold">
              <Plus size={14} /> Add Brand
            </Button>
          </div>
        </div>

        {/* All Brands Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-3xl" />)
            ) : filteredBrands.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No brands matching "{searchQuery}" found.
              </div>
            ) : (
              filteredBrands.map((brand: any) => (
                <Card
                  key={brand.id}
                  onClick={() => setViewBrandModal(brand)}
                  className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl p-5 hover:border-primary/40 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover rounded-2xl" />
                          ) : (
                            brand.name[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-foreground">{brand.name}</h3>
                            {brand.isActive && <CheckCircle2 size={13} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{brand.category || "Fashion"} · {brand.country}</p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={brand.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}
                      >
                        {brand.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {brand.description || "Official fashion brand partner on the Styly network."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-3" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-muted-foreground font-mono">ID #{brand.id}</span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(brand)}
                        className="h-8 text-xs rounded-xl"
                      >
                        {brand.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-xl">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => setViewBrandModal(brand)} className="text-xs font-semibold cursor-pointer">
                            <Eye size={13} className="mr-1.5" /> View Brand Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBrand(brand)} className="text-xs font-semibold cursor-pointer">
                            Edit Brand
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteBrand(brand)} className="text-xs font-semibold text-rose-500 cursor-pointer">
                            <Trash2 size={13} className="mr-1.5" /> Delete Brand
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Pending Applications Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground border-dashed rounded-3xl">
                No pending brand store owner applications at this time.
              </Card>
            ) : (
              pendingRequests.map((req: any) => (
                <Card key={req.id} className="border border-border/50 bg-card/50 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{req.brandName}</h3>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]">
                        Pending Review
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Owner: <strong>{req.ownerName}</strong> · Email: {req.email} · Phone: {req.phone || "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Applied: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Recent"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveStore(req.id, true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold gap-1"
                    >
                      <Check size={13} /> Approve Brand Store
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproveStore(req.id, false)}
                      className="rounded-xl text-xs font-bold gap-1"
                    >
                      <X size={13} /> Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Brand Detailed Modal */}
      {viewBrandModal && (
        <Dialog open={!!viewBrandModal} onOpenChange={() => setViewBrandModal(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <span>{viewBrandModal.name} · Partner Details</span>
                <Badge variant="outline" className={viewBrandModal.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted"}>
                  {viewBrandModal.isActive ? "Active" : "Inactive"}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Origin Country</span>
                    <p className="font-bold text-foreground mt-0.5">{viewBrandModal.country}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Fashion Category</span>
                    <p className="font-bold text-foreground mt-0.5">{viewBrandModal.category}</p>
                  </div>
                </div>
                {viewBrandModal.website && (
                  <div className="pt-2">
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Official Website</span>
                    <p className="text-xs text-primary font-mono mt-0.5">{viewBrandModal.website}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Brand Bio & Overview</span>
                <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl border border-border/40 mt-1">
                  {viewBrandModal.description || "Official brand registered on Styly fashion platform."}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl text-xs"
                  onClick={() => {
                    handleToggleActive(viewBrandModal);
                    setViewBrandModal(null);
                  }}
                >
                  {viewBrandModal.isActive ? "Deactivate Brand" : "Activate Brand"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleEditBrand(viewBrandModal);
                    setViewBrandModal(null);
                  }}
                  className="rounded-xl text-xs"
                >
                  Edit Information
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Brand Form Dialog */}
      <BrandFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        brand={selectedBrand}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand "{brandToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the brand from the marketplace and unlink associated products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              Delete Brand
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
