import { useState, useEffect } from "react";
import { WelcomeLayout } from "@/components/layout/WelcomeLayout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Laptop, Utensils, Sparkles, Palette, Sprout, Dumbbell, Heart, Bitcoin } from "lucide-react";
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
const categories = [{
  name: "Tech",
  icon: Laptop,
  color: "from-blue-500 to-cyan-500"
}, {
  name: "Food & Drink",
  icon: Utensils,
  color: "from-orange-500 to-red-500"
}, {
  name: "AI",
  icon: Sparkles,
  color: "from-purple-500 to-pink-500"
}, {
  name: "Arts & Culture",
  icon: Palette,
  color: "from-pink-500 to-rose-500"
}, {
  name: "Climate",
  icon: Sprout,
  color: "from-green-500 to-emerald-500"
}, {
  name: "Fitness",
  icon: Dumbbell,
  color: "from-red-500 to-orange-500"
}, {
  name: "Wellness",
  icon: Heart,
  color: "from-pink-400 to-purple-400"
}, {
  name: "Crypto",
  icon: Bitcoin,
  color: "from-yellow-500 to-orange-500"
}];
const Discover = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchEvents = async () => {
      await supabase.rpc('update_event_status');
      const {
        data
      } = await supabase.from('events').select('*').in('status', ['upcoming', 'ongoing']).limit(6);
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
  return <WelcomeLayout>
      <Seo title="Discover Events" description="Explore popular events near you, browse by category, or check out some of the great community calendars" canonical="/discover" />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-4xl py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Discover events
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance">
              Explore experiences that inspire you
            </p>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="border-b">
        <div className="container max-w-4xl py-12">
          <h2 className="text-xl font-semibold mb-6">Browse by category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => {
            const Icon = category.icon;
            const count = eventCounts[category.name] || Math.floor(Math.random() * 50) + 10;
            return <button key={category.name} onClick={handleViewAll} className="group p-5 rounded-xl border bg-card hover-lift text-left">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{count} events</p>
                </button>;
          })}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container max-w-4xl py-12 md:py-16">
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

      <AuthRequiredModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="Sign in to view all events and save your favorites" />
    </WelcomeLayout>;
};
export default Discover;