import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, DollarSign, Copy, Check, Video, Globe, Users, Mail, Phone, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredModal } from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";
import { categories, type EventCategory } from "@/constants/categories";

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [shortLinkCopied, setShortLinkCopied] = useState(false);

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

  const shareUrl = `${window.location.origin}/event/${id}`;
  const shortUrl = `${window.location.origin}/e/${id}`;

  const handleCopyLink = (url: string, isShort: boolean = false) => {
    navigator.clipboard.writeText(url);
    if (isShort) {
      setShortLinkCopied(true);
      setTimeout(() => setShortLinkCopied(false), 2000);
    } else {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    toast({
      title: "✅ Link copied!",
      description: "Event link has been copied to clipboard",
    });
  };

  const handleShareClick = () => {
    if (!user) {
      setAuthAction("share this event");
      setShowAuthModal(true);
    } else {
      handleCopyLink(shareUrl);
    }
  };

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent(`Check out ${event?.title}!`);
    const url = encodeURIComponent(shortUrl);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
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
  const categoryConfig = categories.find(c => c.name === event.category);
  
  // Format date parts
  const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const time = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const fullDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getEventTypeDisplay = () => {
    switch (event.event_type) {
      case 'in-person':
        return { label: 'In-Person', icon: MapPin, color: 'text-green-600 dark:text-green-400' };
      case 'online':
        return { label: 'Online', icon: Globe, color: 'text-blue-600 dark:text-blue-400' };
      case 'hybrid':
        return { label: 'Hybrid', icon: Users, color: 'text-purple-600 dark:text-purple-400' };
      default:
        return null;
    }
  };

  const eventTypeDisplay = getEventTypeDisplay();

  return (
    <Layout>
      <Seo 
        title={event.title} 
        description={event.description || `${event.category} event at ${event.location} • ${fullDate}`} 
        canonical={`/events/${event.id}`} 
      />

      {/* Main Content Container with gradient background */}
      <div className="bg-gradient-to-b from-background to-muted/20 py-8 md:py-12">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[380px_1fr] gap-8 lg:gap-12">
            
            {/* LEFT SIDEBAR - Sticky */}
            <aside className="lg:sticky lg:top-24 h-fit space-y-6">
              {/* Event Image */}
              <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                <div className="relative aspect-[4/3] overflow-hidden group">
                  <img 
                    src={event.image_url || '/placeholder.svg'} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                </div>
              </Card>

              {/* Date Card */}
              <Card className="border-2 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-center">
                      <div className="text-sm font-semibold text-primary">{monthShort}</div>
                      <div className="text-4xl font-bold">{day}</div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="font-semibold text-foreground">{weekday}</div>
                      <div className="text-sm text-muted-foreground mt-1">{time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Details Card */}
              <Card className="border-2 shadow-md">
                <CardContent className="p-6 space-y-4">
                  {/* Location */}
                  {(event.event_type === 'in-person' || event.event_type === 'hybrid') && event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">Location</div>
                        <div className="text-muted-foreground">{event.location}</div>
                      </div>
                    </div>
                  )}

                  {/* Meeting Link */}
                  {(event.event_type === 'online' || event.event_type === 'hybrid') && event.meeting_link && (
                    <div className="flex items-start gap-3">
                      <Video className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm flex-1">
                        <div className="font-medium mb-2">Meeting Link</div>
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                            Join Online
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium mb-1">Price</div>
                      <div className="text-3xl font-bold text-primary">
                        ${event.price}
                        {event.price === 0 && <span className="text-lg font-normal text-muted-foreground ml-2">Free</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Button */}
              <Button 
                onClick={handleBookClick}
                size="lg" 
                className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all hover-lift"
              >
                Register for Event
              </Button>

              {/* Share Section with Links */}
              <Card className="border-2 shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="text-sm font-medium">Share this event</div>
                  
                  {/* Copy Link Section */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Event Link</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-muted rounded-md text-xs truncate">
                        {shortUrl}
                      </div>
                      <Button 
                        onClick={() => handleCopyLink(shortUrl, true)}
                        variant="outline" 
                        size="icon"
                        className="flex-shrink-0"
                      >
                        {shortLinkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-2">Share on social media</div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSocialShare('twitter')}
                        className="flex-1"
                        title="Share on Twitter"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSocialShare('facebook')}
                        className="flex-1"
                        title="Share on Facebook"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSocialShare('linkedin')}
                        className="flex-1"
                        title="Share on LinkedIn"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSocialShare('whatsapp')}
                        className="flex-1"
                        title="Share on WhatsApp"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* RIGHT MAIN CONTENT */}
            <main className="space-y-8 max-w-4xl">
              {/* Header Section */}
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="text-sm px-3 py-1">
                    {event.category}
                  </Badge>
                  {eventTypeDisplay && (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <eventTypeDisplay.icon className={`h-3.5 w-3.5 mr-1.5 ${eventTypeDisplay.color}`} />
                      {eventTypeDisplay.label}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  {event.title}
                </h1>
              </div>

              {/* About Section */}
              <Card className="border-2 shadow-md">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">About This Event</h2>
                  
                {event.description ? (
                  <div className="prose prose-lg dark:prose-invert max-w-3xl">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-muted-foreground leading-relaxed">
                        Join us for an exceptional {event.category.toLowerCase()} that brings together industry leaders, innovators, and passionate professionals. This event is designed to inspire, educate, and create meaningful connections.
                      </p>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        Our carefully curated program features cutting-edge insights, hands-on workshops, and networking opportunities that will enhance your professional journey.
                      </p>
                      
                      <div className="pt-4">
                        <h3 className="text-xl font-semibold mb-4">What You'll Gain</h3>
                        <ul className="space-y-3 text-muted-foreground">
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-1">✓</span>
                            <span>Expert insights from industry leaders</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-1">✓</span>
                            <span>Practical skills through interactive workshops</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-1">✓</span>
                            <span>Networking with like-minded professionals</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-1">✓</span>
                            <span>Exclusive resources and materials</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Organized By Section */}
              <Card className="border-2 shadow-md">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organized By
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Host Name */}
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-primary">
                          {event.host_name ? event.host_name.charAt(0).toUpperCase() : 'K'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {event.host_name || 'Kulmid'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.host_name ? 'Event Organizer' : 'Event Platform'}
                        </div>
                      </div>
                    </div>

                    {/* Host Description */}
                    {event.host_description && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {event.host_description}
                        </p>
                      </div>
                    )}

                    {/* Contact Information */}
                    {(event.host_email || event.host_phone) && (
                      <div className="pt-4 border-t space-y-3">
                        <div className="text-sm font-medium text-foreground mb-2">Contact Information</div>
                        
                        {event.host_email && (
                          <a 
                            href={`mailto:${event.host_email}`}
                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                          >
                            <Mail className="h-4 w-4 flex-shrink-0 group-hover:text-primary" />
                            <span className="break-all">{event.host_email}</span>
                          </a>
                        )}
                        
                        {event.host_phone && (
                          <a 
                            href={`tel:${event.host_phone}`}
                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                          >
                            <Phone className="h-4 w-4 flex-shrink-0 group-hover:text-primary" />
                            <span>{event.host_phone}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </main>
          </div>
        </div>
      </div>

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
