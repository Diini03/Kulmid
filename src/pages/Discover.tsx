import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { smartShuffleEvents, fetchRegistrationCounts } from "@/utils/eventSorting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { categories } from "@/constants/categories";
import { Sparkles, Settings, ArrowRight } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  description: string | null;
  status: string;
};

const Discover = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferenceCount, setPreferenceCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      await supabase.rpc('update_event_status');
      
      const { data: fetchedEvents } = await supabase
        .from('events')
        .select('*')
        .in('status', ['approved', 'upcoming', 'ongoing']);
      
      if (fetchedEvents) {
        const eventIds = fetchedEvents.map(e => e.id);
        const registrationCounts = await fetchRegistrationCounts(supabase, eventIds);
        const shuffled = smartShuffleEvents(fetchedEvents, registrationCounts);
        setAllEvents(shuffled);
        setEvents(shuffled.slice(0, 6));
      }

      const { data: categoryEvents } = await supabase
        .from('events')
        .select('category')
        .in('status', ['approved', 'upcoming', 'ongoing']);
      
      if (categoryEvents) {
        const counts: Record<string, number> = {};
        categoryEvents.forEach(event => {
          counts[event.category] = (counts[event.category] || 0) + 1;
        });
        setEventCounts(counts);
      }
      
      setLoading(false);
    };
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
          .in('status', ['approved', 'upcoming', 'ongoing']);
        
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
    <Layout>
      <Seo 
        title="Discover Events" 
        description="Explore popular events near you, browse by category, or check out some of the great community calendars" 
        canonical="/discover" 
      />

      {/* Hero Section */}
      <section className="border-b">
        <div className="container max-w-5xl px-4 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Personalized Badge */}
            {user && hasPreferences && (
              <div className="animate-slide-up">
                <span className="personalized-badge">
                  <Sparkles className="h-4 w-4" />
                  Personalized for you
                </span>
              </div>
            )}

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance animate-slide-up stagger-1">
              Discover events
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance animate-slide-up stagger-2">
              Explore experiences that inspire you
            </p>

            {/* Personalization Buttons */}
            {user && hasPreferences && (
              <div className="pt-6 animate-slide-up stagger-3">
                <Button 
                  asChild 
                  size="lg" 
                  variant="default"
                  className="gap-2"
                >
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
              <div className="pt-6 animate-slide-up stagger-3">
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                >
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
          
          {/* Category Cards */}
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

      {/* Featured Events */}
      <section className="container max-w-5xl px-4 py-16 md:py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold">{showAll ? "All events" : "Featured events"}</h2>
          {!showAll && allEvents.length > 6 && (
            <Button onClick={handleViewAll} variant="ghost" className="gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {loading ? (
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
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}

        {!showAll && allEvents.length > 6 && (
          <div className="text-center mt-14">
            <Button onClick={handleViewAll} size="lg" variant="outline" className="px-10">
              View all {allEvents.length} events
            </Button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Discover;
