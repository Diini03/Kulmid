import { useParams, Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

const EventView = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Loading..." />
        <div className="container py-20 text-center">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Seo title="Event Not Found" />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button asChild>
            <a href={window.location.origin}>Visit Kulmid</a>
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title={event.title} 
        description={`${event.location} • ${eventDate.toLocaleDateString()}`} 
        canonical={`/event/${event.id}`} 
      />

      {/* Floating Kulmid Link */}
      <div className="fixed top-4 right-4 z-50">
        <Button asChild variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
          <a href={window.location.origin} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Kulmid
          </a>
        </Button>
      </div>

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

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-2">
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

                  <div className="pt-4 border-t">
                    <Button asChild size="lg" className="w-full">
                      <a href={`${window.location.origin}/events/${event.id}`}>
                        Register on Kulmid
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventView;
