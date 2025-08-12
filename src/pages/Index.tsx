import heroImg from "@/assets/hero-eventease.jpg";
import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchBar } from "@/components/events/SearchBar";
import { EventCard } from "@/components/events/EventCard";
import { events, type EventItem } from "@/data/events";
import { useState } from "react";
import { Link } from "react-router-dom";

const Index = () => {
  const [quick, setQuick] = useState<EventItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

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
                <Link to="/organizer">Host an Event</Link>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 6).map((ev) => (
            <EventCard key={ev.id} event={ev} onQuickView={setQuick} />
          ))}
        </div>
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
              <p className="text-sm mb-3">“EventEase made booking my conference a breeze. Slick UI and great events!”</p>
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

      <Dialog open={!!quick} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>{quick?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <img src={quick?.image} alt={quick?.title || "Event image"} className="rounded-md object-cover w-full h-48" />
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{quick?.location} • {quick && new Date(quick.date).toLocaleDateString()}</p>
              <p className="text-sm">Category: {quick?.category}</p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to={quick ? `/events/${quick.id}` : "/events"}>Book Now</Link>
                </Button>
                <Button variant="outline" onClick={() => setQuick(null)}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Index;
