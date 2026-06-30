import { Seo } from "@/components/Seo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Heart, Users, ArrowRight } from "lucide-react";

const About = () => {
  const milestones = [
    { year: "2024", title: "Platform Launch", desc: "Kulmid officially launched to serve our community." },
    { year: "2024", title: "Growing Together", desc: "Events hosted across multiple cities." },
    { year: "2025", title: "Expanding Reach", desc: "Continuing to grow and serve more communities." },
  ];

  const values = [
    { icon: ShieldCheck, title: "Trust (Isku-Kalsooni)", desc: "Trust and unity are at the heart of everything we build." },
    { icon: Heart, title: "Accessibility", desc: "Great experiences should be available to everyone." },
    { icon: Users, title: "Community", desc: "Communities thrive when people gather together." },
  ];

  const team = [
    { name: "Eng. Muno Muqtar", role: "Backend Developer", bio: "Specializes in server architecture and database design.", initials: "MM" },
    { name: "Eng. Ramadan Abdirahman", role: "UI/UX Designer", bio: "Crafts intuitive and accessible user experiences.", initials: "RA" },
    { name: "Eng. Najiib Mohamed", role: "System Architect", bio: "Designs scalable infrastructure and ensures platform reliability.", initials: "NM" },
    { name: "Eng. Abdulahi Jees", role: "Project Lead", bio: "Coordinates development and bridges technical requirements with product vision.", initials: "AJ" },
    { name: "Eng. Diini Kahie", role: "Frontend Developer", bio: "Brings designs to life with clean, performant interfaces.", initials: "DK" },
  ];

  return (
    <>
      <Seo 
        title="About" 
        description="Learn about Kulmid's mission to connect communities through trust and meaningful events." 
        canonical="/about" 
      />
      
      {/* Hero */}
      <section className="container max-w-5xl px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About Kulmid</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A platform that brings communities together through trust and meaningful connections.
        </p>
      </section>

      {/* Mission & What We Do */}
      <section className="container max-w-5xl px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              Kulmid exists to strengthen communities through the power of gathering. We grew from the value of Isku-Kalsooni — trust among people. When people meet, ideas are born, relationships grow, and communities strengthen.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">What We Do</h2>
            <ul className="space-y-2 text-lg">
              <li>Connect people through meaningful events</li>
              <li>Empower organizers with simple tools</li>
              <li>Build bridges between communities</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Our Story</h2>
        <div className="max-w-3xl space-y-4 text-lg text-muted-foreground">
          <p>
            Kulmid started from the value of Isku-Kalsooni — trust among people. We noticed how difficult it was to organize and discover events, so we built a platform that brings everything into one place.
          </p>
          <p>
            A bridge between people who want to learn and those who want to teach. Between communities seeking connection and events that bring them together.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">Our Journey</h2>
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
          
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative">
                {/* Dot */}
                <div className="absolute -left-8 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-primary bg-background" />
                <div>
                  <span className="text-sm text-muted-foreground">{milestone.year}</span>
                  <h3 className="text-lg font-medium">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <value.icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="container max-w-5xl px-4 py-16 border-t border-border">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">The Team</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Engineers passionate about technology, collaboration, and community impact.
        </p>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
          {team.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-6 border-b border-border last:border-b-0"
            >
              <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
                <p className="text-sm text-muted-foreground mt-1">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="container max-w-5xl px-4 py-16">
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to bring people together?</h2>
            <p className="text-muted-foreground">Create your first event in minutes — share the link instantly.</p>
          </div>
          <Button asChild size="lg" className="gap-2 self-start md:self-auto">
            <Link to="/create">Create your first event <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default About;