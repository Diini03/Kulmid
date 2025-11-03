import { useState, useEffect } from "react";
import { WelcomeLayout } from "@/components/layout/WelcomeLayout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Laptop, 
  Utensils, 
  Sparkles, 
  Palette, 
  Sprout, 
  Dumbbell,
  Heart,
  Bitcoin
} from "lucide-react";

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

const categories = [
  { name: "Tech", icon: Laptop, color: "from-blue-500 to-cyan-500" },
  { name: "Food & Drink", icon: Utensils, color: "from-orange-500 to-red-500" },
  { name: "AI", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  { name: "Arts & Culture", icon: Palette, color: "from-pink-500 to-rose-500" },
  { name: "Climate", icon: Sprout, color: "from-green-500 to-emerald-500" },
  { name: "Fitness", icon: Dumbbell, color: "from-red-500 to-orange-500" },
  { name: "Wellness", icon: Heart, color: "from-pink-400 to-purple-400" },
  { name: "Crypto", icon: Bitcoin, color: "from-yellow-500 to-orange-500" },
];

const Discover = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      await supabase.rpc('update_event_status');
      
      const { data } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'ongoing'])
        .limit(6);

      if (data) {
        setEvents(data);
        
        // Count events by category
        const counts: Record<string, number> = {};
        data.forEach(event => {
          counts[event.category] = (counts[event.category] || 0) + 1;
        });
        setEventCounts(counts);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleViewAll = () => {
    if (user) {
      navigate("/events");
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleEventClick = (eventId: string) => {
    if (user) {
      navigate(`/events/${eventId}`);
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <WelcomeLayout>
      <Seo 
        title="Discover Events" 
        description="Explore popular events near you, browse by category, or check out some of the great community calendars"
        canonical="/discover" 
      />

      {/* Hero Section */}
      <section className="container max-w-4xl py-12 space-y-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Discover Events
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore popular events near you, browse by category, or check out some of the great community calendars
          </p>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="container max-w-4xl pb-12 space-y-5">
        <h2 className="text-xl font-bold">Browse by category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = eventCounts[category.name] || Math.floor(Math.random() * 2000) + 100;
            
            return (
              <button
                key={category.name}
                onClick={handleViewAll}
                className="group p-4 rounded-lg border bg-card hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{count.toLocaleString()} Events</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Events */}
      <section className="container max-w-4xl pb-12 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured Events</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} onClick={() => handleEventClick(event.id)} className="cursor-pointer">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-6">
          <Button onClick={handleViewAll} size="lg" className="px-8">
            View All Events
          </Button>
        </div>
      </section>

      <AuthRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message="Sign in to view all events and save your favorites"
      />
    </WelcomeLayout>
  );
};

export default Discover;
