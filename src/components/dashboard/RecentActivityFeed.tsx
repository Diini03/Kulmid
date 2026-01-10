import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, UserPlus, Heart, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "registration" | "check_in" | "favorite";
  title: string;
  timestamp: string;
}

export const RecentActivityFeed = () => {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["user-recent-activity", user?.email, user?.id],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const activityItems: ActivityItem[] = [];
      
      // Get recent registrations
      const { data: registrations } = await supabase
        .from("event_guests")
        .select("id, created_at, checked_in, checked_in_at, events!inner(title)")
        .eq("email", user.email)
        .order("created_at", { ascending: false })
        .limit(5);
      
      registrations?.forEach((reg) => {
        // Add check-in activity if checked in
        if (reg.checked_in && reg.checked_in_at) {
          activityItems.push({
            id: `checkin-${reg.id}`,
            type: "check_in",
            title: (reg.events as any)?.title || "Unknown Event",
            timestamp: reg.checked_in_at,
          });
        }
        
        // Add registration activity
        activityItems.push({
          id: `reg-${reg.id}`,
          type: "registration",
          title: (reg.events as any)?.title || "Unknown Event",
          timestamp: reg.created_at!,
        });
      });
      
      // Get recent favorites
      if (user?.id) {
        const { data: favorites } = await supabase
          .from("user_favorites")
          .select("id, created_at, event_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        
        // Fetch event titles for favorites
        if (favorites && favorites.length > 0) {
          const eventIds = favorites.map((f) => f.event_id);
          const { data: events } = await supabase
            .from("events")
            .select("id, title")
            .in("id", eventIds);
          
          const eventMap = new Map(events?.map((e) => [e.id, e.title]) || []);
          
          favorites.forEach((fav) => {
            activityItems.push({
              id: `fav-${fav.id}`,
              type: "favorite",
              title: eventMap.get(fav.event_id) || "Unknown Event",
              timestamp: fav.created_at,
            });
          });
        }
      }
      
      // Sort by timestamp and take top 5
      return activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    enabled: !!user?.email,
  });

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "registration":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "check_in":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "favorite":
        return <Heart className="h-4 w-4 text-red-500" />;
    }
  };

  const getActivityText = (type: ActivityItem["type"]) => {
    switch (type) {
      case "registration":
        return "Registered for";
      case "check_in":
        return "Checked in to";
      case "favorite":
        return "Saved";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      {getActivityText(activity.type)}
                    </span>{" "}
                    <span className="font-medium truncate">{activity.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No recent activity yet.</p>
            <p className="text-sm mt-1">Start by exploring and registering for events!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
