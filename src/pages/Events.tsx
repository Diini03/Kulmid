import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { SearchBar } from "@/components/events/SearchBar";
import { EventCard } from "@/components/events/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  description: string | null;
};

const sorters: Record<string, (a: EventItem, b: EventItem) => number> = {
  Latest: (a, b) => +new Date(b.date) - +new Date(a.date),
  Popular: () => 0,
  "Price Low→High": (a, b) => a.price - b.price,
  "Price High→Low": (a, b) => b.price - a.price,
};

const EventsPage = () => {
  const [sort, setSort] = useState<string>("Latest");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*');

      if (data) {
        setAllEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const events = useMemo(() => {
    let list = [...allEvents];
    
    // Filter by category
    if (activeFilter !== "All") {
      list = list.filter(e => e.category === activeFilter);
    }
    
    // Sort
    const sorter = sorters[sort] || sorters.Latest;
    return list.sort(sorter);
  }, [sort, activeFilter, allEvents]);

  return (
    <Layout>
      <Seo title="Events" description="Explore events by category, location, date and more." canonical="/events" />

      {/* Events Hero Section - Full Width */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Discover Amazing Events
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    From intimate workshops to grand conferences - discover events that inspire, educate, and connect.
                    Join thousands of enthusiasts in experiences that matter to you.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-card border">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{allEvents.length}+</div>
                    <div className="text-sm text-muted-foreground">Events</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">12+</div>
                    <div className="text-sm text-muted-foreground">Cities</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">5K+</div>
                    <div className="text-sm text-muted-foreground">Attendees</div>
                  </div>
                </div>
                
                <div className="glass rounded-xl p-6 shadow-[var(--shadow-soft)]">
                  <SearchBar onSearch={() => {}} compact />
                </div>
              </div>
              
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {allEvents.slice(0, 4).map((event, i) => (
                    <div key={event.id} className={`relative ${i % 2 === 1 ? 'mt-8' : ''}`}>
                      <img 
                        src={event.image_url || '/placeholder.svg'} 
                        alt={event.title}
                        className="rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-sm font-semibold truncate">{event.title}</div>
                        <div className="text-xs opacity-80">${event.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">All Events</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Latest" /></SelectTrigger>
              <SelectContent>
                {Object.keys(sorters).map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
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

        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.length > 0 ? (
              events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No events found.
              </div>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default EventsPage;
