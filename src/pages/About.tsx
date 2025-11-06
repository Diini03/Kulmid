import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-eventease.jpg";

const About = () => {
  return (
    <Layout>
      <Seo title="About" description="Learn about EventEase's mission, story, and team building the future of event experiences." canonical="/about" />
      
      {/* Hero Section */}
      <section className="container max-w-6xl py-12 md:py-20">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">About EventEase</h1>
          <p className="text-xl text-muted-foreground">
            We're on a mission to revolutionize how people discover, book, and experience events worldwide.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container max-w-6xl py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img src={heroImg} alt="EventEase team collaboration" className="rounded-xl object-cover w-full h-64 md:h-80" />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                EventEase exists to break down barriers between event creators and attendees. We believe that 
                meaningful experiences should be accessible, discoverable, and seamlessly bookable for everyone, 
                everywhere.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What We Do</h3>
              <ul className="text-muted-foreground space-y-2">
                <li>• Connect people with experiences that inspire and educate</li>
                <li>• Empower event organizers with powerful, intuitive tools</li>
                <li>• Foster communities through shared interests and passions</li>
                <li>• Simplify event discovery with smart recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="container max-w-6xl py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
          <div className="space-y-8">
            <div className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                EventEase was born from a simple frustration: finding and booking great events was unnecessarily complicated. 
                Our founders, Sarah Chen and Marcus Rodriguez, experienced this firsthand while trying to organize a tech 
                meetup in San Francisco in 2019.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                What started as a weekend project to solve their own problem quickly grew into something much bigger. 
                They realized that event organizers and attendees everywhere faced the same challenges: fragmented platforms, 
                complex booking processes, and poor discovery mechanisms.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, EventEase serves thousands of event organizers and millions of attendees across 120+ cities worldwide. 
                From intimate workshops to massive conferences, we're proud to power experiences that bring people together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="container max-w-6xl py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Key Milestones</h2>
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 md:gap-8">
            {[
              { year: "2019", title: "Founded", desc: "Sarah and Marcus launch EventEase from a San Francisco garage, hosting their first 50 events." },
              { year: "2020", title: "Virtual Events", desc: "Pivoted quickly to support virtual events during the pandemic, helping 1000+ organizers go digital." },  
              { year: "2021", title: "Growth Milestone", desc: "Celebrated our 10,000th event and expanded to 25 cities across North America." },
              { year: "2022", title: "Series A Funding", desc: "Raised $15M Series A to accelerate growth and enhance our AI-powered recommendation engine." },
              { year: "2023", title: "International Expansion", desc: "Launched in Europe with offices in London and Berlin, supporting events in 12 languages." },
              { year: "2024", title: "Global Scale", desc: "Reached 120+ cities worldwide with 500K+ tickets sold and 95% customer satisfaction." }
            ].map((milestone, index) => (
              <div key={milestone.year} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {milestone.year.slice(-2)}
                  </div>
                  {index !== 5 && <div className="w-0.5 h-16 bg-border mt-4"></div>}
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

      {/* Team Section */}
      <section className="container max-w-6xl py-12">
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Sarah Chen", role: "Co-Founder & CEO", bio: "Former PM at Airbnb, passionate about connecting communities through technology." },
              { name: "Marcus Rodriguez", role: "Co-Founder & CTO", bio: "Ex-Google engineer with 10+ years building scalable platforms." },
              { name: "Emily Watson", role: "Head of Design", bio: "Award-winning designer focused on creating delightful user experiences." },
              { name: "David Kim", role: "VP of Engineering", bio: "Former Netflix tech lead specializing in recommendation systems." },
              { name: "Lisa Thompson", role: "Head of Growth", bio: "Marketing expert who's helped scale multiple B2C startups." },
              { name: "James Park", role: "Head of Partnerships", bio: "Event industry veteran with deep connections across venues and organizers." }
            ].map((member) => (
              <div key={member.name} className="text-center space-y-4 hover-scale">
                <div className="w-24 h-24 mx-auto rounded-full bg-secondary flex items-center justify-center text-2xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container max-w-6xl py-12">
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Community First", desc: "We believe events are about bringing people together and creating lasting connections." },
              { title: "Accessibility", desc: "Great experiences should be available to everyone, regardless of background or location." },
              { title: "Innovation", desc: "We constantly push boundaries to make event discovery and booking more intuitive." },
              { title: "Transparency", desc: "Open communication and honest pricing are at the core of everything we do." }
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
      <section className="container max-w-6xl py-16 text-center">
        <div className="space-y-6">
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