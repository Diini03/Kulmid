import { useState, useEffect, useMemo } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { smartShuffleEvents, fetchRegistrationCounts } from "@/utils/eventSorting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { categories } from "@/constants/categories";
import { Sparkles, Settings, ArrowRight, TrendingUp, Clock, MapPin } from "lucide-react";
import { ErrorCard } from "@/components/common/ErrorCard";
import { EventItem, EVENT_LIST_COLUMNS } from "@/types/event";

interface UserPrefs {
  event_categories: string[] | null;
  topics: string[] | null;
  location_city: string | null;
}

const Discover = () => {
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userPrefs, setUserPrefs] = useState<UserPrefs | null>(null);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferenceCount, setPreferenceCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusKey = 'kulmid_status_updated';
      if (!sessionStorage.getItem(statusKey)) {
        await supabase.rpc('update_event_status');
        sessionStorage.setItem(statusKey, '1');
      }
      
      const { data: fetchedEvents, error: fetchError } = await supabase
        .from('events')
        .select(EVENT_LIST_COLUMNS)
        .in('status', ['approved', 'upcoming', 'ongoing']);
      
      if (fetchError) throw fetchError;

      if (fetchedEvents) {
        const counts: Record<string, number> = {};
        fetchedEvents.forEach(event => {
          counts[event.category] = (counts[event.category] || 0) + 1;
        });
        setEventCounts(counts);

        const eventIds = fetchedEvents.map(e => e.id);
        const regCounts = await fetchRegistrationCounts(supabase, eventIds);
        setRegistrationCounts(regCounts);
        const shuffled = smartShuffleEvents(fetchedEvents, regCounts);
        setAllEvents(shuffled);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkPreferences = async () => {
      if (!user) {
        setHasPreferences(false);
        setPreferenceCount(0);
        setUserPrefs(null);
        return;
      }
      
      const { data } = await supabase
        .from('user_preferences')
        .select('event_categories, topics, location_city')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserPrefs(data);
        if (data.event_categories && data.event_categories.length > 0) {
          setHasPreferences(true);
          
          const { data: matchingEvents } = await supabase
            .from('events')
            .select('id')
            .in('category', data.event_categories)
            .in('status', ['approved', 'upcoming', 'ongoing']);
          
          setPreferenceCount(matchingEvents?.length || 0);
        } else {
          setHasPreferences(false);
          setPreferenceCount(0);
        }
      } else {
        setUserPrefs(null);
        setHasPreferences(false);
        setPreferenceCount(0);
      }
    };
    
    checkPreferences();
  }, [user]);

  // Derived section data
  const featuredEvents = useMemo(() => {
    return showAllFeatured ? allEvents : allEvents.slice(0, 6);
  }, [allEvents, showAllFeatured]);

  const recommendedEvents = useMemo(() => {
    if (!userPrefs) return [];
    const cats = userPrefs.event_categories || [];
    const topics = userPrefs.topics || [];
    if (cats.length === 0 && topics.length === 0) return [];

    const scored = allEvents.map(event => {
      let score = 0;
      if (cats.includes(event.category)) score += 3;
      if (topics.length > 0 && event.description) {
        const desc = event.description.toLowerCase();
        topics.forEach(t => {
          if (desc.includes(t.toLowerCase())) score += 2;
        });
      }
      return { event, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(s => s.event);
  }, [allEvents, userPrefs]);

  const trendingEvents = useMemo(() => {
    return [...allEvents]
      .sort((a, b) => (registrationCounts[b.id] || 0) - (registrationCounts[a.id] || 0))
      .slice(0, 6);
  }, [allEvents, registrationCounts]);

  const upcomingSoonEvents = useMemo(() => {
    const now = new Date();
    return allEvents
      .filter(e => new Date(e.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [allEvents]);

  const cityEvents = useMemo(() => {
    const city = userPrefs?.location_city;
    if (!city) return [];
    return allEvents
      .filter(e => e.location?.toLowerCase().includes(city.toLowerCase()))
      .slice(0, 6);
  }, [allEvents, userPrefs]);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/events?category=${categoryName}`);
  };

  const EventSection = ({ title, icon, events: sectionEvents, viewAllPath }: {
    title: string;
    icon?: React.ReactNode;
    events: EventItem[];
    viewAllPath?: string;
  }) => {
    if (sectionEvents.length === 0) return null;
    return (
      <section className="border-b">
        <div className="container max-w-5xl px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {icon}
              {title}
            </h2>
            {viewAllPath && (
              <Button asChild variant="ghost" className="gap-2">
                <Link to={viewAllPath}>
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sectionEvents.map((event, index) => (
              <div key={event.id} className={`animate-slide-up stagger-${(index % 6) + 1}`}>
                <EventCard event={event} basePath="/discover" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      <Seo
        title="Discover Events" 
        description="Explore popular events near you, browse by category, or check out some of the great community calendars" 
        canonical="/discover" 
      />

      {/* Hero Section — Compact */}
      <section className="border-b">
        <div className="container max-w-5xl px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            {user && hasPreferences && (
              <div className="animate-slide-up">
                <span className="personalized-badge">
                  <Sparkles className="h-4 w-4" />
                  Personalized for you
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance animate-slide-up stagger-1">
              Discover events
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance animate-slide-up stagger-2">
              Explore experiences that inspire you
            </p>

            {user && hasPreferences && (
              <div className="pt-4 animate-slide-up stagger-3">
                <Button asChild size="lg" variant="default" className="gap-2">
                  <Link to="/home">
                    <Sparkles className="h-5 w-5" />
                    {preferenceCount > 0 
                      ? `View ${preferenceCount} matched events`
                      : "View personalized recommendations"
                    }
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}
            
            {user && !hasPreferences && (
              <div className="pt-4 animate-slide-up stagger-3">
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/onboarding">
                    <Settings className="h-5 w-5" />
                    Set your preferences for personalized events
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="border-b">
        <div className="container max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Browse by category</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const count = eventCounts[category.name] || 0;
              return (
                <button 
                  key={category.name} 
                  onClick={() => handleCategoryClick(category.name)} 
                  className={`category-card animate-slide-up stagger-${Math.min(index + 1, 6)}`}
                >
                  <div className="icon-wrapper">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{count} events</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recommended for you */}
      {!loading && (
        <EventSection
          title="Recommended for you"
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          events={recommendedEvents}
          viewAllPath="/events"
        />
      )}

      {/* Trending now */}
      {!loading && (
        <EventSection
          title="Trending now"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          events={trendingEvents}
          viewAllPath="/events"
        />
      )}

      {/* Featured Events */}
      <section className="border-b">
        <div className="container max-w-5xl px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{showAllFeatured ? "All events" : "Featured events"}</h2>
            {!showAllFeatured && allEvents.length > 6 && (
              <Button onClick={() => { setShowAllFeatured(true); }} variant="ghost" className="gap-2">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {error ? (
            <ErrorCard message={error} onRetry={fetchData} />
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="h-48 w-full rounded-xl bg-secondary" />
                  <div className="h-6 w-3/4 rounded-lg bg-secondary" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-secondary" />
                    <div className="h-4 w-2/3 rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((event, index) => (
                <div key={event.id} className={`animate-slide-up stagger-${(index % 6) + 1}`}>
                  <EventCard event={event} basePath="/discover" />
                </div>
              ))}
            </div>
          )}

          {!showAllFeatured && allEvents.length > 6 && (
            <div className="text-center mt-14">
              <Button onClick={() => { setShowAllFeatured(true); }} size="lg" variant="outline" className="px-10">
                View all {allEvents.length} events
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming soon */}
      {!loading && (
        <EventSection
          title="Upcoming soon"
          icon={<Clock className="h-5 w-5 text-primary" />}
          events={upcomingSoonEvents}
          viewAllPath="/events"
        />
      )}

      {/* Popular in your city */}
      {!loading && (
        <EventSection
          title="Popular in your city"
          icon={<MapPin className="h-5 w-5 text-primary" />}
          events={cityEvents}
        />
      )}
    </>
  );
};

export default Discover;
