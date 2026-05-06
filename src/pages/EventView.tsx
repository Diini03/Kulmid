import { useParams, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, DollarSign, ExternalLink, Globe, Users, Video, Copy, Check, Building2, ArrowLeft, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useState, useEffect } from "react";
import { categories } from "@/constants/categories";
import { toast } from "@/hooks/use-toast";
import EventRegistrationDialog from "@/components/events/EventRegistrationDialog";
import { ReportEventDialog } from "@/components/events/ReportEventDialog";
import { ErrorCard } from "@/components/common/ErrorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationCount, setRegistrationCount] = useState<number>(0);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: fetchError }, countResult] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).maybeSingle(),
        supabase.rpc('get_event_registration_count', { _event_id: id }),
      ]);

      if (fetchError) throw fetchError;
      setEvent(data);
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
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "✅ Link copied!",
      description: "Event link has been copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Loading..." />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="w-full h-[300px] rounded-xl" />
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Seo title="Error" />
        <ErrorCard message={error} onRetry={fetchEvent} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Seo title="Event Not Found" />
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">
            This event may have been removed or doesn't exist. Please check the link and try again.
          </p>
          <Button asChild size="lg">
            <a href={window.location.origin}>Visit Kulmid</a>
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const categoryConfig = categories.find(c => c.name === event.category);
  
  const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const time = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const fullDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const endTime = endDate ? endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;
  const endDateStr = endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : null;

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
    <div className="min-h-screen bg-background">
      <Seo 
        title={event.title} 
        description={event.description || `${event.category} event at ${event.location} • ${fullDate}`} 
        canonical={`/event/${event.id}`}
        ogImage={event.image_url || undefined}
        ogType="event"
      />

      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {linkCopied ? 'Copied' : 'Share'}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-xl overflow-hidden border max-w-2xl mx-auto">
          <img src={event.image_url || '/placeholder.svg'} alt={event.title} className="w-full aspect-[16/9] object-cover" loading="lazy" />
        </div>

        <div className="space-y-4">
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
              <div className="text-xs text-muted-foreground">
                {time}{endDate ? ` – ${endDateStr !== `${monthShort} ${day}` ? `${endDateStr}, ` : ''}${endTime}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {event.event_type === 'online' ? <Video className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
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
              <div className="text-sm font-medium">{event.price === 0 ? 'Free' : `$${event.price}`}</div>
              <div className="text-xs text-muted-foreground">Price</div>
            </div>
          </div>
        </div>

        {(() => {
          const cap = event.max_attendees as number | null | undefined;
          const isFull = cap != null && registrationCount >= cap;
          return (
            <div className="space-y-3">
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
              <Button onClick={() => setRegistrationOpen(true)} size="lg" className="w-full" disabled={isFull}>
                {isFull ? 'Event is Full' : 'Register for Event'}
              </Button>
            </div>
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
                <div className="text-sm text-muted-foreground">
                  {event.host_name ? 'Event Organizer' : 'Event Platform'}
                </div>
              </div>
            </div>
            {event.host_description && (
              <p className="text-sm text-muted-foreground">{event.host_description}</p>
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

        <div className="flex justify-center pb-4">
          <ReportEventDialog eventId={event.id} eventTitle={event.title} />
        </div>

        <div className="h-8" />
      </main>

      <EventRegistrationDialog
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
        eventId={id!}
        eventTitle={event.title}
        price={event.price}
        autoApprove={event.auto_approve_registrations || false}
      />
    </div>
  );
};

export default EventView;
