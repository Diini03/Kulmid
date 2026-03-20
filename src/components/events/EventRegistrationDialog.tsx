import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SimpleRegistrationForm } from "./registration/SimpleRegistrationForm";
import { sendRegistrationEmail, sendOrganizerNotification, isEmailJSConfigured } from "@/lib/emailjs";

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

  const handleSubmit = async (
    formData: any,
    customAnswers: { question_id: string; answer_text?: string; answer_boolean?: boolean; answer_option?: string }[]
  ) => {
    if (loading) return;
    
    setLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      
      // Check if user already registered
      const { data: existing } = await supabase
        .from("event_guests")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("email", email)
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
      const { data: registration, error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: formData.name?.trim() || null,
        email: email,
        phone_number: formData.phone_number?.trim() || null,
        organization: formData.organization?.trim() || null,
        registration_type: "registration",
        status: autoApprove ? "registered" : "pending",
        rsvp_at: autoApprove ? new Date().toISOString() : null,
      }).select("id").single();

      if (error) {
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

      // Insert custom answers
      if (registration && customAnswers.length > 0) {
        const answersToInsert = customAnswers.map((a) => ({
          registration_id: registration.id,
          question_id: a.question_id,
          answer_text: a.answer_text || null,
          answer_boolean: a.answer_boolean ?? null,
          answer_option: a.answer_option || null,
        }));

        const { error: answersError } = await supabase
          .from("event_registration_answers")
          .insert(answersToInsert);

        if (answersError) {
          console.error("Failed to save custom answers:", answersError);
        }
      }

      // Get event details for email
      const { data: event } = await supabase
        .from("events")
        .select("date, location, created_by, host_email")
        .eq("id", eventId)
        .single();

      // Generate and store check-in token for approved registrations
      let savedToken: string | undefined;
      if (autoApprove) {
        savedToken = crypto.randomUUID();
        await supabase
          .from("event_guests")
          .update({ check_in_token: savedToken })
          .eq("event_id", eventId)
          .eq("email", email);
      }

      // Send confirmation email via EmailJS
      if (isEmailJSConfigured()) {
        await sendRegistrationEmail({
          toEmail: email,
          toName: formData.name,
          eventTitle,
          eventDate: event?.date ? new Date(event.date).toLocaleString() : "",
          eventLocation: event?.location || "",
          status: autoApprove ? "registered" : "pending",
          eventId,
          checkInToken: savedToken,
        });

        if (event?.host_email) {
          await sendOrganizerNotification({
            organizerEmail: event.host_email,
            guestName: formData.name,
            guestEmail: email,
            eventTitle,
          });
        }
      }

      const description = autoApprove
        ? "You're all set! Check your email for details."
        : "Your registration is pending organizer approval. You'll receive an email once it's confirmed.";

      toast({
        title: autoApprove ? "Registration Confirmed" : "Registration Received",
        description,
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

  // Show message for paid events
  if (price > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Integration Coming Soon</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p>This event requires payment (${price}).</p>
              <p>Please contact the organizer directly to register.</p>
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for {eventTitle}</DialogTitle>
          <DialogDescription>
            Fill in the form below to register for this event.
          </DialogDescription>
        </DialogHeader>

        <SimpleRegistrationForm
          eventId={eventId}
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EventRegistrationDialog;
