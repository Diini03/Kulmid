import { useState, useEffect, useMemo } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/events/EventCard";
import { smartShuffleEvents, fetchRegistrationCounts } from "@/utils/eventSorting";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Search, Plus, CalendarPlus } from "lucide-react";
import { ErrorCard } from "@/components/common/ErrorCard";
import { EventItem, EVENT_LIST_COLUMNS } from "@/types/event";

const Discover = () => {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const [featured, setFeatured] = useState<EventItem[]>([]);
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusKey = 'kulmid_status_updated';
      if (!sessionStorage.getItem(statusKey)) {
        await supabase.rpc('update_event_status');
        sessionStorage.setItem(statusKey, '1');
      }

      // Featured (admin-curated)
      const featuredRes = await supabase
        .from('events')
        .select(EVENT_LIST_COLUMNS)
        .eq('status', 'featured')
        .order('date', { ascending: true });
      if (featuredRes.error) throw featuredRes.error;

      // Upcoming pool (all live)
      const upcomingRes = await supabase
        .from('events')
        .select(EVENT_LIST_COLUMNS)
        .in('status', ['published', 'approved', 'upcoming', 'ongoing', 'featured'])
        .order('date', { ascending: true });
      if (upcomingRes.error) throw upcomingRes.error;

      const upcomingList = upcomingRes.data || [];
      const ids = upcomingList.map((e) => e.id);
      const counts = await fetchRegistrationCounts(supabase, ids);
      setFeatured(featuredRes.data || []);
      setUpcoming(smartShuffleEvents(upcomingList, counts));
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUpcoming = useMemo(() => {
    let list = upcoming;
    if (activeCategory !== "All") {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (debouncedQuery) {
      list = list.filter((e) =>
        (e.title || "").toLowerCase().includes(debouncedQuery) ||
        (e.location || "").toLowerCase().includes(debouncedQuery) ||
        (e.category || "").toLowerCase().includes(debouncedQuery)
      );
    }
    return list;
  }, [upcoming, activeCategory, debouncedQuery]);

  const filteredFeatured = useMemo(() => {
    if (activeCategory === "All" && !debouncedQuery) return featured;
    return featured.filter((e) => {
      const catOk = activeCategory === "All" || e.category === activeCategory;
      const qOk = !debouncedQuery ||
        (e.title || "").toLowerCase().includes(debouncedQuery) ||
        (e.location || "").toLowerCase().includes(debouncedQuery);
      return catOk && qOk;
    });
  }, [featured, activeCategory, debouncedQuery]);

  const visibleUpcoming = filteredUpcoming.slice(0, visibleCount);
  const hasResults = filteredFeatured.length + filteredUpcoming.length > 0;

  return (
    <>
      <Seo
        title="Discover Events" 
        description="Explore popular events near you, browse by category, or check out some of the great community calendars" 
        canonical="/discover" 
      />

      {/* Hero / Search / Filters */}
      <section className="border-b bg-card/40">
        <div className="container max-w-5xl px-4 py-12 md:py-16">
          <div className="max-w-2xl mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {t("discover_title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("discover_subtitle")}
            </p>
          </div>

          {/* Inline search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, organizers, cities..."
              className="h-12 pl-11 text-base"
              aria-label="Search events"
            />
          </div>

          {/* Category pill row */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            <CategoryPill
              active={activeCategory === "All"}
              onClick={() => setActiveCategory("All")}
              label="All"
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.name}
                active={activeCategory === c.name}
                onClick={() => setActiveCategory(c.name)}
                label={c.name}
              />
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="container max-w-5xl px-4 py-12">
          <ErrorCard message={error} onRetry={fetchData} />
        </section>
      ) : loading ? (
        <section className="container max-w-5xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="h-48 w-full rounded-xl bg-secondary" />
                <div className="h-6 w-3/4 rounded-lg bg-secondary" />
                <div className="h-4 w-2/3 rounded bg-secondary" />
              </div>
            ))}
          </div>
        </section>
      ) : !hasResults ? (
        <DiscoverEmptyState
          query={debouncedQuery}
          category={activeCategory}
          loggedIn={!!user}
        />
      ) : (
        <>
          {/* Featured */}
          {filteredFeatured.length > 0 && (
            <section className="container max-w-5xl px-4 py-12 md:py-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Featured</h2>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Curated by Kulmid</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFeatured.map((event) => (
                  <EventCard key={event.id} event={event} basePath="/discover" />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {filteredUpcoming.length > 0 && (
            <section className="container max-w-5xl px-4 py-12 md:py-14 border-t">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {activeCategory === "All" ? "Upcoming events" : `${activeCategory} events`}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {filteredUpcoming.length} {filteredUpcoming.length === 1 ? "event" : "events"}
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleUpcoming.map((event) => (
                  <EventCard key={event.id} event={event} basePath="/discover" />
                ))}
              </div>
              {visibleCount < filteredUpcoming.length && (
                <div className="text-center mt-10">
                  <Button onClick={() => setVisibleCount((c) => c + 9)} variant="outline" size="lg" className="px-10">
                    Load more
                  </Button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
};

const CategoryPill = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-foreground border-border hover:bg-secondary"
    }`}
  >
    {label}
  </button>
);

const DiscoverEmptyState = ({
  query,
  category,
  loggedIn,
}: { query: string; category: string; loggedIn: boolean }) => {
  let title = "No events yet";
  let description = "Be the first to create an event for this community.";
  if (query) {
    title = `No events match "${query}"`;
    description = "Try a different keyword or clear the search.";
  } else if (category !== "All") {
    title = `No ${category} events yet`;
    description = `Be the first to create a ${category.toLowerCase()} event.`;
  }
  return (
    <section className="container max-w-5xl px-4 py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <CalendarPlus className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-8">{description}</p>
        <Button asChild variant="default" size="lg" className="gap-2">
          <Link to={loggedIn ? "/create" : "/signup"}>
            <Plus className="h-4 w-4" />
            Be the first to create one
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Discover;
