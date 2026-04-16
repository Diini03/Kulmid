import { useState } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, MessageSquare, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    setSending(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("send-contact-message", {
        body: data,
      });

      if (error) throw error;

      setSent(true);
      reset();
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
    } catch (err) {
      console.error("Contact send error:", err);
      toast({
        title: "Failed to send",
        description: "Something went wrong. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Seo 
        title="Contact" 
        description="Get in touch with Kulmid. We're here to help with questions about events, partnerships, or support." 
        canonical="/contact" 
      />
      
      {/* Hero */}
      <section className="container max-w-5xl px-4 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Get in Touch</h1>
        </div>
        <p className="text-muted-foreground max-w-lg">
          Have a question, feedback, or partnership idea? We'd love to hear from you.
        </p>
      </section>

      {/* Form + Info Grid */}
      <section className="container max-w-5xl px-4 pb-20">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          
          {/* Contact Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="rounded-xl border border-border/60 bg-card p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Message Sent!</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Thank you for reaching out. We'll respond within 24 hours.
                </p>
                <Button variant="outline" onClick={() => setSent(false)} className="mt-2">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border/60 bg-card p-6 sm:p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name"
                      {...register("name")} 
                      className="mt-1.5" 
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com"
                      {...register("email")} 
                      className="mt-1.5" 
                    />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                  <Textarea 
                    id="message" 
                    {...register("message")} 
                    className="mt-1.5 min-h-[130px]" 
                    placeholder="Tell us how we can help..."
                  />
                  {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
                </div>

                <Button type="submit" disabled={sending} className="w-full sm:w-auto gap-2">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Email Us</h3>
                <a 
                  href="mailto:kulmid2025@gmail.com" 
                  className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  kulmid2025@gmail.com
                </a>
              </div>
              <div className="border-t border-border/50" />
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Response Time</h3>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Usually within 24 hours
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/help" className="text-muted-foreground hover:text-primary transition-colors">Help Center & FAQs →</a>
                </li>
                <li>
                  <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Kulmid →</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
