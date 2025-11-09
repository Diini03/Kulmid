import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, Calendar, Heart, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  type: 'user_signup' | 'event_created' | 'event_approved' | 'favorite_added';
  description: string;
  timestamp: string;
  relativeTime: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent events
      const { data: recentEvents } = await supabase
        .from('events')
        .select('id, title, status, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and sort activities
      const allActivities: Activity[] = [];

      recentUsers?.forEach(user => {
        allActivities.push({
          id: `user-${user.id}`,
          type: 'user_signup',
          description: `${user.full_name || 'New user'} signed up`,
          timestamp: user.created_at,
          relativeTime: formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
        });
      });

      recentEvents?.forEach(event => {
        allActivities.push({
          id: `event-${event.id}`,
          type: event.status === 'approved' ? 'event_approved' : 'event_created',
          description: event.status === 'approved' 
            ? `Event "${event.title}" was approved`
            : `Event "${event.title}" was created`,
          timestamp: event.created_at,
          relativeTime: formatDistanceToNow(new Date(event.created_at), { addSuffix: true }),
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(allActivities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'event_created':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'event_approved':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'favorite_added':
        return <Heart className="h-4 w-4 text-red-500" />;
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
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform activities and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activities</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:shadow-sm transition-all"
                >
                  <div className="flex-shrink-0 mt-1 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.relativeTime}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
