import { Calendar, PlusSquare, Heart, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading?: boolean;
}

const StatCard = ({ icon, label, value, loading }: StatCardProps) => (
  <Card className="bg-card/50 backdrop-blur border">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
          ) : (
            <p className="text-3xl font-semibold">{value}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DashboardStatsCards = () => {
  const { user } = useAuth();
  const { favoriteCount } = useFavorites();

  // Fetch upcoming events the user is registered for
  const { data: upcomingCount = 0, isLoading: upcomingLoading } = useQuery({
    queryKey: ["user-upcoming-events", user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const { count, error } = await supabase
        .from("event_guests")
        .select("id, events!inner(id, date)", { count: "exact", head: true })
        .eq("email", user.email)
        .in("status", ["confirmed", "registered", "approved"])
        .gte("events.date", new Date().toISOString());
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.email,
  });

  // Fetch events created by user
  const { data: createdCount = 0, isLoading: createdLoading } = useQuery({
    queryKey: ["user-created-events", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch events attended (checked in)
  const { data: attendedCount = 0, isLoading: attendedLoading } = useQuery({
    queryKey: ["user-attended-events", user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const { count, error } = await supabase
        .from("event_guests")
        .select("id", { count: "exact", head: true })
        .eq("email", user.email)
        .eq("checked_in", true);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.email,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Calendar className="h-6 w-6 text-primary" />}
        label="Upcoming Events"
        value={upcomingCount}
        loading={upcomingLoading}
      />
      <StatCard
        icon={<PlusSquare className="h-6 w-6 text-primary" />}
        label="Events Created"
        value={createdCount}
        loading={createdLoading}
      />
      <StatCard
        icon={<Heart className="h-6 w-6 text-primary" />}
        label="Saved Events"
        value={favoriteCount}
      />
      <StatCard
        icon={<CheckCircle className="h-6 w-6 text-primary" />}
        label="Events Attended"
        value={attendedCount}
        loading={attendedLoading}
      />
    </div>
  );
};
