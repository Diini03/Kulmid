import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Clock, Share2, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredModal } from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setEvent(data);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  const handleBookClick = () => {
    if (!user) {
      setAuthAction("book this event");
      setShowAuthModal(true);
    } else {
      setBookOpen(true);
    }
  };

  const handleShareClick = () => {
    if (!user) {
      setAuthAction("share this event");
      setShowAuthModal(true);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Event link has been copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Seo title="Loading..." />
        <div className="container py-20 text-center">Loading event...</div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <Seo title="Event Not Found" />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <Button asChild variant="link"><Link to="/events">Back to events</Link></Button>
        </div>
      </Layout>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <Layout>
      <Seo title={event.title} description={`${event.location} • ${eventDate.toLocaleDateString()}`} canonical={`/events/${event.id}`} />

      {/* Hero Image */}
      <section className="relative h-[50vh] md:h-[60vh] bg-muted">
        <img 
          src={event.image_url || '/placeholder.svg'} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </section>

      {/* Content */}
      <section className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge>{event.category}</Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{event.title}</h1>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold">About this event</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description || `Join us for an exceptional ${event.category.toLowerCase()} that brings together industry leaders, innovators, and passionate professionals. This event is designed to inspire, educate, and create meaningful connections.`}
                </p>
                
                {!event.description && (
                  <>
                    <p className="text-muted-foreground leading-relaxed">
                      Our carefully curated program features cutting-edge insights, hands-on workshops, and networking opportunities that will enhance your professional journey.
                    </p>
                    
                    <h3 className="text-xl font-semibold mt-8">What you'll gain</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>Expert insights from industry leaders</li>
                      <li>Practical skills through interactive workshops</li>
                      <li>Networking with like-minded professionals</li>
                      <li>Exclusive resources and materials</li>
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-24 border-2">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">Date & Time</div>
                        <div className="text-muted-foreground">
                          {eventDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">Location</div>
                        <div className="text-muted-foreground">{event.location}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">Price</div>
                        <div className="text-2xl font-bold">${event.price}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Button 
                      onClick={handleBookClick} 
                      size="lg" 
                      className="w-full"
                    >
                      Register
                    </Button>
                    <Button 
                      onClick={handleShareClick}
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        action={authAction}
      />

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Number of tickets</span>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQty(q => Math.max(1, q-1))}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQty(q => q+1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold">${event.price * qty}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setBookOpen(false)} className="w-full" size="lg">
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventDetails;
