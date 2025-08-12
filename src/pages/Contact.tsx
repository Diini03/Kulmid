import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const Contact = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{name:string;email:string;subject:string;message:string}>({ resolver: zodResolver(schema) });

  const onSubmit = (data: any) => {
    console.log("Contact submit", data);
    reset();
    alert("Thanks! We'll be in touch.");
  };

  return (
    <Layout>
      <Seo title="Contact" description="Get in touch with EventEase." canonical="/contact" />
      <section className="container py-12 grid md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground mb-6">We'd love to hear from you.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div>
              <input {...register("name")} className="w-full h-10 rounded-md border bg-background px-3" placeholder="Name" aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <input {...register("email")} className="w-full h-10 rounded-md border bg-background px-3" placeholder="Email" aria-invalid={!!errors.email} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <input {...register("subject")} className="w-full h-10 rounded-md border bg-background px-3" placeholder="Subject" aria-invalid={!!errors.subject} />
              {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <textarea {...register("message")} className="w-full min-h-32 rounded-md border bg-background px-3 py-2" placeholder="Message" aria-invalid={!!errors.message} />
              {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
            </div>
            <Button type="submit" variant="hero" className="w-fit">Send Message</Button>
          </form>
        </div>
        <div className="rounded-xl border p-6">
          <div className="mb-4">
            <div className="font-semibold">Head Office</div>
            <div className="text-sm text-muted-foreground">123 Event St, San Francisco, CA</div>
          </div>
          <div className="aspect-[16/9] bg-muted rounded-md" aria-label="Google Map placeholder" />
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
