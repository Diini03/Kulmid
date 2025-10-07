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
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Events</h2>
          <Button asChild variant="link"><Link to="/events">View All</Link></Button>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 6).map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No events found for this category.
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { k: "10K+", t: "Events Hosted" },
          { k: "500K+", t: "Tickets Sold" },
          { k: "95%", t: "Satisfaction Rate" },
          { k: "120+", t: "Cities Covered" },
        ].map((s) => (
          <div key={s.t} className="rounded-xl border p-6 text-center hover-scale">
            <div className="text-3xl font-bold">{s.k}</div>
            <div className="text-sm text-muted-foreground">{s.t}</div>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold mb-6">What People Say</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="min-w-[280px] flex-1 rounded-xl border p-6 shadow-sm hover:shadow-lg transition-shadow">
              <p className="text-sm mb-3">"EventEase made booking my conference a breeze. Slick UI and great events!"</p>
              <div className="text-sm font-semibold">Alex Johnson</div>
              <div className="text-xs text-muted-foreground">Product Manager</div>
            </div>
          ))}
        </div>
      </section>

      {/* About Preview */}
      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <img src={heroImg} alt="Collage of events" loading="lazy" className="rounded-xl object-cover w-full h-64 md:h-80" />
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Built for seamless event experiences</h3>
            <p className="text-muted-foreground">We believe events should be delightful—from discovery to booking to the day-of experience. Our mission is to simplify planning and empower organizers.</p>
            <Button asChild variant="link"><Link to="/about">Read More →</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;