import { useState, useEffect } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { smartShuffleEvents, fetchRegistrationCounts } from "@/utils/eventSorting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Sparkles, Settings, ArrowRight } from "lucide-react";
import { ErrorCard } from "@/components/common/ErrorCard";
import { EventItem, EVENT_LIST_COLUMNS } from "@/types/event";

const Discover = () => {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferenceCount, setPreferenceCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call update_event_status only once per session
      const statusKey = 'kulmid_status_updated';
      if (!sessionStorage.getItem(statusKey)) {
        await supabase.rpc('update_event_status');
        sessionStorage.setItem(statusKey, '1');
      }
      
      // Discover shows admin-curated (featured) events. Falls back to all public events when none are featured.
      let { data: fetchedEvents, error: fetchError } = await supabase
        .from('events')
        .select(EVENT_LIST_COLUMNS)
        .in('status', ['featured', 'ongoing']);
      if (!fetchError && (!fetchedEvents || fetchedEvents.length === 0)) {
        const fallback = await supabase
          .from('events')
          .select(EVENT_LIST_COLUMNS)
          .in('status', ['published', 'approved', 'upcoming', 'ongoing']);
        fetchedEvents = fallback.data || [];
        fetchError = fallback.error;
      }
      
      if (fetchError) throw fetchError;

      if (fetchedEvents) {
        // Derive category counts from the same data
        const counts: Record<string, number> = {};
        fetchedEvents.forEach(event => {
          counts[event.category] = (counts[event.category] || 0) + 1;
        });
        setEventCounts(counts);

        const eventIds = fetchedEvents.map(e => e.id);
        const registrationCounts = await fetchRegistrationCounts(supabase, eventIds);
        const shuffled = smartShuffleEvents(fetchedEvents, registrationCounts);
        setAllEvents(shuffled);
        setEvents(shuffled.slice(0, 6));
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
        return;
      }
      
      const { data } = await supabase
        .from('user_preferences')
        .select('event_categories')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.event_categories && data.event_categories.length > 0) {
        setHasPreferences(true);
        
        const { data: matchingEvents } = await supabase
          .from('events')
          .select('id')
          .in('category', data.event_categories)
          .in('status', ['published', 'featured', 'approved', 'upcoming', 'ongoing']);
        
        setPreferenceCount(matchingEvents?.length || 0);
      } else {
        setHasPreferences(false);
        setPreferenceCount(0);
      }
    };
    
    checkPreferences();
  }, [user]);

  const handleViewAll = () => {
    setShowAll(true);
    setEvents(allEvents);
  };
  
  const handleCategoryClick = (categoryName: string) => {
    navigate(`/events?category=${categoryName}`);
  };

  return (
    <>
      <Seo
        title="Discover Events" 
        description="Explore popular events near you, browse by category, or check out some of the great community calendars" 
        canonical="/discover" 
      />

      {/* Hero Section */}
      <section className="border-b">
        <div className="container max-w-5xl px-4 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {user && hasPreferences && (
              <div className="animate-slide-up">
                <span className="personalized-badge">
                  <Sparkles className="h-4 w-4" />
                  {t("discover_personalized")}
                </span>
              </div>
            )}

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance animate-slide-up stagger-1">
              {t("discover_title")}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance animate-slide-up stagger-2">
              {t("discover_subtitle")}
            </p>

            {user && hasPreferences && (
              <div className="pt-6 animate-slide-up stagger-3">
                <Button asChild size="lg" variant="default" className="gap-2">
                  <Link to="/home">
                    <Sparkles className="h-5 w-5" />
                    {preferenceCount > 0 
                      ? t("discover_view_matched", { count: preferenceCount })
                      : t("discover_view_recommendations")
                    }
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}
            
            {user && !hasPreferences && (
              <div className="pt-6 animate-slide-up stagger-3">
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/onboarding">
                    <Settings className="h-5 w-5" />
                    {t("discover_set_preferences")}
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
          <h2 className="text-2xl font-bold mb-8">{t("discover_browse_category")}</h2>
          
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
                    <p className="text-sm text-muted-foreground">{t("discover_events_count", { count })}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container max-w-5xl px-4 py-16 md:py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold">{showAll ? t("discover_all_events") : t("discover_featured")}</h2>
          {!showAll && allEvents.length > 6 && (
            <Button onClick={handleViewAll} variant="ghost" className="gap-2">
              {t("btn_view_all")}
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
            {events.map((event, index) => (
              <div key={event.id} className={`animate-slide-up stagger-${(index % 6) + 1}`}>
                <EventCard event={event} basePath="/discover" />
              </div>
            ))}
          </div>
        )}

        {!showAll && allEvents.length > 6 && (
          <div className="text-center mt-14">
            <Button onClick={handleViewAll} size="lg" variant="outline" className="px-10">
              {t("btn_view_all_count", { count: allEvents.length })}
            </Button>
          </div>
        )}
      </section>
    </>
  );
};

export default Discover;
