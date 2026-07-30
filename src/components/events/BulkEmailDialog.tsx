import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

const AUDIENCES = [
  { value: "registered", label: "Confirmed registrations" },
  { value: "pending", label: "Pending approvals" },
  { value: "waitlisted", label: "Waitlist" },
  { value: "not_checked_in", label: "Not yet checked in" },
  { value: "checked_in", label: "Checked in" },
  { value: "all", label: "Everyone (except cancelled)" },
];

const BulkEmailDialog = ({ open, onOpenChange, eventId, eventTitle }: Props) => {
  const [audience, setAudience] = useState("registered");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (subject.trim().length < 3) {
      toast({ title: "Add a subject", description: "Subject must be at least 3 characters.", variant: "destructive" });
      return;
    }
    if (message.trim().length < 5) {
      toast({ title: "Add a message", description: "Write something for your guests.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: { eventId, subject: subject.trim(), message: message.trim(), audience },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: "Emails sent",
        description: `${(data as any).sent} delivered${(data as any).failed ? `, ${(data as any).failed} failed` : ""}.`,
      });
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not send", description: e.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Email your guests</DialogTitle>
          <DialogDescription>
            Send a one-off update to people registered for {eventTitle}. No CSV export needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Send to</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              id="bulk-subject"
              value={subject}
              maxLength={150}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Venue change for Saturday"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-message">Message</Label>
            <Textarea
              id="bulk-message"
              value={message}
              maxLength={5000}
              rows={7}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi everyone,&#10;&#10;A quick update about the event…"
            />
            <p className="text-xs text-muted-foreground">{message.length}/5000 · Sent from your Kulmid event.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;