import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RegistrationWizard } from "./registration/RegistrationWizard";

interface EventRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  price: number;
  autoApprove: boolean;
}

const EventRegistrationDialog = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  price,
  autoApprove,
}: EventRegistrationDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (loading) return;
    
    setLoading(true);

    try {
      // Check if user already registered
      const { data: existing } = await supabase
        .from("event_guests")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("email", formData.email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already Registered",
          description: `You have already registered for this event. Status: ${existing.status}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert registration
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim(),
        organization: formData.organization?.trim() || null,
        job_title: formData.job_title?.trim() || null,
        degree: formData.degree?.trim() || null,
        why_interested: formData.why_interested.trim(),
        what_to_gain: formData.what_to_gain?.trim() || null,
        heard_from: formData.heard_from?.trim() || null,
        questions: formData.questions?.trim() || null,
        dietary_restrictions: formData.dietary_restrictions?.trim() || null,
        special_requirements: formData.special_requirements?.trim() || null,
        registration_type: "registration",
        status: autoApprove ? "registered" : "pending",
        rsvp_at: autoApprove ? new Date().toISOString() : null,
      });

      if (error) {
        // Handle duplicate registration error specifically
        if (error.code === '23505') {
          toast({
            title: "Already Registered",
            description: "You have already registered for this event.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        throw error;
      }

      // Send confirmation email
      await supabase.functions.invoke("send-registration-confirmation", {
        body: {
          email: formData.email,
          name: formData.name,
          eventTitle,
          status: autoApprove ? "registered" : "pending",
        },
      });

      // Send notification to organizer
      await supabase.functions.invoke("send-registration-notification", {
        body: {
          eventId,
          guestData: formData,
        },
      });

      toast({
        title: autoApprove ? "✅ Registration Confirmed!" : "⏳ Registration Received!",
        description: autoApprove
          ? "You're all set! Check your email for details."
          : "Your registration is pending organizer approval. You'll receive an email once it's confirmed.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show beta message for paid events
  if (price > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🚧 Payment Integration Coming Soon!</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p>This event requires payment (${price}).</p>
              <p>While we're adding payment features, please contact the organizer directly to register.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                window.location.href = `mailto:${eventTitle}?subject=Interest in ${eventTitle}`;
              }}
              className="flex-1"
            >
              Contact Organizer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for {eventTitle}</DialogTitle>
          <DialogDescription>
            Complete the steps below to secure your spot at this event.
          </DialogDescription>
        </DialogHeader>

        <RegistrationWizard
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EventRegistrationDialog;
