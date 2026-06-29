import { useState } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const freeFeatures = [
  "Up to 200 guests per event",
  "5 registration form fields",
  "QR check-in",
  "Basic analytics",
  "100 email invites / week",
  "Bilingual (EN / SO)",
];

const proFeatures = [
  "Everything in Free",
  "Unlimited guests",
  "Unlimited form fields",
  "Full analytics & cross-breakdowns",
  "Priority placement on Discover",
  "Unlimited email invites",
  "0% fee when paid ticketing launches",
  "Custom event URL & branding removal",
];

const Pricing = () => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventsPerMonth, setEventsPerMonth] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("early_access_leads").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      events_per_month: eventsPerMonth.trim() || null,
      source: "pricing_page",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    toast.success("You're on the list! We'll be in touch when Pro launches.");
    setName(""); setEmail(""); setEventsPerMonth("");
    setOpen(false);
  };

  return (
    <>
      <Seo
        title="Pricing — Kulmid"
        description="Simple, honest pricing for every event organizer. Free up to 200 guests per event. Pro coming soon."
        canonical="/pricing"
      />

      <section className="container max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Simple, honest pricing for every organizer. Start free — upgrade when you outgrow it.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <Card className="p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">Free</h2>
              <p className="text-muted-foreground text-sm">For new organizers and small communities.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg">
              <Link to="/discover">Get Started</Link>
            </Button>
          </Card>

          {/* Pro */}
          <Card className="p-8 flex flex-col border-primary/40 bg-primary/[0.03]">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  Pro <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-muted-foreground text-sm">For active organizers running larger events.</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                Coming soon
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">—</span>
              <span className="text-muted-foreground ml-2">price announced at launch</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="default" size="lg" onClick={() => setOpen(true)}>
              Get Early Access
            </Button>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10 max-w-2xl mx-auto">
          Paid ticketing via WAAFI and Stripe is launching soon. Free plan organizers will pay 5% when it does.
          Pro organizers pay 0%.
        </p>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Early Access to Pro</DialogTitle>
            <DialogDescription>
              Leave your details — we'll reach out when Pro is ready, with a launch discount for early supporters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="ea-name">Name</Label>
              <Input id="ea-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ea-email">Email</Label>
              <Input id="ea-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ea-events">Events per month (optional)</Label>
              <Input id="ea-events" value={eventsPerMonth} onChange={(e) => setEventsPerMonth(e.target.value)} maxLength={50} placeholder="e.g. 2–5" />
            </div>
            <Button type="submit" variant="default" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Join the waitlist"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Pricing;