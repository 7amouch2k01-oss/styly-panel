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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, MoreHorizontal, Heart, MessageCircle, Eye, EyeOff, Flag, Trash2, ImageIcon,
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
    <Badge variant="outline" className={map[status] ?? map.active}>
      {status ?? "active"}
    </Badge>
  );
}

// ─── Engagement pill ──────────────────────────────────────────────────────────
function Engagement({ likes, comments }: { likes: number; comments: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <Heart className="h-3.5 w-3.5 text-rose-400" />
        {likes ?? 0}
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle className="h-3.5 w-3.5 text-sky-400" />
        {comments ?? 0}
      </span>
    </div>
  );
}

// ─── Photo thumbnail with preview dialog ─────────────────────────────────────
function PhotoStrip({ imageUrl, caption }: { imageUrl?: string; caption?: string }) {
  const [open, setOpen] = useState(false);
  if (!imageUrl) {
    return (
      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-12 w-12 rounded-lg overflow-hidden border border-border/40 hover:ring-2 hover:ring-primary/40 transition"
      >
        <img src={imageUrl} alt="post" className="h-full w-full object-cover" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
          </DialogHeader>
          <img src={imageUrl} alt="post" className="w-full rounded-xl object-contain max-h-[70vh]" />
          {caption && <p className="text-sm text-muted-foreground mt-2">{caption}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Products() {
  const { data: posts = [], isLoading, refetch } = trpc.posts.adminList.useQuery();
  const updateStatus = trpc.posts.updateStatus.useMutation();
  const deleteMutation = trpc.posts.delete.useMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [postToDelete, setPostToDelete] = useState<any>(null);

  const filtered = (posts as any[]).filter((p: any) => {
    const matchSearch =
      (p.caption ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.author?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase());
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
      toast.success("Post deleted");
      setPostToDelete(null);
    } catch {
      toast.error("Failed to delete post");
    }
  }

  const total   = (posts as any[]).length;
  const active  = (posts as any[]).filter((p: any) => (p.status ?? "active") === "active").length;
  const hidden  = (posts as any[]).filter((p: any) => p.status === "hidden").length;
  const flagged = (posts as any[]).filter((p: any) => p.status === "flagged").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Posts Management</h1>
        <p className="text-muted-foreground">
          Review, moderate and manage all user-generated posts
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Posts",  value: total,   color: "text-primary" },
          { label: "Active",       value: active,  color: "text-emerald-400" },
          { label: "Hidden",       value: hidden,  color: "text-slate-400" },
          { label: "Flagged",      value: flagged, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{isLoading ? "—" : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by caption, user, or category…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            {isLoading ? "Loading…" : `${filtered.length} post${filtered.length !== 1 ? "s" : ""} found`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="pl-6 w-20">Photo(s)</TableHead>
                  <TableHead>Who Posted</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell className="pl-6"><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((post: any) => (
                    <TableRow key={post.id} className="border-border/50 hover:bg-accent/5">

                      {/* Photo(s) */}
                      <TableCell className="pl-6">
                        <PhotoStrip imageUrl={post.imageUrl} caption={post.caption} />
                      </TableCell>

                      {/* Who Posted */}
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7 flex-shrink-0">
                            <AvatarImage src={post.author?.avatarUrl} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {(post.author?.name ?? "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium leading-tight truncate">
                              {post.author?.name ?? "Unknown User"}
                            </span>
                            {post.author?.email && (
                              <span className="text-xs text-muted-foreground truncate">
                                {post.author.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Catégorie */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground capitalize">
                          {post.category ?? "—"}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <StatusBadge status={post.status ?? "active"} />
                      </TableCell>

                      {/* Engagement */}
                      <TableCell>
                        <Engagement likes={post.likes} comments={post.comments} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(post.status ?? "active") !== "active" && (
                              <DropdownMenuItem onClick={() => handleStatus(post, "active")}>
                                <Eye className="h-4 w-4 mr-2 text-emerald-400" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {(post.status ?? "active") !== "hidden" && (
                              <DropdownMenuItem onClick={() => handleStatus(post, "hidden")}>
                                <EyeOff className="h-4 w-4 mr-2 text-slate-400" />
                                Hide
                              </DropdownMenuItem>
                            )}
                            {(post.status ?? "active") !== "flagged" && (
                              <DropdownMenuItem onClick={() => handleStatus(post, "flagged")}>
                                <Flag className="h-4 w-4 mr-2 text-amber-400" />
                                Flag
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPostToDelete(post)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                      <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No posts found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={(o) => !o && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the post from the platform. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Post
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
