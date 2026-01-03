import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingActions } from "@/contexts/PendingActionsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, ChevronRight, MapPin, Users, AlertTriangle, Clock, Compass, CalendarPlus } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string | null;
  status: string;
  image_url: string | null;
  event_type: string | null;
  category: string;
}

const Events = () => {
  const { user, loading: authLoading } = useAuth();
  const { getPendingCountForEvent } = usePendingActions();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserEvents();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUserEvents = async () => {
    if (!user) return;

    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title, date, location, status, image_url, event_type, category")
        .eq("created_by", user.id)
        .order("date", { ascending: true });

      if (eventsError) throw eventsError;

      setEvents(eventsData || []);

      // Fetch guest counts for all events
      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);
        const { data: guestsData, error: guestsError } = await supabase
          .from("event_guests")
          .select("event_id")
          .in("event_id", eventIds)
          .eq("status", "confirmed");

        if (!guestsError && guestsData) {
          const counts: Record<string, number> = {};
          guestsData.forEach(g => {
            counts[g.event_id] = (counts[g.event_id] || 0) + 1;
          });
          setGuestCounts(counts);
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and group events by date
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      if (filter === "upcoming") {
        return !isPast(eventDate) || event.status === "draft" || event.status === "pending";
      } else {
        return isPast(eventDate) && event.status !== "draft" && event.status !== "pending";
      }
    });
  }, [events, filter]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    filteredEvents.forEach(event => {
      const dateKey = format(parseISO(event.date), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedEvents).sort((a, b) => {
      if (filter === "upcoming") {
        return new Date(a).getTime() - new Date(b).getTime();
      } else {
        return new Date(b).getTime() - new Date(a).getTime();
      }
    });
  }, [groupedEvents, filter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-secondary text-muted-foreground",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      upcoming: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      past: "bg-secondary text-muted-foreground",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[status] || styles.draft;
  };

  // Logged out state
  if (!authLoading && !user) {
    return (
      <Layout>
        <Seo title="Events" description="Create and manage your events on Kulmid" canonical="/events" />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="empty-state-card max-w-md mx-4">
            <div className="empty-state-icon">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Sign in to manage your events</h1>
            <p className="text-muted-foreground mb-8">
              Create beautiful event pages, invite guests, and track registrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" variant="default">
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Looking to attend events instead?
              </p>
              <Button asChild variant="ghost">
                <Link to="/discover" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Browse Events on Discover
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <Layout>
        <Seo title="Events" description="Create and manage your events on Kulmid" canonical="/events" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Empty state - no events
  if (events.length === 0) {
    return (
      <Layout>
        <Seo title="Events" description="Create and manage your events on Kulmid" canonical="/events" />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="empty-state-card max-w-md mx-4">
            <div className="empty-state-icon">
              <CalendarPlus className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Create your first event</h1>
            <p className="text-muted-foreground mb-2">
              Host your next event with Kulmid.
            </p>
            <p className="text-muted-foreground mb-8">
              Create beautiful event pages, invite guests, and track attendance.
            </p>
            <Button asChild size="lg" variant="default" className="px-8">
              <Link to="/create" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Your Event
              </Link>
            </Button>
            <div className="mt-10 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                or explore events happening around you
              </p>
              <Button asChild variant="ghost">
                <Link to="/discover" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Discover Events
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Main events list with timeline layout
  return (
    <Layout>
      <Seo title="Events" description="Manage your events on Kulmid" canonical="/events" />
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold">My Events</h1>
          <div className="flex items-center gap-4">
            {/* Filter Toggle */}
            <div className="flex rounded-full border p-1">
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                  filter === "upcoming"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                  filter === "past"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground"
                }`}
              >
                Past
              </button>
            </div>
          </div>
        </div>

        {/* Empty state for current filter */}
        {filteredEvents.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-state-icon mx-auto">
              <Calendar className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground mb-4">
              No {filter} events found.
            </p>
            {filter === "upcoming" && (
              <Button asChild variant="default">
                <Link to="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Timeline Events */}
        <div className="space-y-0">
          {sortedDateKeys.map((dateKey, dateIndex) => {
            const dateEvents = groupedEvents[dateKey];
            const date = parseISO(dateKey);
            
            return (
              <div key={dateKey} className={`flex gap-6 sm:gap-10 animate-slide-up stagger-${Math.min(dateIndex + 1, 6)}`}>
                {/* Date Column */}
                <div className="w-14 sm:w-16 flex-shrink-0 pt-2">
                  <div className="date-stack sticky top-24">
                    <div className="date-stack-month">{format(date, "MMM")}</div>
                    <div className="date-stack-day">{format(date, "d")}</div>
                    <div className="date-stack-year">{format(date, "yyyy")}</div>
                  </div>
                </div>

                {/* Timeline Line */}
                <div className="relative flex flex-col items-center">
                  <div className="timeline-dot mt-3 z-10" />
                  <div className="timeline-line flex-1 -mt-1" />
                </div>

                {/* Events Column */}
                <div className="flex-1 pb-8 space-y-4 min-w-0">
                  {dateEvents.map((event) => {
                    const pendingCount = getPendingCountForEvent(event.id);
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/events/${event.id}/manage`)}
                        className="event-card-timeline"
                      >
                        <div className="flex items-start gap-4">
                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            {/* Time & Status */}
                            <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {format(parseISO(event.date), "h:mm a")}
                              </span>
                              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(event.status)}`}>
                                {event.status}
                              </span>
                              {pendingCount > 0 && (
                                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                  {pendingCount} pending
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1">
                              {event.title}
                            </h3>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm mb-3">
                              {event.location ? (
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span className="truncate">{event.location}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Location missing</span>
                                </span>
                              )}
                            </div>

                            {/* Guest count */}
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{guestCounts[event.id] || 0} guests confirmed</span>
                            </div>
                          </div>

                          {/* Thumbnail */}
                          {event.image_url && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                              <img
                                src={event.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Arrow */}
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden sm:block mt-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Events;
