import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-eventease.jpg";

const About = () => {
  return (
    <Layout>
      <Seo title="About" description="Learn about Kulmid's mission to connect communities through trust and meaningful events." canonical="/about" />
      
      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">About Kulmid</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Kulmid is a platform that helps people create, organize, and attend events easily. 
            We believe in bringing communities together through trust and meaningful connections.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <img src={heroImg} alt="Kulmid community events" className="rounded-xl object-cover w-full h-64 md:h-80" />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kulmid exists to strengthen communities through the power of gathering. 
                We grew from the value of Isku-Kalsooni — trust among people. When people meet, 
                ideas are born, relationships grow, and communities strengthen. We make those moments possible.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What We Do</h3>
              <ul className="text-muted-foreground space-y-2">
                <li>• Connect people through meaningful events and shared experiences</li>
                <li>• Empower organizers with simple, accessible tools</li>
                <li>• Build bridges between communities, stories, and opportunities</li>
                <li>• Foster trust and collaboration through gathering</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
          <div className="space-y-8">
            <div className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Kulmid started from the value of Isku-Kalsooni — trust among people. 
                We noticed how difficult it was to organize and discover events, so we built a platform 
                that brings everything into one place. But more than that, we built a bridge.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                A bridge between people who want to learn and those who want to teach. Between communities 
                seeking connection and events that bring them together. Between ideas and the gatherings 
                that give them life.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Kulmid is not just a tool. It is a commitment to the belief that when people meet, 
                something beautiful happens. Communities thrive. Knowledge spreads. Opportunities emerge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Key Milestones</h2>
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 md:gap-8">
            {[
              { year: "2024", title: "Platform Launch", desc: "Kulmid officially launched, bringing modern event management to our community." },
              { year: "2024", title: "Growing Together", desc: "Events hosted across multiple cities, connecting communities and creating opportunities." },
              { year: "2024", title: "Building Trust", desc: "Focused on user experience and platform reliability, earning the trust of organizers and attendees." },
              { year: "2025", title: "Expanding Reach", desc: "Continuing to grow, improve features, and serve more communities every day." }
            ].map((milestone, index) => (
              <div key={milestone.year + index} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {milestone.year.slice(-2)}
                  </div>
                  {index !== 3 && <div className="w-0.5 h-16 bg-border mt-4"></div>}
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="text-xl font-semibold">{milestone.year} — {milestone.title}</h3>
                  <p className="text-muted-foreground mt-2">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Trust (Isku-Kalsooni)", desc: "Trust and unity are at the heart of everything we do. We build technology that strengthens relationships." },
              { title: "Accessibility", desc: "Great experiences should be available to everyone. We keep our platform simple and inclusive." },
              { title: "Innovation", desc: "We use technology to strengthen human connections, not replace them." },
              { title: "Community", desc: "Communities thrive when people gather. We're proud to be part of that journey." }
            ].map((value) => (
              <div key={value.title} className="rounded-xl border p-6 hover-scale">
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Join Our Journey</h2>
          <p className="text-lg text-muted-foreground">
            Ready to be part of the future of events? Whether you're looking to discover amazing experiences 
            or host your own, we'd love to have you with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/events">Explore Events</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Get In Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;