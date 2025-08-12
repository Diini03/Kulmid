import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { events } from "@/data/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

const EventDetails = () => {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);
  const [bookOpen, setBookOpen] = useState(false);
  const [qty, setQty] = useState(1);

  if (!event) return (
    <Layout>
      <Seo title="Event Not Found" />
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Event not found</h1>
        <Button asChild variant="link"><Link to="/events">Back to events</Link></Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Seo title={event.title} description={`${event.location} • ${new Date(event.date).toLocaleDateString()}`} canonical={`/events/${event.id}`} />

      <section className="relative">
        <img src={event.image} alt={event.title} className="w-full h-[320px] object-cover" />
        <div className="container relative -mt-10">
          <div className="rounded-xl border bg-background p-6 shadow-[var(--shadow-soft)]">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <h1 className="text-2xl font-bold">{event.title}</h1>
                <p className="text-sm text-muted-foreground">{event.location} • {new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{event.category}</Badge>
                <Badge className="bg-primary text-primary-foreground">${event.price}</Badge>
                <Button onClick={() => setBookOpen(true)}>Book Now</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <Tabs defaultValue="description" className="w-full">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="prose dark:prose-invert max-w-none">
            <p>Join us for an inspiring event featuring industry leaders, hands-on sessions, and networking opportunities. Perfect for professionals and enthusiasts alike.</p>
          </TabsContent>
          <TabsContent value="schedule">
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>09:00 — Registration & Coffee</li>
              <li>10:00 — Opening Keynote</li>
              <li>13:00 — Workshops</li>
              <li>17:00 — Networking</li>
            </ul>
          </TabsContent>
          <TabsContent value="speakers">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => (
                <div key={i} className="rounded-xl border p-4">
                  <div className="h-28 w-full rounded-md bg-muted mb-3" />
                  <div className="font-semibold">Speaker {i}</div>
                  <div className="text-sm text-muted-foreground">Role / Company</div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="faqs">
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium">What is the refund policy?</div>
                <p className="text-muted-foreground">Full refund up to 7 days before the event.</p>
              </div>
              <div>
                <div className="font-medium">Are group discounts available?</div>
                <p className="text-muted-foreground">Yes, contact us for group rates.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Tickets</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between">
            <div className="text-sm">Quantity</div>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-md border" onClick={() => setQty((q) => Math.max(1, q-1))}>-</button>
              <div className="w-8 text-center">{qty}</div>
              <button className="h-9 w-9 rounded-md border" onClick={() => setQty((q) => q+1)}>+</button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <span className="font-semibold">${event.price * qty}</span>
          </div>
          <DialogFooter>
            <Button onClick={() => setBookOpen(false)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventDetails;
