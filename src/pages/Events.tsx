import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingActions } from "@/contexts/PendingActionsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, ChevronRight, MapPin, Users, AlertTriangle, Clock, Compass, CalendarPlus } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { Seo } from "@/components/Seo";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import { EventEmptyState } from "@/components/common/EventEmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";

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
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      if (filter === "upcoming") {
        return !isPast(eventDate) || event.status === "draft" || event.status === "pending";
      } else {
        return isPast(eventDate) && event.status !== "draft" && event.status !== "pending";
      }
    });
  }, [events, filter]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    filteredEvents.forEach(event => {
      const dateKey = format(parseISO(event.date), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedEvents).sort((a, b) => {
      if (filter === "upcoming") return new Date(a).getTime() - new Date(b).getTime();
      return new Date(b).getTime() - new Date(a).getTime();
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
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    };
    return styles[status] || styles.draft;
  };

  // Logged out state
  if (!authLoading && !user) {
    return (
      <>
        <Seo title="Events" description="Create and manage your events on Kulmid" canonical="/events" />
        <EventEmptyState onCreateClick={() => setShowAuthModal(true)} />
        <AuthRequiredModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          message="Sign in or create an account to start creating events."
          mode="signup"
        />
      </>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <>
        <Seo title="Events" description="Create and manage your events on Kulmid" canonical="/events" />
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-8" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <>
        <Seo title="Events" description="Create and manage your events on Kulmid" canonical="/events" />
        <EventEmptyState />
      </>
    );
  }

  return (
    <>
      <Seo title="Events" description="Manage your events on Kulmid" canonical="/events" />
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold">My Events</h1>
          <div className="flex items-center gap-4">
            <div className="flex rounded-full border p-1">
              <button onClick={() => setFilter("upcoming")} className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${filter === "upcoming" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                Upcoming
              </button>
              <button onClick={() => setFilter("past")} className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${filter === "past" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                Past
              </button>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <EventEmptyState
            title={filter === "upcoming" ? "No upcoming events" : "No past events"}
            description={filter === "upcoming" ? "Create your next event and start inviting guests." : "Your past events will appear here once completed."}
            showCreateButton={filter === "upcoming"}
          />
        )}

        <div className="space-y-0">
          {sortedDateKeys.map((dateKey, dateIndex) => {
            const dateEvents = groupedEvents[dateKey];
            const date = parseISO(dateKey);
            return (
              <div key={dateKey} className={`flex gap-6 sm:gap-10 animate-slide-up stagger-${Math.min(dateIndex + 1, 6)}`}>
                <div className="w-14 sm:w-16 flex-shrink-0 pt-2">
                  <div className="date-stack sticky top-24">
                    <div className="date-stack-month">{format(date, "MMM")}</div>
                    <div className="date-stack-day">{format(date, "d")}</div>
                    <div className="date-stack-year">{format(date, "yyyy")}</div>
                  </div>
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="timeline-dot mt-3 z-10" />
                  <div className="timeline-line flex-1 -mt-1" />
                </div>
                <div className="flex-1 pb-8 space-y-4 min-w-0">
                  {dateEvents.map(event => {
                    const pendingCount = getPendingCountForEvent(event.id);
                    return (
                      <div key={event.id} onClick={() => navigate(`/events/${event.id}/manage`)} className="event-card-timeline">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
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
                            <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1">{event.title}</h3>
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
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{guestCounts[event.id] || 0} guests confirmed</span>
                            </div>
                          </div>
                          {event.image_url && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                              <img src={event.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          )}
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
    </>
  );
};

export default Events;
