import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, MessageCircle, HelpCircle } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data: ContactForm) => {
    console.log("Contact form:", data);
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });
    reset();
  };

  return (
    <Layout>
      <Seo 
        title="Contact" 
        description="Get in touch with EventEase. We're here to help with questions about events, partnerships, or technical support." 
        canonical="/contact" 
      />
      
      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">Get In Touch</h1>
          <p className="text-xl text-muted-foreground">
            Have questions? We're here to help. Reach out and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      <div className="container pb-12">
        <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register("name")} className="mt-1" />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...register("email")} className="mt-1" />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" {...register("subject")} className="mt-1" />
                    {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => setValue("category", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="events">Events & Booking</SelectItem>
                        <SelectItem value="organizer">Event Organizer Support</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    {...register("message")} 
                    className="mt-1 min-h-[120px]" 
                    placeholder="Tell us how we can help you..."
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full md:w-auto">
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            
            {/* Contact Details */}
            <div className="rounded-xl border p-6">
              <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Headquarters</p>
                    <p className="text-sm text-muted-foreground">
                      123 Innovation Drive<br />
                      San Francisco, CA 94107<br />
                      United States
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">hello@eventease.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Mon-Fri: 9:00 AM - 6:00 PM PST<br />
                      Weekend: Limited Support
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Channels */}
            <div className="rounded-xl border p-6">
              <h3 className="text-xl font-semibold mb-6">Other Ways to Reach Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Live Chat</p>
                    <p className="text-xs text-muted-foreground">Available 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Help Center</p>
                    <p className="text-xs text-muted-foreground">Self-service resources</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Times */}
            <div className="rounded-xl border p-6">
              <h3 className="text-xl font-semibold mb-4">Response Times</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">General Inquiries</span>
                  <span className="font-medium">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Technical Support</span>
                  <span className="font-medium">4-8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Urgent Issues</span>
                  <span className="font-medium">1-2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="booking" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">How do I book an event?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Booking an event is simple! Browse our events page, click on any event you're interested in, 
                and hit the "Book Now" button. You'll be guided through a secure checkout process where you 
                can select ticket types and quantities.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="refund" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">What's your refund policy?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Refund policies vary by event organizer. Most events offer full refunds if canceled 7+ days 
                in advance. Check the specific event's terms during booking or contact the organizer directly 
                for clarification.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="organizer" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">How can I list my event?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Creating an event is easy! Sign up for an organizer account, click "Host an Event" and fill 
                out the event details. Our team reviews submissions within 24 hours. There's a small platform 
                fee per ticket sold.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="support" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">Do you offer customer support?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! We provide 24/7 live chat support, email support with 24-hour response times, 
                and phone support during business hours. Our help center also has extensive self-service resources.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="mobile" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">Is there a mobile app?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our website is fully responsive and works great on mobile devices. We're also developing 
                native iOS and Android apps that will be launching in Q2 2025 with additional features like 
                offline ticket access and push notifications.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="partnership" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">Do you offer partnership opportunities?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We work with venues, corporate partners, and marketing agencies. Contact us at 
                partnerships@eventease.com to discuss opportunities for collaboration, bulk bookings, 
                or white-label solutions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Map Section */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Visit Our Office</h2>
          <div className="rounded-xl border overflow-hidden">
            <div className="aspect-video bg-secondary flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="w-12 h-12 text-primary mx-auto" />
                <p className="font-medium">Interactive Map</p>
                <p className="text-sm text-muted-foreground">
                  123 Innovation Drive, San Francisco, CA
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;