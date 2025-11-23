import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { EventCard } from "@/components/events/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { smartShuffleEvents, fetchRegistrationCounts } from "@/utils/eventSorting";

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

const sorters: Record<string, (a: EventItem, b: EventItem) => number> = {
  Recommended: () => 0, // Will be handled by smart shuffle
  Soonest: (a, b) => +new Date(a.date) - +new Date(b.date),
  Latest: (a, b) => +new Date(b.date) - +new Date(a.date),
  "Price: Low to High": (a, b) => a.price - b.price,
  "Price: High to Low": (a, b) => b.price - a.price,
};

const categories = ["All", "Seminar", "Workshop", "Conference", "Festival", "Sports"] as const;

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [sort, setSort] = useState<string>("Recommended");
  const [activeFilter, setActiveFilter] = useState<string>(
    categoryFromUrl && categories.includes(categoryFromUrl as any) 
      ? categoryFromUrl 
      : "All"
  );
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .in('status', ['approved', 'upcoming', 'ongoing']);

        if (error) throw error;
        
        if (mounted && data) {
          setAllEvents(data);
          
          // Fetch registration counts for popularity scoring
          const eventIds = data.map(e => e.id);
          const counts = await fetchRegistrationCounts(supabase, eventIds);
          setRegistrationCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();
    
    return () => {
      mounted = false;
    };
  }, []);

  const events = useMemo(() => {
    let list = [...allEvents];
    
    if (activeFilter !== "All") {
      list = list.filter(e => e.category === activeFilter);
    }
    
    // Use smart shuffle for "Recommended" sort
    if (sort === "Recommended") {
      return smartShuffleEvents(list, registrationCounts);
    }
    
    const sorter = sorters[sort] || sorters.Recommended;
    return list.sort(sorter);
  }, [sort, activeFilter, allEvents, registrationCounts]);

  const handleFilterChange = (category: string) => {
    setActiveFilter(category);
    
    // Update URL params
    if (category === "All") {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <Seo title="Events" description="Explore events by category, location, date and more." canonical="/events" />

      {/* Simple Header */}
      <section className="border-b bg-card">
        <div className="container py-8 md:py-12">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {activeFilter === "All" ? "Discover events" : `${activeFilter} events`}
              </h1>
              <p className="text-muted-foreground">Find experiences that inspire you</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b">
        <div className="container py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((label) => (
                  <Button
                    key={label}
                    variant={activeFilter === label ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange(label)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(sorters).map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto">
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
          ) : events.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-6">
                {events.length} {events.length === 1 ? 'event' : 'events'} found
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-lg text-muted-foreground mb-4">No events found</div>
              <Button variant="outline" onClick={() => handleFilterChange("All")}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default EventsPage;
