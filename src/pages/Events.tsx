import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { SearchBar } from "@/components/events/SearchBar";
import { EventCard } from "@/components/events/EventCard";
import { events as allEvents, type EventItem } from "@/data/events";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const sorters: Record<string, (a: EventItem, b: EventItem) => number> = {
  Latest: (a, b) => +new Date(b.date) - +new Date(a.date),
  Popular: () => 0,
  "Price Low→High": (a, b) => a.price - b.price,
  "Price High→Low": (a, b) => b.price - a.price,
};

const EventsPage = () => {
  const [sort, setSort] = useState<string>("Latest");
  const [quick, setQuick] = useState<EventItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const events = useMemo(() => {
    let list = [...allEvents];
    
    // Filter by category
    if (activeFilter !== "All") {
      list = list.filter(e => e.category === activeFilter);
    }
    
    // Sort
    const sorter = sorters[sort] || sorters.Latest;
    return list.sort(sorter);
  }, [sort, activeFilter]);

  return (
    <Layout>
      <Seo title="Events" description="Explore events by category, location, date and more." canonical="/events" />

      {/* Events Hero Section */}
      <section className="container py-12">
        <div className="grid gap-6 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Explore Amazing Events</h1>
          <p className="text-lg text-muted-foreground">
            From intimate workshops to grand conferences - discover events that inspire, educate, and connect.
            Join thousands of enthusiasts in experiences that matter.
          </p>
          <div className="glass rounded-xl p-4 shadow-[var(--shadow-soft)]">
            <SearchBar onSearch={() => {}} compact />
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onQuickView={setQuick} />
          ))}
        </div>
      </section>

      <Dialog open={!!quick} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>{quick?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{quick?.location} • {quick && new Date(quick.date).toLocaleDateString()}</p>
            <p className="text-sm">Price: ${quick?.price}</p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventsPage;
