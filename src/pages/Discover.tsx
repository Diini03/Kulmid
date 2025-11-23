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
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferenceCount, setPreferenceCount] = useState(0);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      await supabase.rpc('update_event_status');
      
      // Fetch all events for smart shuffle
      const { data: allEvents } = await supabase
        .from('events')
        .select('*')
        .in('status', ['approved', 'upcoming', 'ongoing']);
      
      if (allEvents) {
        // Fetch registration counts
        const eventIds = allEvents.map(e => e.id);
        const registrationCounts = await fetchRegistrationCounts(supabase, eventIds);
        
        // Smart shuffle with popularity weighting
        const shuffled = smartShuffleEvents(allEvents, registrationCounts);
        
        // Take top 6 for featured section
        setEvents(shuffled.slice(0, 6));
      }

      // Fetch all events to count by category
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
        
        // Count matching events
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
    navigate("/events");
  };
  
  const handleCategoryClick = (categoryName: string) => {
    navigate(`/events?category=${categoryName}`);
  };
  return <Layout>
      <Seo title="Discover Events" description="Explore popular events near you, browse by category, or check out some of the great community calendars" canonical="/discover" />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Discover events
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance">
              Explore experiences that inspire you
            </p>

            {/* Personalization Button */}
            {user && hasPreferences && (
              <div className="pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  variant="default"
                  className="gap-2"
                >
                  <Link to="/home">
                    <Sparkles className="h-4 w-4" />
                    {preferenceCount > 0 
                      ? `View ${preferenceCount} events matched to your interests`
                      : "View personalized recommendations"
                    }
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
            
            {/* Show onboarding prompt if no preferences */}
            {user && !hasPreferences && (
              <div className="pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                >
                  <Link to="/onboarding">
                    <Settings className="h-4 w-4" />
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
        <div className="container max-w-6xl py-12">
          <h2 className="text-xl font-semibold mb-6">Browse by category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => {
              const Icon = category.icon;
              const count = eventCounts[category.name] || 0;
              return (
                <button 
                  key={category.name} 
                  onClick={() => handleCategoryClick(category.name)} 
                  className="group p-5 rounded-xl border bg-card hover-lift text-left"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{count} events</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container max-w-6xl py-12 md:py-16">
        <h2 className="text-xl font-semibold mb-8">Featured events</h2>

        {loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-56 w-full rounded-xl bg-muted animate-pulse" />
                <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>}

        <div className="text-center mt-12">
          <Button onClick={handleViewAll} size="lg" variant="outline" className="px-8">
            View all events
          </Button>
        </div>
      </section>

      
    </Layout>;
};
export default Discover;