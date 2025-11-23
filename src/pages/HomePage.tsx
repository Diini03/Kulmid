import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersonalizedEvents } from "@/utils/recommendations";

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

const categories = ["All", "Seminar", "Workshop", "Conference", "Festival", "Sports"] as const;

const HomePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [isSupplemented, setIsSupplemented] = useState(false);
  const [preferenceMatchCount, setPreferenceMatchCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const fetchEvents = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }
      
      try {
        const {
          events: personalizedEvents,
          hasPreferences: prefs,
          isSupplemented: supplemented,
          preferenceMatchCount: matchCount,
        } = await getPersonalizedEvents(user.id);
        
        if (mounted) {
          setEvents(personalizedEvents);
          setHasPreferences(prefs);
          setIsSupplemented(supplemented);
          setPreferenceMatchCount(matchCount);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching personalized events:', error);
        if (mounted) setLoading(false);
      }
    };

    fetchEvents();
    
    return () => {
      mounted = false;
    };
  }, [user]);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

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
        description="Discover and book amazing events. Conferences, workshops, festivals and more."
        canonical="/home"
      />

      {/* Minimal Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-6xl py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              {hasPreferences
                ? isSupplemented
                  ? "Events for you"
                  : "Your personalized events"
                : "Find your next experience"}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {hasPreferences
                ? isSupplemented
                  ? `We found ${preferenceMatchCount} ${
                      preferenceMatchCount === 1 ? "event" : "events"
                    } matching your interests, and added more you might enjoy`
                  : "Events curated based on your interests and preferences"
                : "Discover events that inspire, educate, and connect."}
            </p>
            {hasPreferences && isSupplemented && (
              <Button asChild variant="outline" className="mt-4">
                <Link to="/onboarding">Update my preferences</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="border-b bg-card">
        <div className="container mx-auto max-w-6xl py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-semibold">Browse by category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((label) => (
                <Button
                  key={label}
                  variant={activeFilter === label ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(label)}
                  className="transition-all"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="container mx-auto max-w-6xl py-12 md:py-16">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-56 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 9).map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
            {filtered.length > 9 && (
              <div className="text-center mt-12">
                <Button asChild variant="outline" size="lg">
                  <Link to="/events">
                    View all {events.length} events
                  </Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-lg text-muted-foreground mb-4">No events found in this category</div>
            <Button variant="outline" onClick={() => setActiveFilter("All")}>
              View all events
            </Button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default HomePage;
