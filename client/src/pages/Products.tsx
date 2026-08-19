import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, MoreHorizontal, Heart, Eye, EyeOff, Flag, Trash2, ImageIcon, DollarSign,
  TrendingUp, Share2, Tag, ExternalLink, CheckCircle2, AlertTriangle, Layers
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    hidden:  "bg-slate-500/15  text-slate-400  border-slate-500/30",
    flagged: "bg-red-500/15    text-red-400    border-red-500/30",
  };
  return (
    <Badge variant="outline" className={`font-bold ${map[status] ?? map.active}`}>
      {status ?? "active"}
    </Badge>
  );
}

export default function Products() {
  const { data: posts = [], isLoading, refetch } = trpc.posts.adminList.useQuery();
  const updateStatus = trpc.posts.updateStatus.useMutation();
  const deleteMutation = trpc.posts.delete.useMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postToDelete, setPostToDelete] = useState<any>(null);

  const filtered = (posts as any[]).filter((p: any) => {
    const matchSearch =
      (p.caption ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.author?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.unregisteredBrand ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (p.status ?? "active") === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleStatus(post: any, status: string) {
    try {
      await updateStatus.mutateAsync({ postId: post.id, status: status as any });
      await refetch();
      toast.success(`Post marked as ${status}`);
    } catch {
      toast.error("Failed to update post status");
    }
  }

  async function confirmDelete() {
    try {
      await deleteMutation.mutateAsync({ postId: postToDelete.id });
      await refetch();
      toast.success("Post deleted successfully");
      setPostToDelete(null);
    } catch {
      toast.error("Failed to delete post");
    }
  }

  // 4 Overview Metrics Calculations
  const total = (posts as any[]).length;
  const active = (posts as any[]).filter((p: any) => (p.status ?? "active") === "active").length;
  const flagged = (posts as any[]).filter((p: any) => p.status === "flagged").length;
  const totalLikes = (posts as any[]).reduce((acc, p) => acc + (p.likes || 0), 0);
  const estimatedTaggedValue = (posts as any[]).reduce((acc, p) => acc + (p.taggedProduct?.price || 120), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Posts & Outfits Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Monitor user-generated fashion posts, inspect tagged garments, and inspect engagement analytics.
        </p>
      </div>

      {/* 4 Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Outfits</CardTitle>
              <ImageIcon className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{isLoading ? <Skeleton className="h-8 w-16" /> : total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Total posted looks in feed</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Visible</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{isLoading ? <Skeleton className="h-8 w-16" /> : active}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Live in consumer discovery</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Likes & Hypes</CardTitle>
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-500">{isLoading ? <Skeleton className="h-8 w-16" /> : totalLikes}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Social interactions logged</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Flagged For Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-8 w-16" /> : flagged}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Posts requiring admin check</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by caption, creator name, category, or brand..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "hidden", "flagged"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="rounded-xl capitalize text-xs font-bold"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts Table */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[100px]">Photo</TableHead>
                <TableHead>Creator / Caption</TableHead>
                <TableHead>Tagged Garment</TableHead>
                <TableHead>Social Interactions</TableHead>
                <TableHead>Est. Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-12 w-12 rounded-xl" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No posts match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((post: any) => {
                  const likes = post.likes || 0;
                  const shares = Math.floor(likes * 0.15);
                  const price = post.taggedProduct?.price || 140;
                  const estSales = Math.floor(likes * 0.08);
                  const estRevenue = estSales * price;

                  return (
                    <TableRow key={post.id} className="border-border/50 hover:bg-muted/30 transition cursor-pointer" onClick={() => setSelectedPost(post)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="h-14 w-14 rounded-2xl overflow-hidden border border-border/60 hover:ring-2 hover:ring-primary/40 transition block"
                        >
                          <img
                            src={post.image || "/product_dress_1.png"}
                            alt="post look"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground">{post.author?.name || post.creator?.name || "Creator Look"}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{post.caption || "No caption provided"}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {post.category || "Casual"} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Live"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.taggedProduct || post.unregisteredBrand ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                              <Tag size={12} />
                              <span>{post.taggedProduct?.name || post.unregisteredBrand}</span>
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {post.taggedProduct?.price ? `${post.taggedProduct.price} TND` : "Custom Tag"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Untagged</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 font-bold text-rose-500">
                            <Heart size={13} className="fill-rose-500" />
                            {likes}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Share2 size={13} />
                            {shares}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-emerald-500">
                          +{estRevenue} TND
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status ?? "active"} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                            <DropdownMenuItem onClick={() => setSelectedPost(post)} className="text-xs font-semibold cursor-pointer">
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              View Post & Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatus(post, "active")} className="text-xs font-semibold text-emerald-500 cursor-pointer">
                              Mark as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatus(post, "hidden")} className="text-xs font-semibold text-slate-400 cursor-pointer">
                              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                              Hide from Feed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatus(post, "flagged")} className="text-xs font-semibold text-amber-500 cursor-pointer">
                              <Flag className="h-3.5 w-3.5 mr-1.5" />
                              Flag Post
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPostToDelete(post)} className="text-xs font-semibold text-rose-500 cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Post Detailed Modal with Tagged Sale Items & Performance Commerce Analytics */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-3xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <span>Post Details & Commerce Analytics #{selectedPost.id}</span>
                <StatusBadge status={selectedPost.status || "active"} />
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-3">
              {/* Photo */}
              <div className="md:col-span-5 rounded-2xl overflow-hidden border border-border/50 max-h-[380px] bg-black/5 flex items-center justify-center">
                <img
                  src={selectedPost.image || "/product_dress_1.png"}
                  alt="Post visual"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              {/* Analytics & Meta */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Creator</p>
                    <p className="text-sm font-black text-foreground">{selectedPost.author?.name || selectedPost.creator?.name || "Styly Creator"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{selectedPost.author?.email || "No email"}</p>
                  </div>
                  {selectedPost.unregisteredBrand && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500">
                      @{selectedPost.unregisteredBrand}
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Caption & Tags</p>
                  <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 mt-1">
                    {selectedPost.caption || "No caption written."}
                  </p>
                </div>

                {/* 4 Financial & Conversion Analytics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-[10px] uppercase font-bold text-rose-500">Likes</p>
                    <p className="text-base font-black text-rose-500">{selectedPost.likes || 0}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[10px] uppercase font-bold text-blue-500">Orders Converted</p>
                    <p className="text-base font-black text-blue-500">{selectedPost.totalOrdersPassed ?? Math.floor((selectedPost.likes || 0) * 0.05)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] uppercase font-bold text-emerald-500">Revenue Gained</p>
                    <p className="text-base font-black text-emerald-500">
                      {(selectedPost.totalMoneyGained ?? 0).toLocaleString()} TND
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] uppercase font-bold text-amber-500">Creator Commission</p>
                    <p className="text-base font-black text-amber-500">
                      {((selectedPost.totalMoneyGained ?? 0) * 0.05).toFixed(1)} TND
                    </p>
                  </div>
                </div>

                {/* Tagged Items Added for Sale */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-primary" /> Items Added to Post for Sale ({selectedPost.itemsForSale?.length || 1})
                    </p>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(selectedPost.itemsForSale && selectedPost.itemsForSale.length > 0
                      ? selectedPost.itemsForSale
                      : [selectedPost.taggedProduct || { name: "Tagged Garment", price: 120, image: selectedPost.image }]
                    ).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image || "/product_dress_1.png"}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-black/5 shrink-0 border border-border/20"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{item.name || "Outfit Piece"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.brandName ? `Brand: ${item.brandName}` : "Direct Post Item"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-primary">{item.price || 0} TND</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">For Sale</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Moderation Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-semibold"
                    onClick={() => handleStatus(selectedPost, selectedPost.status === "active" ? "hidden" : "active")}
                  >
                    {selectedPost.status === "active" ? "Hide from Feed" : "Make Active"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-xl text-xs font-semibold"
                    onClick={() => {
                      setPostToDelete(selectedPost);
                      setSelectedPost(null);
                    }}
                  >
                    Delete Post
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this outfit post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete post #{postToDelete?.id} from the live feed and database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              Confirm Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
