import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  organization: z.string().trim().optional(),
  job_title: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  why_interested: z.string().trim().min(10, "Please tell us why you're interested (at least 10 characters)"),
  what_to_gain: z.string().trim().optional(),
  heard_from: z.string().trim().optional(),
  questions: z.string().trim().optional(),
  dietary_restrictions: z.string().trim().optional(),
  special_requirements: z.string().trim().optional(),
});

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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    organization: "",
    job_title: "",
    degree: "",
    why_interested: "",
    what_to_gain: "",
    heard_from: "",
    questions: "",
    dietary_restrictions: "",
    special_requirements: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Check if user already registered
      const { data: existing } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", eventId)
        .eq("email", formData.email)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already Registered",
          description: "You have already registered for this event.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert registration
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        organization: formData.organization || null,
        job_title: formData.job_title || null,
        degree: formData.degree || null,
        why_interested: formData.why_interested,
        what_to_gain: formData.what_to_gain || null,
        heard_from: formData.heard_from || null,
        questions: formData.questions || null,
        dietary_restrictions: formData.dietary_restrictions || null,
        special_requirements: formData.special_requirements || null,
        registration_type: "registration",
        status: autoApprove ? "registered" : "pending",
        rsvp_at: autoApprove ? new Date().toISOString() : null,
      });

      if (error) throw error;

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
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        organization: "",
        job_title: "",
        degree: "",
        why_interested: "",
        what_to_gain: "",
        heard_from: "",
        questions: "",
        dietary_restrictions: "",
        special_requirements: "",
      });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for {eventTitle}</DialogTitle>
          <DialogDescription>
            Fill out the form below to register for this event. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+252 61 234 5678"
              />
              {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Professional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization/Company</Label>
              <Input
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Your organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                placeholder="Your job title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="degree">Degree/Education</Label>
              <Input
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="e.g., Bachelor's in Computer Science"
              />
            </div>
          </div>

          {/* Event-Specific Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">About Your Interest</h3>
            
            <div className="space-y-2">
              <Label htmlFor="why_interested">Why are you interested in this event? *</Label>
              <Textarea
                id="why_interested"
                name="why_interested"
                value={formData.why_interested}
                onChange={handleChange}
                placeholder="Tell us what interests you about this event..."
                rows={3}
              />
              {errors.why_interested && <p className="text-sm text-destructive">{errors.why_interested}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_to_gain">What do you hope to gain from this event?</Label>
              <Textarea
                id="what_to_gain"
                name="what_to_gain"
                value={formData.what_to_gain}
                onChange={handleChange}
                placeholder="Your learning goals or expectations..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heard_from">How did you hear about this event?</Label>
              <Input
                id="heard_from"
                name="heard_from"
                value={formData.heard_from}
                onChange={handleChange}
                placeholder="e.g., Social media, Friend, Website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questions">Do you have any questions for the organizer?</Label>
              <Textarea
                id="questions"
                name="questions"
                value={formData.questions}
                onChange={handleChange}
                placeholder="Any questions or special requests..."
                rows={2}
              />
            </div>
          </div>

          {/* Special Requirements */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Special Requirements (Optional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
              <Input
                id="dietary_restrictions"
                name="dietary_restrictions"
                value={formData.dietary_restrictions}
                onChange={handleChange}
                placeholder="e.g., Vegetarian, Halal, Allergies"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requirements">Accessibility/Special Requirements</Label>
              <Textarea
                id="special_requirements"
                name="special_requirements"
                value={formData.special_requirements}
                onChange={handleChange}
                placeholder="Any accessibility needs or special accommodations..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventRegistrationDialog;
