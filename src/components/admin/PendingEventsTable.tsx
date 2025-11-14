import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Calendar, MapPin, Globe, DollarSign } from "lucide-react";
import { format } from "date-fns";

type PendingEvent = {
  id: string;
  title: string;
  date: string;
  location: string | null;
  meeting_link: string | null;
  event_type: string | null;
  category: string;
  price: number;
  description: string | null;
  image_url: string | null;
  status: string;
  created_by: string;
  created_at: string;
  creator?: {
    full_name: string;
    user_id: string;
  };
};

interface PendingEventsTableProps {
  events: PendingEvent[];
  onUpdate: () => void;
}

export const PendingEventsTable = ({ events, onUpdate }: PendingEventsTableProps) => {
  const { toast } = useToast();
  const [previewEvent, setPreviewEvent] = useState<PendingEvent | null>(null);
  const [rejectEvent, setRejectEvent] = useState<PendingEvent | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleApprove = async (eventId: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', eventId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Event approved",
        description: "The event is now live and visible to all users.",
      });
      onUpdate();
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectEvent) return;
    
    setProcessing(true);
    const { error } = await supabase
      .from('events')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason || null
      })
      .eq('id', rejectEvent.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Event rejected",
        description: "The creator will be notified of the rejection.",
      });
      setRejectEvent(null);
      setRejectionReason("");
      onUpdate();
    }
    setProcessing(false);
  };

  const getEventTypeIcon = (type: string | null) => {
    if (type === "online") return <Globe className="h-4 w-4" />;
    if (type === "hybrid") return <><MapPin className="h-3 w-3" /><Globe className="h-3 w-3" /></>;
    return <MapPin className="h-4 w-4" />;
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pending events to review</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {event.description}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">
                  {event.creator?.full_name || "Unknown User"}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(event.date), "MMM d, yyyy")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(event.date), "h:mm a")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {getEventTypeIcon(event.event_type)}
                  <span className="text-sm capitalize">{event.event_type || "in-person"}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{event.category}</Badge>
              </TableCell>
              <TableCell>
                {event.price === 0 ? (
                  <Badge variant="secondary">Free</Badge>
                ) : (
                  <span className="text-sm">${event.price}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(event.created_at), "MMM d, yyyy")}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewEvent(event)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(event.id)}
                    disabled={processing}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectEvent(event)}
                    disabled={processing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Preview Dialog */}
      <Dialog open={!!previewEvent} onOpenChange={() => setPreviewEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>Review event details before approval</DialogDescription>
          </DialogHeader>
          {previewEvent && (
            <div className="space-y-6">
              {previewEvent.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={previewEvent.image_url} 
                    alt={previewEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold mb-2">{previewEvent.title}</h3>
                <p className="text-muted-foreground">{previewEvent.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(previewEvent.date), "PPP 'at' p")}</span>
                  </div>
                  {previewEvent.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{previewEvent.location}</span>
                    </div>
                  )}
                  {previewEvent.meeting_link && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={previewEvent.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {previewEvent.meeting_link}
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{previewEvent.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{previewEvent.price === 0 ? "Free" : `$${previewEvent.price}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{previewEvent.event_type || "in-person"}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleApprove(previewEvent.id);
                    setPreviewEvent(null);
                  }}
                  disabled={processing}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Event
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setRejectEvent(previewEvent);
                    setPreviewEvent(null);
                  }}
                  disabled={processing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectEvent} onOpenChange={() => setRejectEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{rejectEvent?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Let the creator know why their event was rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectEvent(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={processing}
              >
                Reject Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
