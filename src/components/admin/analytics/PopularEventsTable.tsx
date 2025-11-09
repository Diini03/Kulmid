import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Trophy, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PopularEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  favoriteCount: number;
  rank: number;
}

export const PopularEventsTable = () => {
  const [events, setEvents] = useState<PopularEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularEvents();
  }, []);

  const fetchPopularEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          category,
          date,
          user_favorites(count)
        `)
        .in('status', ['approved', 'upcoming', 'ongoing'])
        .order('user_favorites(count)', { ascending: false })
        .limit(5);

      if (error) throw error;

      const popularEvents: PopularEvent[] = data?.map((event: any, index) => ({
        id: event.id,
        title: event.title,
        category: event.category,
        date: event.date,
        favoriteCount: event.user_favorites?.[0]?.count || 0,
        rank: index + 1,
      })) || [];

      setEvents(popularEvents);
    } catch (error) {
      console.error('Error fetching popular events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Popular Events</CardTitle>
        <CardDescription>Top 5 events by favorite count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No events found</p>
          ) : (
            events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(event.rank)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{event.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{event.favoriteCount}</div>
                  <div className="text-xs text-muted-foreground">favorites</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
