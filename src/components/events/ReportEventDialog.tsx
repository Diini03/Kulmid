import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredModal } from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  "Inappropriate content",
  "Misleading information",
  "Scam or fraud",
  "Spam event",
  "Duplicate event",
  "Fake event",
  "Wrong category",
  "Copyright violation",
  "Unsafe or harmful activity",
] as const;

interface ReportEventDialogProps {
  eventId: string;
  eventTitle: string;
  trigger?: React.ReactNode;
}

export function ReportEventDialog({ eventId, eventTitle, trigger }: ReportEventDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!reason || !user) return;
    setSubmitting(true);

    try {
      // Check for duplicate report
      const { data: existing } = await supabase
        .from("reports")
        .select("id")
        .eq("target_id", eventId)
        .eq("reported_by", user.id)
        .eq("type", "event")
        .maybeSingle();

      if (existing) {
        toast({ title: "Already reported", description: "You have already reported this event.", variant: "destructive" });
        setOpen(false);
        return;
      }

      const { error } = await supabase.from("reports").insert({
        type: "event",
        target_id: eventId,
        reported_by: user.id,
        reason,
        description: description.trim() || null,
        status: "open",
      });

      if (error) throw error;

      toast({ title: "Report submitted", description: "Thank you. Our team will review this event." });
      setOpen(false);
      setReason("");
      setDescription("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit report", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="cursor-pointer">{trigger}</span>
      ) : (
        <Button variant="ghost" size="sm" onClick={handleOpen} className="text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Event</DialogTitle>
            <DialogDescription>
              Report "{eventTitle}" for violating our guidelines
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Details (optional)</label>
              <Textarea
                placeholder="Provide additional context about this report..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={!reason || submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthRequiredModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        action="report this event"
      />
    </>
  );
}
