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
import { ArrowRight, Sparkles, Settings } from "lucide-react";

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
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    
    const fetchEvents = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }
      
      try {
        // Fetch user name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.full_name && mounted) {
          setUserName(profile.full_name.split(' ')[0]);
        }

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

      {/* Hero */}
      <section className="border-b">
        <div className="container mx-auto max-w-6xl py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Greeting */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance animate-slide-up">
              {userName ? (
                <>Welcome back, {userName}!</>
              ) : hasPreferences ? (
                <>Your personalized events</>
              ) : (
                <>Find your next experience</>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-1">
              {hasPreferences
                ? isSupplemented
                  ? `We found ${preferenceMatchCount} ${
                      preferenceMatchCount === 1 ? "event" : "events"
                    } matching your interests, plus more you might enjoy`
                  : "Events curated based on your interests and preferences"
                : "Discover events that inspire, educate, and connect."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-4 animate-slide-up stagger-2">
              {hasPreferences && isSupplemented && (
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/onboarding">
                    <Settings className="h-4 w-4" />
                    Update preferences
                  </Link>
                </Button>
              )}
              {!hasPreferences && (
                <Button asChild variant="default" size="lg" className="gap-2">
                  <Link to="/onboarding">
                    <Sparkles className="h-5 w-5" />
                    Personalize your experience
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Pills */}
      <section className="border-b bg-card sticky top-16 z-40">
        <div className="container mx-auto max-w-6xl py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">
              Browse by category
            </h2>
            <div className="filter-pills flex-1 sm:flex-none sm:justify-end">
              {categories.map((label) => (
                <button
                  key={label}
                  onClick={() => setActiveFilter(label)}
                  className={`filter-pill ${activeFilter === label ? 'active' : ''}`}
                >
                  {label}
                </button>
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
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 9).map((ev, index) => (
                <div key={ev.id} className={`animate-slide-up stagger-${(index % 6) + 1}`}>
                  <EventCard event={ev} />
                </div>
              ))}
            </div>
            {filtered.length > 9 && (
              <div className="text-center mt-12">
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/discover">
                    View all {events.length} events
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state-card max-w-md mx-auto">
            <div className="text-lg text-muted-foreground mb-4">No events found in this category</div>
            <Button variant="default" onClick={() => setActiveFilter("All")}>
              View all events
            </Button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default HomePage;
