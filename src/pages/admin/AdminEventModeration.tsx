import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Eye, Calendar, MapPin, Globe, ShieldCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorCard } from "@/components/common/ErrorCard";
import { useProcessingSet } from "@/hooks/useAsyncAction";

const AdminEventModeration = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [previewEvent, setPreviewEvent] = useState<any>(null);
  const [rejectEvent, setRejectEvent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectProcessing, setRejectProcessing] = useState(false);
  const { isProcessing, startProcessing, stopProcessing } = useProcessingSet();
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchPending();
  }, [isAdmin, adminCheckComplete]);

  const fetchPending = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*, profiles:created_by(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load pending events");
    } finally {
      setDataLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    if (isProcessing(eventId)) return;
    startProcessing(eventId);
    const { error } = await supabase.from("events").update({ status: "approved" }).eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event approved", description: "Now visible in Discover." });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
    stopProcessing(eventId);
  };

  const handleReject = async () => {
    if (!rejectEvent) return;
    setRejectProcessing(true);
    const { error } = await supabase
      .from("events")
      .update({ status: "rejected", rejection_reason: rejectionReason || null })
      .eq("id", rejectEvent.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event rejected" });
      setEvents(prev => prev.filter(e => e.id !== rejectEvent.id));
      setRejectEvent(null);
      setRejectionReason("");
    }
    setRejectProcessing(false);
  };

  if (dataLoading) {
    return (
      <>
        <Seo title="Event Moderation" canonical="/admin/events/pending" />
        <div className="space-y-6">
          <div>
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Seo title="Event Moderation" canonical="/admin/events/pending" />
        <div className="py-20">
          <ErrorCard message={error} onRetry={fetchPending} />
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Event Moderation" canonical="/admin/events/pending" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Event Moderation</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve events before they go live</p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">No pending events to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event: any) => {
              const eventProcessing = isProcessing(event.id);
              return (
                <Card key={event.id} className="overflow-hidden border">
                  {event.image_url && (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">by {(event.profiles as any)?.full_name || "Unknown"}</p>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.date), "MMM d, yyyy · h:mm a")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.meeting_link && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3" />
                          <span>Online</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
                      {event.max_attendees && (
                        <span className="text-[10px] text-muted-foreground">Max {event.max_attendees}</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex gap-1.5 pt-2 border-t">
                      <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => setPreviewEvent(event)}>
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs flex-1"
                        onClick={() => handleApprove(event.id)}
                        disabled={eventProcessing}
                      >
                        {eventProcessing ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        {eventProcessing ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs flex-1"
                        onClick={() => setRejectEvent(event)}
                        disabled={eventProcessing}
                      >
                        <X className="h-3 w-3 mr-1" />Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!previewEvent} onOpenChange={() => setPreviewEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>How this event will appear in Discover</DialogDescription>
          </DialogHeader>
          {previewEvent && (
            <div className="space-y-4">
              {previewEvent.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img src={previewEvent.image_url} alt={previewEvent.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-xl font-bold">{previewEvent.title}</h3>
              <p className="text-sm text-muted-foreground">{previewEvent.description}</p>
              <div className="grid gap-3 grid-cols-2 text-sm">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(previewEvent.date), "PPP 'at' p")}</div>
                {previewEvent.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{previewEvent.location}</div>}
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => { handleApprove(previewEvent.id); setPreviewEvent(null); }}
                  disabled={isProcessing(previewEvent.id)}
                >
                  {isProcessing(previewEvent.id) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => { setRejectEvent(previewEvent); setPreviewEvent(null); }}
                  disabled={isProcessing(previewEvent.id)}
                >
                  <X className="h-4 w-4 mr-2" />Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectEvent} onOpenChange={() => setRejectEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>Provide a reason for rejecting "{rejectEvent?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason (Optional)</Label>
              <Textarea placeholder="Let the creator know why..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="mt-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectEvent(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectProcessing}>
                {rejectProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : "Reject Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminEventModeration;
