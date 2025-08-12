import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { SearchBar } from "@/components/events/SearchBar";
import { EventCard } from "@/components/events/EventCard";
import { events as allEvents, type EventItem } from "@/data/events";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const sorters: Record<string, (a: EventItem, b: EventItem) => number> = {
  Latest: (a, b) => +new Date(b.date) - +new Date(a.date),
  Popular: () => 0,
  "Price Low→High": (a, b) => a.price - b.price,
  "Price High→Low": (a, b) => b.price - a.price,
};

const EventsPage = () => {
  const [sort, setSort] = useState<string>("Latest");
  const [quick, setQuick] = useState<EventItem | null>(null);

  const events = useMemo(() => {
    const list = [...allEvents];
    const sorter = sorters[sort] || sorters.Latest;
    return list.sort(sorter);
  }, [sort]);

  return (
    <Layout>
      <Seo title="Events" description="Explore events by category, location, date and more." canonical="/events" />

      <section className="container py-10 space-y-6">
        <div className="glass rounded-xl p-4 shadow-[var(--shadow-soft)]">
          <SearchBar onSearch={() => {}} compact />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Events</h1>
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onQuickView={setQuick} />
          ))}
        </div>
      </section>

      <Dialog open={!!quick} onOpenChange={(o) => !o && setQuick(null)}>
        <DialogContent>
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
