import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { events } from "@/data/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Users, Clock, Award, Heart } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";

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
        <div className="w-full h-[60vh] relative overflow-hidden">
          <img 
            src={event.image} 
            alt={`${event.title} event banner`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0">
            <div className="container">
              <div className="max-w-4xl text-white space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {event.category}
                  </Badge>
                  <Badge className="bg-primary text-primary-foreground">
                    ${event.price}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-lg">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {event.location}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button onClick={() => setBookOpen(true)} size="lg" className="bg-white text-black hover:bg-white/90">
                    Book Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Share Event
                  </Button>
                </div>
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
          <TabsContent value="description" className="prose dark:prose-invert max-w-none space-y-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold mb-4">About This Event</h3>
                <div className="prose dark:prose-invert">
                  <p className="text-lg leading-relaxed">
                    Join us for an exceptional {event.category.toLowerCase()} that brings together industry leaders, 
                    innovators, and passionate professionals for an unforgettable experience. This event is designed 
                    to inspire, educate, and create meaningful connections that will last long after the day ends.
                  </p>
                  
                  <p>
                    Our carefully curated program features cutting-edge insights, hands-on workshops, and 
                    networking opportunities that will enhance your professional journey. Whether you're looking 
                    to expand your knowledge, meet like-minded individuals, or discover new opportunities, 
                    this event offers something valuable for everyone.
                  </p>
                  
                  <p>
                    Don't miss this chance to be part of a community that's shaping the future. 
                    Secure your spot today and prepare for an experience that will transform your perspective 
                    and accelerate your growth.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="rounded-lg border p-6 bg-muted/20">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    What You'll Gain
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      Expert insights from industry leaders
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      Practical skills through interactive workshops
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      Networking opportunities with professionals
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      Exclusive resources and materials
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      Certificate of completion
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-6 bg-muted/20">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Event Highlights
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Expected Attendees</div>
                      <div className="text-muted-foreground">200+</div>
                    </div>
                    <div>
                      <div className="font-medium">Duration</div>
                      <div className="text-muted-foreground">8 hours</div>
                    </div>
                    <div>
                      <div className="font-medium">Language</div>
                      <div className="text-muted-foreground">English</div>
                    </div>
                    <div>
                      <div className="font-medium">Format</div>
                      <div className="text-muted-foreground">In-Person</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="schedule" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Event Schedule</h3>
              <div className="space-y-4">
                {[
                  { time: "08:30 - 09:00", title: "Registration & Welcome Coffee", desc: "Check-in, networking, and morning refreshments" },
                  { time: "09:00 - 10:30", title: "Opening Keynote", desc: "Industry vision and trends by our keynote speaker" },
                  { time: "10:30 - 10:45", title: "Coffee Break", desc: "Networking opportunity with fellow attendees" },
                  { time: "10:45 - 12:15", title: "Workshop Session 1", desc: "Hands-on learning with practical applications" },
                  { time: "12:15 - 13:30", title: "Lunch & Networking", desc: "Catered lunch with structured networking activities" },
                  { time: "13:30 - 15:00", title: "Workshop Session 2", desc: "Advanced techniques and best practices" },
                  { time: "15:00 - 15:15", title: "Afternoon Break", desc: "Light refreshments and informal discussions" },
                  { time: "15:15 - 16:30", title: "Panel Discussion", desc: "Expert panel Q&A and industry insights" },
                  { time: "16:30 - 17:30", title: "Closing & Networking", desc: "Event wrap-up and final networking session" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{item.time}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
        <DialogContent className="z-[60]">
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
