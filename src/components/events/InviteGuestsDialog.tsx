import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InviteGuestsDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const InviteGuestsDialog = ({ eventId, open, onOpenChange, onSuccess }: InviteGuestsDialogProps) => {
  const { toast } = useToast();
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(email)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, email]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one email address",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Ensure we send the auth token so the edge function can authenticate the organizer
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("You must be signed in to send invitations");
      }

      const { data, error } = await supabase.functions.invoke("send-event-invitation", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          eventId,
          emails,
          customTitle: customTitle || undefined,
          customMessage: customMessage || undefined,
        },
      });

      if (error) throw error;

      const results = data?.results || [];
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.filter((r: any) => !r.success).length;

      toast({
        title: "Invitations Sent",
        description: `${successCount} invitation(s) sent successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setEmails([]);
      setEmailInput("");
      setCustomTitle("");
      setCustomMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Guests</DialogTitle>
          <DialogDescription>
            Send personalized email invitations to your guests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="emails">Email Addresses</Label>
            <div className="flex gap-2">
              <Input
                id="emails"
                type="email"
                placeholder="guest@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addEmail} variant="secondary">
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or click Add after each email
            </p>
          </div>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <Badge key={email} variant="secondary" className="pl-3 pr-1">
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-2 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="customTitle">Custom Email Title (Optional)</Label>
            <Input
              id="customTitle"
              placeholder="Join us for an amazing event!"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Add a personal message to your invitation..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || emails.length === 0}>
              <Mail className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : `Send ${emails.length} Invitation${emails.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteGuestsDialog;
