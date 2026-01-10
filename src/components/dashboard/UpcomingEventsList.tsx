import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  event_type: string | null;
}

export const UpcomingEventsList = () => {
  const { user } = useAuth();

  const { data: upcomingEvents = [], isLoading } = useQuery({
    queryKey: ["user-upcoming-events-list", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data, error } = await supabase
        .from("event_guests")
        .select(`
          event_id,
          events!inner(
            id,
            title,
            date,
            location,
            category,
            event_type
          )
        `)
        .eq("email", user.email)
        .in("status", ["confirmed", "registered", "approved"])
        .gte("events.date", new Date().toISOString())
        .order("events(date)", { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      return data?.map((item) => item.events as unknown as UpcomingEvent) || [];
    },
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
        <Link to="/events">
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex items-start gap-4 p-3 rounded-lg border bg-background/50 transition-colors"
              >
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-primary/10 text-primary">
                  <span className="text-xs font-medium">
                    {format(new Date(event.date), "MMM")}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {format(new Date(event.date), "d")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{event.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.date), "h:mm a")}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {event.event_type === "online" ? "Online" : event.location}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {event.category}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No upcoming events.</p>
            <Link to="/discover">
              <Button variant="outline" size="sm" className="mt-3">
                Discover Events
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
