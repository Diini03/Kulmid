import { useParams, Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, DollarSign, Copy, Check, Video, Globe, Users, Mail, Phone, Building2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredModal } from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";
import { categories } from "@/constants/categories";
import EventRegistrationDialog from "@/components/events/EventRegistrationDialog";

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchEvent = async () => {
      try {
        const eventPromise = supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        const registrationPromise = user
          ? supabase
              .from('event_guests')
              .select('status')
              .eq('event_id', id)
              .eq('email', user.email)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const [eventResult, registrationResult] = await Promise.all([
          eventPromise,
          registrationPromise,
        ]);

        if (!mounted) return;

        if (eventResult.data) {
          setEvent(eventResult.data);
        }

        if (registrationResult.data) {
          setUserRegistrationStatus(registrationResult.data.status);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEvent();
    
    return () => {
      mounted = false;
    };
  }, [id, user]);

  const handleRegisterClick = () => {
    if (event.price > 0 && !user) {
      setAuthAction("register for this event");
      setShowAuthModal(true);
    } else {
      setRegistrationOpen(true);
    }
  };

  const shortUrl = `${window.location.origin}/e/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Event link has been copied to clipboard",
    });
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
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-muted-foreground">
          Loading event...
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <Seo title="Event Not Found" />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <Button asChild variant="link">
            <Link to="/discover">Browse events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const eventDate = new Date(event.date);
  const categoryConfig = categories.find(c => c.name === event.category);
  
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
  const isCreator = user?.id === event.created_by;
  const isPendingOrDraft = ['pending', 'draft'].includes(event.status);
  const isApproved = event.status === 'approved';

  return (
    <Layout>
      <Seo 
        title={event.title} 
        description={event.description || `${event.category} event at ${event.location} • ${fullDate}`} 
        canonical={`/events/${event.id}`} 
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Event Status Banner */}
        {isApproved ? (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              This event is publicly listed on Kulmid
            </p>
          </div>
        ) : isPendingOrDraft && (
          <div className="p-3 bg-muted/50 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Your event is not yet publicly listed on Kulmid. You can still manage registrations and share your event link.
            </p>
          </div>
        )}

        {/* Event Image */}
        <div className="rounded-xl overflow-hidden border">
          <img 
            src={event.image_url || '/placeholder.svg'} 
            alt={event.title}
            className="w-full aspect-[2/1] object-cover"
          />
        </div>

        {/* Event Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {event.category}
            </Badge>
            {eventTypeDisplay && (
              <Badge variant="outline" className="text-xs">
                <eventTypeDisplay.icon className={`h-3 w-3 mr-1 ${eventTypeDisplay.color}`} />
                {eventTypeDisplay.label}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {event.title}
          </h1>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{weekday}, {monthShort} {day}</div>
              <div className="text-xs text-muted-foreground">{time}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {event.event_type === 'online' ? (
                <Video className="h-5 w-5 text-primary" />
              ) : (
                <MapPin className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {event.event_type === 'online' ? 'Online Event' : event.location || 'TBA'}
              </div>
              <div className="text-xs text-muted-foreground">
                {event.event_type === 'online' ? 'Virtual' : 'Location'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {event.price === 0 ? 'Free' : `$${event.price}`}
              </div>
              <div className="text-xs text-muted-foreground">Price</div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        {userRegistrationStatus ? (
          <div className="p-4 rounded-lg border bg-muted/50 text-center">
            <Badge 
              className="text-sm px-4 py-2"
              variant={
                userRegistrationStatus === "registered" ? "default" :
                userRegistrationStatus === "pending" ? "secondary" :
                "destructive"
              }
            >
              {userRegistrationStatus === "registered" && "You're Registered"}
              {userRegistrationStatus === "pending" && "Registration Pending Approval"}
              {userRegistrationStatus === "rejected" && "Registration Declined"}
            </Badge>
          </div>
        ) : (
          <Button onClick={handleRegisterClick} size="lg" className="w-full">
            Register for Event
          </Button>
        )}

        {/* About Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">About</h2>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {event.description || (
              <p>
                Join us for this {event.category.toLowerCase()} event. Connect with others, learn new things, and be part of an engaging experience.
              </p>
            )}
          </div>
        </section>

        {/* Meeting Link */}
        {(event.event_type === 'online' || event.event_type === 'hybrid') && event.meeting_link && (
          <section className="p-4 bg-muted/50 rounded-lg border space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Video className="h-4 w-4 text-primary" />
              Online Access
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Meeting
              </a>
            </Button>
          </section>
        )}

        {/* Organizer Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organized By
          </h2>
          
          <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-primary">
                  {event.host_name ? event.host_name.charAt(0).toUpperCase() : 'K'}
                </span>
              </div>
              <div>
                <div className="font-medium">{event.host_name || 'Kulmid'}</div>
                <div className="text-sm text-muted-foreground">
                  {event.host_name ? 'Event Organizer' : 'Event Platform'}
                </div>
              </div>
            </div>

            {event.host_description && (
              <p className="text-sm text-muted-foreground">
                {event.host_description}
              </p>
            )}

            {(event.host_email || event.host_phone) && (
              <div className="flex flex-wrap gap-4 pt-3 border-t">
                {event.host_email && (
                  <a 
                    href={`mailto:${event.host_email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {event.host_email}
                  </a>
                )}
                {event.host_phone && (
                  <a 
                    href={`tel:${event.host_phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {event.host_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Share Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Share Event</h2>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {linkCopied ? 'Copied' : 'Copy Link'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSocialShare('twitter')}>
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSocialShare('facebook')}>
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSocialShare('whatsapp')}>
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
          </div>
        </section>
      </div>

      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        action={authAction}
      />

      <EventRegistrationDialog
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
        eventId={id!}
        eventTitle={event.title}
        price={event.price}
        autoApprove={event.auto_approve_registrations || false}
      />
    </Layout>
  );
};

export default EventDetails;
