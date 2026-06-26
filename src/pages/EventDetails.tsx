import { useParams, Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_PUBLIC_COLUMNS } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, DollarSign, Copy, Check, Video, Globe, Users, Mail, Phone, Building2, ExternalLink, ArrowLeft, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredModal } from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import EventRegistrationDialog from "@/components/events/EventRegistrationDialog";
import { ReportEventDialog } from "@/components/events/ReportEventDialog";
import { ErrorCard } from "@/components/common/ErrorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const EventDetails = () => {
  const { id } = useParams();
  const { categories } = useCategories();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState<string | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number>(0);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      // Authenticated viewers get the full row (including host contact info)
      // because Postgres column-level grants only restrict anon. Anonymous
      // visitors must use the safe column list to satisfy permissions.
      const eventPromise = supabase
        .from('events')
        .select(user ? '*' : EVENT_PUBLIC_COLUMNS)
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

      const countPromise = supabase.rpc('get_event_registration_count', { _event_id: id });

      const [eventResult, registrationResult, countResult] = await Promise.all([
        eventPromise,
        registrationPromise,
        countPromise,
      ]);

      if (eventResult.error) throw eventResult.error;
      setEvent(eventResult.data);

      if (registrationResult.data) {
        setUserRegistrationStatus(registrationResult.data.status);
      }

      if (!countResult.error && typeof countResult.data === 'number') {
        setRegistrationCount(countResult.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
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

  if (loading) {
    return (
      <>
        <Seo title="Loading..." />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="w-full aspect-[2/1] rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Seo title="Error" />
        <div className="max-w-5xl mx-auto px-4 py-20">
          <ErrorCard message={error} onRetry={fetchEvent} />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Seo title="Event Not Found" />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <Button asChild variant="link">
            <Link to="/discover">Browse events</Link>
          </Button>
        </div>
      </>
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
  const isPendingOrDraft = false; // instant publish removed pending gate
  const isApproved = ['published', 'featured', 'approved', 'upcoming', 'ongoing'].includes(event.status);

  return (
    <>
      <Seo 
        title={event.title} 
        description={event.description || `${event.category} event at ${event.location} • ${fullDate}`} 
        canonical={`/events/${event.id}`}
        ogImage={event.image_url || undefined}
        ogType="event"
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
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

        <div className="rounded-xl overflow-hidden border">
          <img 
            src={event.image_url || '/placeholder.svg'} 
            alt={event.title}
            className="w-full aspect-[2/1] object-cover"
            loading="lazy"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">{event.category}</Badge>
            {eventTypeDisplay && (
              <Badge variant="outline" className="text-xs">
                <eventTypeDisplay.icon className={`h-3 w-3 mr-1 ${eventTypeDisplay.color}`} />
                {eventTypeDisplay.label}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{event.title}</h1>
        </div>

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
              {event.event_type === 'online' ? <Video className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{event.event_type === 'online' ? 'Online Event' : event.location || 'TBA'}</div>
              <div className="text-xs text-muted-foreground">{event.event_type === 'online' ? 'Virtual' : 'Location'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{event.price === 0 ? 'Free' : `$${event.price}`}</div>
              <div className="text-xs text-muted-foreground">Price</div>
            </div>
          </div>
        </div>

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
        ) : (() => {
          const cap = event.max_attendees as number | null | undefined;
          const isFull = cap != null && registrationCount >= cap;
          return (
            <>
              {cap != null ? (
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{registrationCount} of {cap} spots filled</span>
                    </div>
                    <span className={`text-xs font-medium ${isFull ? 'text-destructive' : (cap - registrationCount) <= Math.max(1, Math.floor(cap * 0.1)) ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}>
                      {isFull ? 'Sold out' : `${cap - registrationCount} spots left`}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (registrationCount / cap) * 100)} className="h-2" />
                </div>
              ) : registrationCount > 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <Users className="h-4 w-4" />
                  <span>{registrationCount} {registrationCount === 1 ? 'person' : 'people'} registered</span>
                </div>
              ) : null}
              <Button onClick={handleRegisterClick} size="lg" className="w-full" disabled={isFull}>
                {isFull ? 'Event is Full' : 'Register for Event'}
              </Button>
            </>
          );
        })()}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">About</h2>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {event.description || (
              <p>Join us for this {event.category.toLowerCase()} event. Connect with others, learn new things, and be part of an engaging experience.</p>
            )}
          </div>
        </section>

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
                <div className="text-sm text-muted-foreground">{event.host_name ? 'Event Organizer' : 'Event Platform'}</div>
              </div>
            </div>
            {event.host_description && (
              <p className="text-sm text-muted-foreground">{event.host_description}</p>
            )}
            {user && (user.id === event.created_by || userRegistrationStatus === 'approved') && (event.host_email || event.host_phone) && (
              <div className="flex flex-wrap gap-4 pt-3 border-t">
                {event.host_email && (
                  <a href={`mailto:${event.host_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    {event.host_email}
                  </a>
                )}
                {event.host_phone && (
                  <a href={`tel:${event.host_phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                    {event.host_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {(() => {
          const socialLinks = [
            { url: event.facebook_url, icon: Facebook, label: 'Facebook' },
            { url: event.twitter_url, icon: Twitter, label: 'Twitter / X' },
            { url: event.instagram_url, icon: Instagram, label: 'Instagram' },
            { url: event.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
            { url: event.website_url, icon: Globe, label: 'Website' },
          ].filter(l => l.url);
          if (socialLinks.length === 0) return null;
          return (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Links</h2>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(({ url, icon: Icon, label }) => (
                  <Button key={label} asChild variant="outline" size="sm">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </a>
                  </Button>
                ))}
              </div>
            </section>
          );
        })()}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Share Event</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {linkCopied ? 'Copied' : 'Copy Link'}
            </Button>
          </div>
        </section>

        {!isCreator && (
          <div className="flex justify-center">
            <ReportEventDialog eventId={event.id} eventTitle={event.title} />
          </div>
        )}
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
    </>
  );
};

export default EventDetails;
