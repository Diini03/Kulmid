import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import heroImg from "@/assets/hero-eventease.jpg";
import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/events/SearchBar";
import { EventCard } from "@/components/events/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Ticket, CheckCircle, Users, Shield, Zap, Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  status: string;
};

const Index = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    const fetchEvents = async () => {
      // Update event statuses first
      await supabase.rpc('update_event_status');
      
      // Fetch only upcoming and ongoing events for public view
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'ongoing'])
        .order('date', { ascending: true });

      if (data) {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  // Wait for auth to load before rendering
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Redirect admins to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const filtered = events.filter((e) =>
    activeFilter === "All" ? true : e.category === activeFilter
  );

  return (
    <Layout>
      <Seo
        title="Home"
        description="Discover, book & experience events like never before. Conferences, workshops, festivals & more on EventEase."
        canonical="/"
      />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="container py-20 md:py-28 grid gap-8">
          <div className="grid gap-6 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Discover, Book & Experience Events Like Never Before
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse curated conferences, workshops, festivals and more. Plan your next great experience with confidence.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="hero" className="hover-scale">
                <Link to="/events">Browse Events</Link>
              </Button>
              <Button asChild variant="outline" className="hover-scale">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>

          <div className="glass rounded-xl p-4 shadow-[var(--shadow-soft)]">
            <SearchBar onSearch={() => {}} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Seminar", "Workshop", "Conference", "Festival", "Sports"] as const).map((label) => (
              <Button
                key={label}
                variant={activeFilter === label ? "default" : "pill"}
                size="sm"
                onClick={() => setActiveFilter(label)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container py-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Upcoming Featured Events</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hand-picked events that are trending right now. Don't miss out on these amazing experiences.
          </p>
        </div>
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-lg">Loading amazing events...</div>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 6).map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button asChild size="lg" variant="outline" className="hover-scale">
                <Link to="/events">
                  View All {events.length}+ Events
                  <span className="ml-2">→</span>
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No events found for this category. Try selecting a different filter.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Getting started is simple. Follow these easy steps to discover and attend your favorite events.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { 
                icon: Search, 
                step: "1", 
                title: "Browse Events", 
                desc: "Explore our curated collection of events by category, date, or location." 
              },
              { 
                icon: Ticket, 
                step: "2", 
                title: "Book Your Spot", 
                desc: "Register easily with secure checkout. Get instant confirmation via email." 
              },
              { 
                icon: Calendar, 
                step: "3", 
                title: "Get Reminders", 
                desc: "Receive timely notifications so you never miss your scheduled events." 
              },
              { 
                icon: CheckCircle, 
                step: "4", 
                title: "Attend & Enjoy", 
                desc: "Show up and have an amazing experience. Share your memories with us!" 
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden border-2 hover:border-primary transition-all hover-scale">
                <CardContent className="pt-12 pb-8 text-center">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                    {item.step}
                  </div>
                  <div className="relative mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { k: "10,000+", t: "Events Hosted", icon: Calendar },
            { k: "500K+", t: "Happy Attendees", icon: Users },
            { k: "95%", t: "Satisfaction Rate", icon: Star },
            { k: "120+", t: "Cities Worldwide", icon: Zap },
          ].map((s) => (
            <div key={s.t} className="text-center space-y-3 hover-scale">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-primary">{s.k}</div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose EventEase</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're committed to making event discovery and booking seamless, secure, and delightful.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Browse and book events in seconds with our optimized platform. No hassle, just results."
              },
              {
                icon: Shield,
                title: "Secure & Trusted",
                desc: "Your data is protected with enterprise-grade security. Book with confidence every time."
              },
              {
                icon: Users,
                title: "Community Driven",
                desc: "Join thousands of happy attendees and discover events curated by real people."
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary transition-all hover-scale">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Hear from people who've experienced events through EventEase.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { quote: "EventEase made booking my conference tickets so easy. The interface is clean and intuitive!", name: "Sarah Mitchell", role: "Marketing Director" },
            { quote: "Found the perfect workshop through EventEase. The recommendations are spot on!", name: "Alex Johnson", role: "Product Manager" },
            { quote: "Love how I can track all my events in one place. Game changer for event enthusiasts!", name: "Jordan Lee", role: "Content Creator" },
            { quote: "The best platform for discovering local events. I use it every week!", name: "Taylor Rodriguez", role: "Designer" },
          ].map((testimonial, i) => (
            <Card key={i} className="hover:shadow-xl transition-all hover-scale">
              <CardContent className="pt-8 pb-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About Preview / CTA */}
      <section className="container py-20">
        <Card className="overflow-hidden border-2">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative h-64 md:h-auto">
              <img 
                src={heroImg} 
                alt="People enjoying events and conferences" 
                loading="lazy" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-8 md:p-12 flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-bold">Built for Seamless Event Experiences</h3>
                <p className="text-lg text-muted-foreground">
                  We believe events should be delightful—from discovery to booking to the day-of experience. 
                  Our mission is to simplify planning for attendees and empower organizers to create unforgettable moments.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild size="lg" className="hover-scale">
                  <Link to="/about">Learn Our Story</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="hover-scale">
                  <Link to="/contact">Get in Touch</Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </section>
    </Layout>
  );
};

export default Index;