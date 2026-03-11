import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Search, Trash2, Eye, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  upcoming: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ongoing: "bg-primary/10 text-primary",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  past: "bg-muted text-muted-foreground",
};

const AdminAllEvents = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteEvent, setDeleteEvent] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchEvents();
  }, [isAdmin, adminCheckComplete]);

  const fetchEvents = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*, profiles:created_by(full_name)")
      .order("created_at", { ascending: false });

    const evts = data || [];
    setEvents(evts);
    const cats = [...new Set(evts.map((e: any) => e.category))].filter(Boolean);
    setCategories(cats as string[]);
    setDataLoading(false);
  };

  const handleStatusChange = async (eventId: string, status: string) => {
    const { error } = await supabase.from("events").update({ status }).eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Event ${status}` });
      fetchEvents();
    }
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    const { error } = await supabase.from("events").delete().eq("id", deleteEvent.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      setDeleteEvent(null);
      fetchEvents();
    }
  };

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = events.filter((e: any) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.title?.toLowerCase().includes(s) || (e.profiles as any)?.full_name?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <AdminLayout>
      <Seo title="All Events" canonical="/admin/events" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">All Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all platform events</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events or hosts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {dataLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading events...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No events found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{event.title}</TableCell>
                      <TableCell className="text-sm">{(event.profiles as any)?.full_name || "Unknown"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{event.category}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_COLORS[event.status] || ""}`}>
                          {event.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(event.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/event/${event.id}`} target="_blank"><Eye className="h-4 w-4 mr-2" />View Event</a>
                            </DropdownMenuItem>
                            {event.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(event.id, "approved")}>
                                  <Check className="h-4 w-4 mr-2" />Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(event.id, "rejected")}>
                                  <X className="h-4 w-4 mr-2" />Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteEvent(event)}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteEvent?.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminAllEvents;
