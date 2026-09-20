import { useParams, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_PUBLIC_COLUMNS } from "@/types/event";
import { eventPath, eventUrl, eventIdOrSlugFilter } from "@/lib/eventUrl";

import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, DollarSign, ExternalLink, Globe, Users, Video, Copy, Check, Building2, ArrowLeft, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/hooks/use-toast";
import EventRegistrationDialog from "@/components/events/EventRegistrationDialog";
import { ReportEventDialog } from "@/components/events/ReportEventDialog";
import { ErrorCard } from "@/components/common/ErrorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import RegistrationStatusBadge from "@/components/events/RegistrationStatusBadge";
import {
  getRegistrationStatus,
  formatRegistrationDate,
  REGISTRATION_STATUS_META,
} from "@/lib/registrationStatus";

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories } = useCategories();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [attendees, setAttendees] = useState<Array<{ name: string | null; email: string }>>([]);
  const [organizer, setOrganizer] = useState<{
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null>(null);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      // Resolve by readable slug first, falling back to the legacy id.
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(user ? '*' : EVENT_PUBLIC_COLUMNS)
        .or(eventIdOrSlugFilter(id as string))
        .maybeSingle();

      if (fetchError) throw fetchError;
      setEvent(data);

      if (data) {
        const realId = (data as any).id as string;

        // Keep the address bar on the canonical slug URL without a re-render.
        const canonicalPath = eventPath(data as any);
        if (window.location.pathname !== canonicalPath) {
          window.history.replaceState(null, '', canonicalPath);
        }

        const [countResult, attendeesResult] = await Promise.all([
          supabase.rpc('get_event_registration_count', { _event_id: realId }),
          supabase
            .from('event_guests')
            .select('name,email')
            .eq('event_id', realId)
            .in('status', ['registered', 'approved'])
            .limit(8),
        ]);

        if (!countResult.error && typeof countResult.data === 'number') {
          setRegistrationCount(countResult.data);
        }
        if (!attendeesResult.error && Array.isArray(attendeesResult.data)) {
          setAttendees(attendeesResult.data as any);
        }

        const creatorId = (data as any).created_by as string | undefined;
        if (creatorId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url, verified')
            .eq('user_id', creatorId)
            .maybeSingle();
          setOrganizer((profile as any) || null);
        }
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
      <div className="light min-h-screen bg-background text-foreground">
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
      <div className="light min-h-screen bg-background text-foreground flex items-center justify-center">
        <Seo title="Error" />
        <ErrorCard message={error} onRetry={fetchEvent} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="light min-h-screen bg-background text-foreground flex items-center justify-center">
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

  const seoDescription =
    event.description || `${event.category} event at ${event.location} • ${fullDate}`;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.date,
    ...(event.end_date ? { endDate: event.end_date } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.event_type === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.event_type === "hybrid"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      event.event_type === "online"
        ? { "@type": "VirtualLocation", url: event.meeting_link || eventUrl(event) }
        : { "@type": "Place", name: event.location, address: event.location },
    ...(event.image_url ? { image: [event.image_url] } : {}),
    description: seoDescription.slice(0, 300),
    url: eventUrl(event),
    organizer: { "@type": "Organization", name: event.host_name || "Kulmid" },
    offers: {
      "@type": "Offer",
      price: String(event.price ?? 0),
      priceCurrency: "USD",
      url: eventUrl(event),
      availability:
        getRegistrationStatus(event as any, registrationCount) === "open"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };

  return (
    <div className="light min-h-screen bg-background text-foreground">
      <Seo 
        title={event.title} 
        description={seoDescription} 
        canonical={eventPath(event)}
        ogImage={event.image_url || undefined}
        ogType="event"
        jsonLd={eventJsonLd}
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
          <Button variant="primary" size="sm" onClick={handleCopyLink}>
            {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {linkCopied ? 'Copied' : 'Share'}
          </Button>
        </div>
      </header>

      {(() => {
        const cap = event.max_attendees as number | null | undefined;
        const regStatus = getRegistrationStatus(event as any, registrationCount);
        const canRegister = regStatus === "open";
        const isFull = regStatus === "full";
        const ctaLabel =
          regStatus === "open"
            ? "Register for Event"
            : regStatus === "full"
              ? "Event Full"
              : regStatus === "upcoming"
                ? "Registration Not Open"
                : regStatus === "cancelled"
                  ? "Registration Cancelled"
                  : "Registration Closed";
        const opensLabel = formatRegistrationDate(event.registration_open_at);
        const closesLabel = formatRegistrationDate(event.registration_close_at ?? event.registration_deadline);
        const statusNote =
          regStatus === "upcoming" && opensLabel
            ? `Registration opens on ${opensLabel}`
            : regStatus === "open" && closesLabel
              ? `Registration closes on ${closesLabel}`
              : REGISTRATION_STATUS_META[regStatus].message;
        const spotsLeft = cap != null ? cap - registrationCount : null;
        const lowSpots = cap != null && spotsLeft != null && spotsLeft > 0 && spotsLeft <= Math.max(1, Math.floor(cap * 0.1));

        const socialLinks = [
          { url: event.facebook_url, icon: Facebook, label: 'Facebook' },
          { url: event.twitter_url, icon: Twitter, label: 'Twitter / X' },
          { url: event.instagram_url, icon: Instagram, label: 'Instagram' },
          { url: event.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
          { url: event.website_url, icon: Globe, label: 'Website' },
        ].filter(l => l.url);

        const CapacityCard = (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-primary" />
                {cap != null ? (
                  <span>{registrationCount} of {cap} spots filled</span>
                ) : (
                  <span>{registrationCount} {registrationCount === 1 ? 'person' : 'people'} registered</span>
                )}
              </div>
              {cap != null && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isFull ? 'bg-destructive/10 text-destructive' : lowSpots ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-primary/10 text-primary'}`}>
                  {isFull ? 'Sold out' : `${spotsLeft} left`}
                </span>
              )}
            </div>
            {cap != null && (
              <Progress value={Math.min(100, (registrationCount / cap) * 100)} className="h-2" />
            )}
          </div>
        );

        const showCapacity = cap != null || registrationCount > 0;

        return (
          <>
            <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-28 md:pb-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                {/* LEFT: image + organizer */}
                <aside className="md:col-span-5 space-y-5">
                  <div className="md:sticky md:top-20 space-y-5">
                    <div className="rounded-xl overflow-hidden border max-w-sm mx-auto md:mx-0">
                      <img
                        src={event.image_url || '/placeholder.svg'}
                        alt={event.title}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="hidden md:block max-w-sm">
                      <div className="p-4 rounded-xl border bg-card space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <Building2 className="h-3.5 w-3.5" />
                          Organized By
                        </div>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={organizer?.avatar_url}
                            name={organizerName}
                            className="h-10 w-10 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              {organizer?.username ? (
                                <Link to={`/u/${organizer.username}`} className="hover:underline truncate">
                                  {organizerName}
                                </Link>
                              ) : (
                                <span className="truncate">{organizerName}</span>
                              )}
                              {organizer?.verified && <VerifiedBadge className="h-4 w-4 flex-shrink-0" />}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {organizer?.verified ? 'Verified organizer' : event.host_name || organizer ? 'Event Organizer' : 'Event Platform'}
                            </div>
                          </div>
                        </div>
                        {event.host_description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{event.host_description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>

                {/* RIGHT: title, meta, CTA, content */}
                <div className="md:col-span-7 space-y-6">
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
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{event.title}</h1>
                  </div>

                  {/* Compact meta row */}
                  <div className="flex flex-wrap gap-4 sm:gap-6 p-3 sm:p-4 bg-muted/50 rounded-xl border text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{weekday}, {monthShort} {day}</div>
                        <div className="text-xs text-muted-foreground">
                          {time}{endDate ? ` – ${endDateStr !== `${monthShort} ${day}` ? `${endDateStr}, ` : ''}${endTime}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      {event.event_type === 'online' ? <Video className="h-4 w-4 text-primary flex-shrink-0" /> : <MapPin className="h-4 w-4 text-primary flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {event.event_type === 'online' ? 'Online' : event.location || 'TBA'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.event_type === 'online' ? 'Virtual' : 'Location'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-medium">{event.price === 0 ? 'Free' : `$${event.price}`}</div>
                        <div className="text-xs text-muted-foreground">Price</div>
                      </div>
                    </div>
                  </div>

                  {/* Capacity + CTA (desktop) */}
                  <div className="hidden md:block space-y-3">
                    {showCapacity && CapacityCard}
                    {regStatus !== "open" && (
                      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                        <RegistrationStatusBadge status={regStatus} />
                        <span className="text-xs">{statusNote}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => setRegistrationOpen(true)}
                      variant="primary"
                      size="xl"
                      className="w-full shadow-md shadow-primary/20"
                      disabled={!canRegister}
                    >
                      {ctaLabel}
                    </Button>
                    {regStatus === "open" && closesLabel && (
                      <p className="text-xs text-center text-muted-foreground">Registration closes on {closesLabel}</p>
                    )}
                    {isFull && event.allow_waitlist && (
                      <p className="text-xs text-center text-muted-foreground">A waitlist will open soon.</p>
                    )}
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a
                        href={(() => {
                          const start = eventDate.toISOString().replace(/[-:]|\.\d{3}/g, '');
                          const end = (endDate || new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)).toISOString().replace(/[-:]|\.\d{3}/g, '');
                          const params = new URLSearchParams({
                            action: 'TEMPLATE',
                            text: event.title,
                            dates: `${start}/${end}`,
                            details: event.description || '',
                            location: event.event_type === 'online' ? (event.meeting_link || 'Online') : (event.location || ''),
                          });
                          return `https://www.google.com/calendar/render?${params.toString()}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Add to Google Calendar
                      </a>
                    </Button>
                  </div>

                  {/* Mobile capacity inline (CTA itself lives in sticky bar) */}
                  {showCapacity && (
                    <div className="md:hidden">{CapacityCard}</div>
                  )}

                  {/* Who's going */}
                  {attendees.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Who's going</h2>
                      <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                        <div className="flex -space-x-2">
                          {attendees.slice(0, 5).map((a, i) => {
                            const initial = (a.name || a.email || '?').charAt(0).toUpperCase();
                            return (
                              <div
                                key={i}
                                className="h-8 w-8 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary"
                                title={a.name || 'Attendee'}
                              >
                                {initial}
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">{registrationCount}</span>{' '}
                          <span className="text-muted-foreground">{registrationCount === 1 ? 'person is' : 'people are'} attending</span>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold">About</h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {event.description || (
                        <p>Join us for this {event.category.toLowerCase()} event. Connect with others, learn new things, and be part of an engaging experience.</p>
                      )}
                    </div>
                  </section>

                  {(event.event_type === 'online' || event.event_type === 'hybrid') && event.meeting_link && (
                    <section className="p-4 bg-muted/50 rounded-xl border space-y-2">
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

                  {/* Mobile organizer */}
                  <section className="md:hidden space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organized By
                    </h2>
                    <div className="p-4 bg-muted/50 rounded-xl border space-y-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={organizer?.avatar_url}
                          name={organizerName}
                          className="h-12 w-12 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium flex items-center gap-1.5">
                            {organizer?.username ? (
                              <Link to={`/u/${organizer.username}`} className="hover:underline truncate">
                                {organizerName}
                              </Link>
                            ) : (
                              <span className="truncate">{organizerName}</span>
                            )}
                            {organizer?.verified && <VerifiedBadge className="h-4 w-4 flex-shrink-0" />}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {organizer?.verified ? 'Verified organizer' : event.host_name || organizer ? 'Event Organizer' : 'Event Platform'}
                          </div>
                        </div>
                      </div>
                      {event.host_description && (
                        <p className="text-sm text-muted-foreground">{event.host_description}</p>
                      )}
                    </div>
                  </section>

                  {socialLinks.length > 0 && (
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
                  )}

                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Share Event</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {linkCopied ? 'Copied' : 'Copy Link'}
                      </Button>
                    </div>
                  </section>

                  <div className="flex justify-center pt-2">
                    <ReportEventDialog eventId={event.id} eventTitle={event.title} />
                  </div>
                </div>
              </div>
            </main>

            {/* Mobile sticky CTA */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md px-4 py-3">
              {regStatus !== "open" && (
                <p className="text-xs text-muted-foreground mb-2 text-center">{statusNote}</p>
              )}
              <Button
                onClick={() => setRegistrationOpen(true)}
                variant="primary"
                size="lg"
                className="w-full shadow-md shadow-primary/20"
                disabled={!canRegister}
              >
                {regStatus === "open" && cap != null ? `Register · ${spotsLeft} spots left` : ctaLabel}
              </Button>
            </div>
          </>
        );
      })()}

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
