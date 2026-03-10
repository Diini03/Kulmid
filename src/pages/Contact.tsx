import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data: ContactForm) => {
    console.log("Contact form:", data);
    toast({
      title: "Message sent!",
      description: "We'll get back to you soon.",
    });
    reset();
  };

  const impactStats = [
    { label: "Events Hosted", value: "Growing" },
    { label: "Communities", value: "Multiple" },
    { label: "Users", value: "Expanding" },
  ];

  return (
    <>
      <Seo 
        title="Contact" 
        description="Get in touch with Kulmid. We're here to help with questions about events, partnerships, or support." 
        canonical="/contact" 
      />
      
      {/* Hero */}
      <section className="container max-w-5xl px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Have questions? We're here to help.
        </p>
      </section>

      {/* Form + Info Grid */}
      <section className="container max-w-5xl px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} className="mt-1.5" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} className="mt-1.5" />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  {...register("message")} 
                  className="mt-1.5 min-h-[140px]" 
                  placeholder="Tell us how we can help..."
                />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
              </div>

              <Button type="submit">Send Message</Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Email</h3>
              <a 
                href="mailto:hello@kulmid.com" 
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                hello@kulmid.com
              </a>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Response Time</h3>
              <p className="text-muted-foreground">We typically respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">Our Impact</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {impactStats.map((stat, index) => (
            <div key={index} className="text-center md:text-left">
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Contact;