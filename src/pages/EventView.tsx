import { useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, DollarSign, ExternalLink, Globe, Users, Video, Copy, Check, Mail, Phone, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { categories } from "@/constants/categories";
import { toast } from "@/hooks/use-toast";

const EventView = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Seo title="Loading..." />
        <div className="animate-pulse text-muted-foreground">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Seo title="Event Not Found" />
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">This event may have been removed or doesn't exist.</p>
          <Button asChild size="lg">
            <a href={window.location.origin}>Visit Kulmid</a>
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const categoryConfig = categories.find(c => c.name === event.category);
  
  // Format date parts
  const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const time = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const fullDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

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
  const isPendingOrDraft = ['pending', 'draft'].includes(event.status);

  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title={event.title} 
        description={event.description || `${event.category} event at ${event.location} • ${fullDate}`} 
        canonical={`/event/${event.id}`} 
      />

      {/* Minimal Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a 
            href={window.location.origin} 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Kulmid
          </a>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopyLink}
          >
            {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {linkCopied ? 'Copied' : 'Share'}
          </Button>
        </div>
      </header>

      {/* Main Content - Centered Single Column */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Pending/Draft Banner */}
        {isPendingOrDraft && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-amber-600 dark:text-amber-400">⏳</span>
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  {event.status === 'pending' ? 'Pending Approval' : 'Draft Event'}
                </p>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                  This event is awaiting admin approval. Registration will open once approved.
                </p>
              </div>
            </div>
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
        <div className="space-y-4">
          {/* Badges */}
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

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {event.title}
          </h1>
        </div>

        {/* Key Details Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{weekday}, {monthShort} {day}</div>
              <div className="text-xs text-muted-foreground">{time}</div>
            </div>
          </div>

          {/* Location */}
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

          {/* Price */}
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
        {isPendingOrDraft ? (
          <Button 
            disabled
            size="lg" 
            className="w-full"
            variant="secondary"
          >
            Registration Opens After Approval
          </Button>
        ) : (
          <Button 
            asChild 
            size="lg" 
            className="w-full"
          >
            <a href={`${window.location.origin}/events/${event.id}`}>
              Register for Event
            </a>
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

        {/* Meeting Link (if online/hybrid) */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(event.title)}`, '_blank')}
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(event.title + ' ' + window.location.href)}`, '_blank')}
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
          </div>
        </section>

        {/* Bottom Spacer */}
        <div className="h-8" />
      </main>
    </div>
  );
};

export default EventView;
