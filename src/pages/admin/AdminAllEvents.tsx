import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search, Trash2, Eye, Check, X, Calendar, MapPin, Users, Pencil, Star, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_TABS = [
  { key: "all", label: "All Events" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Draft" },
  { key: "past", label: "Past" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  upcoming: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ongoing: "bg-primary/10 text-primary border-primary/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  past: "bg-muted text-muted-foreground border-transparent",
};

const AdminAllEvents = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteEvent, setDeleteEvent] = useState<any>(null);
  const [rejectEvent, setRejectEvent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchEvents();
  }, [isAdmin, adminCheckComplete]);

  const fetchEvents = async () => {
    setDataLoading(true);
    const [eventsRes, guestsRes] = await Promise.all([
      supabase
        .from("events")
        .select("*, profiles:created_by(full_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("event_guests")
        .select("event_id"),
    ]);

    setEvents(eventsRes.data || []);

    // Count guests per event
    const counts: Record<string, number> = {};
    (guestsRes.data || []).forEach((g: any) => {
      counts[g.event_id] = (counts[g.event_id] || 0) + 1;
    });
    setGuestCounts(counts);
    setDataLoading(false);
  };

  const categories = useMemo(() => {
    return [...new Set(events.map((e: any) => e.category))].filter(Boolean).sort();
  }, [events]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    events.forEach((e: any) => {
      const s = e.status || "draft";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e: any) => {
      if (activeTab !== "all" && e.status !== activeTab) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          e.title?.toLowerCase().includes(s) ||
          (e.profiles as any)?.full_name?.toLowerCase().includes(s) ||
          e.location?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [events, activeTab, categoryFilter, search]);

  const handleStatusChange = async (eventId: string, status: string) => {
    setProcessing(true);
    const { error } = await supabase.from("events").update({ status }).eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Event ${status}` });
      fetchEvents();
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectEvent) return;
    setProcessing(true);
    const { error } = await supabase
      .from("events")
      .update({ status: "rejected", rejection_reason: rejectionReason || null })
      .eq("id", rejectEvent.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event rejected" });
      setRejectEvent(null);
      setRejectionReason("");
      fetchEvents();
    }
    setProcessing(false);
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    setProcessing(true);
    const { error } = await supabase.from("events").delete().eq("id", deleteEvent.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      setDeleteEvent(null);
      fetchEvents();
    }
    setProcessing(false);
  };

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Seo title="All Events" canonical="/admin/events" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Events</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {events.length} total events on the platform
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[11px] px-1.5 py-0 rounded-full min-w-[20px] text-center ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted-foreground/10 text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, hosts, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || categoryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => { setSearch(""); setCategoryFilter("all"); }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Events Table */}
        <Card className="border">
          <CardContent className="p-0">
            {dataLoading ? (
              <div className="py-16 text-center text-muted-foreground">Loading events...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No events found</p>
                {(search || categoryFilter !== "all" || activeTab !== "all") && (
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Event</TableHead>
                    <TableHead className="font-semibold">Host</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Guests
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((event: any) => {
                    const guests = guestCounts[event.id] || 0;
                    const hostName = (event.profiles as any)?.full_name || "Unknown";
                    return (
                      <TableRow key={event.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            {event.image_url ? (
                              <img
                                src={event.image_url}
                                alt=""
                                className="h-9 w-14 rounded object-cover flex-shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="h-9 w-14 rounded bg-muted flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[200px]">{event.title}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                <span className="truncate max-w-[160px]">{event.location}</span>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{hostName}</TableCell>
                        <TableCell>
                          <div className="text-sm">{format(new Date(event.date), "MMM d, yyyy")}</div>
                          <div className="text-[11px] text-muted-foreground">{format(new Date(event.date), "h:mm a")}</div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {event.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{guests}</span>
                            {event.max_attendees && (
                              <span className="text-muted-foreground text-xs">/ {event.max_attendees}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize border ${
                              STATUS_STYLES[event.status] || STATUS_STYLES.draft
                            }`}
                          >
                            {event.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <a href={`/event/${event.id}`} target="_blank" rel="noreferrer">
                                  <Eye className="h-4 w-4 mr-2" />View Event
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {event.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(event.id, "approved")} disabled={processing}>
                                    <Check className="h-4 w-4 mr-2 text-emerald-500" />Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setRejectEvent(event); setRejectionReason(""); }} disabled={processing}>
                                    <X className="h-4 w-4 mr-2 text-destructive" />Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {event.status === "rejected" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(event.id, "approved")} disabled={processing}>
                                    <Check className="h-4 w-4 mr-2 text-emerald-500" />Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {event.status === "approved" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(event.id, "pending")} disabled={processing}>
                                    <Clock className="h-4 w-4 mr-2" />Move to Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteEvent(event)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Result count */}
        {!dataLoading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {filtered.length} of {events.length} events
          </p>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={processing}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectEvent} onOpenChange={() => setRejectEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>Provide a reason for rejecting "{rejectEvent?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason (Optional)</Label>
              <Textarea
                placeholder="Let the creator know why this event was rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectEvent(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>Reject Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAllEvents;
