import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Heart, TrendingUp, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalFavorites: number;
  avgEngagement: number;
  newThisWeek: number;
  weeklyGrowth: number;
}

export const StatsCards = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get total favorites
      const { count: favoritesCount } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true });

      // Get new users this week
      const { count: newUsersThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get new events this week
      const { count: newEventsThisWeek } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get new users last week for growth calculation
      const { count: newUsersLastWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const avgEngagement = eventsCount && eventsCount > 0 
        ? (favoritesCount || 0) / eventsCount 
        : 0;

      const weeklyGrowth = newUsersLastWeek && newUsersLastWeek > 0
        ? ((newUsersThisWeek || 0) - newUsersLastWeek) / newUsersLastWeek * 100
        : 0;

      setStats({
        totalUsers: usersCount || 0,
        totalEvents: eventsCount || 0,
        totalFavorites: favoritesCount || 0,
        avgEngagement: Number(avgEngagement.toFixed(1)),
        newThisWeek: (newUsersThisWeek || 0) + (newEventsThisWeek || 0),
        weeklyGrowth: Number(weeklyGrowth.toFixed(1)),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered platform users",
      trend: stats.weeklyGrowth > 0 ? `+${stats.weeklyGrowth}%` : `${stats.weeklyGrowth}%`,
      trendUp: stats.weeklyGrowth >= 0,
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      description: "All platform events",
      trend: null,
      trendUp: true,
    },
    {
      title: "Total Favorites",
      value: stats.totalFavorites,
      icon: Heart,
      description: "User engagement count",
      trend: null,
      trendUp: true,
    },
    {
      title: "Avg. Engagement",
      value: stats.avgEngagement,
      icon: TrendingUp,
      description: "Favorites per event",
      trend: null,
      trendUp: true,
    },
    {
      title: "New This Week",
      value: stats.newThisWeek,
      icon: UserPlus,
      description: "Users + Events",
      trend: null,
      trendUp: true,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {card.title}
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{card.description}</p>
              {card.trend && (
                <span
                  className={`text-xs font-medium ${
                    card.trendUp ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {card.trend}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
