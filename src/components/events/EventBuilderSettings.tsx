import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventBuilderSettingsProps {
  event: any;
  onUpdate: () => void;
}

const EventBuilderSettings = ({ event }: EventBuilderSettingsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id)
        .eq("created_by", user?.id);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Your event has been permanently deleted.",
      });

      navigate("/events");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleResubmit = async () => {
    if (resubmitting) return;
    setResubmitting(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ 
          status: 'published',
          rejection_reason: null 
        })
        .eq("id", event.id)
        .eq("created_by", user?.id);

      if (error) throw error;

      toast({
        title: "Republished 🎉",
        description: "Your event link is live again.",
      });

      navigate("/events");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Status</CardTitle>
          <CardDescription>Current status of your event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span className="capitalize">{event.status}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {event.status === "draft" && "Your event is in draft mode. Submit for review to publish it."}
              {event.status === "pending" && "Your event is pending admin approval. You can still manage guests while waiting."}
              {event.status === "approved" && "Your event has been approved and is visible to the public."}
              {event.status === "rejected" && "Your event was rejected. You can still manage it and resubmit for approval after addressing the feedback."}
            </p>
            {event.status === "rejected" && event.rejection_reason && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                <p className="text-sm text-destructive/80 mt-1">{event.rejection_reason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {event.status === "rejected" && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Resubmit for Approval</CardTitle>
            <CardDescription>Ready to submit your event again?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              After addressing the rejection feedback, you can resubmit your event for admin review.
            </p>
            <Button onClick={handleResubmit} disabled={resubmitting}>
              {resubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {resubmitting ? "Resubmitting..." : "Resubmit for Approval"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your event
                  and all associated data including guest lists and invitations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : "Delete Event"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventBuilderSettings;
