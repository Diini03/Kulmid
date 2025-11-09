import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, CalendarX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatusStats {
  pending: number;
  approved: number;
  past: number;
  total: number;
}

export const EventStatusBreakdown = () => {
  const [stats, setStats] = useState<StatusStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusStats();
  }, []);

  const fetchStatusStats = async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('status');

      if (error) throw error;

      const pending = events?.filter(e => e.status === 'pending').length || 0;
      const approved = events?.filter(e => ['approved', 'upcoming', 'ongoing'].includes(e.status)).length || 0;
      const past = events?.filter(e => e.status === 'past').length || 0;
      const total = events?.length || 0;

      setStats({ pending, approved, past, total });
    } catch (error) {
      console.error('Error fetching status stats:', error);
    } finally {
      setLoading(false);
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
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statusItems = [
    {
      label: "Pending",
      count: stats.pending,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      progressColor: "bg-orange-500",
    },
    {
      label: "Approved",
      count: stats.approved,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      progressColor: "bg-green-500",
    },
    {
      label: "Past",
      count: stats.past,
      icon: CalendarX,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      progressColor: "bg-gray-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Status Breakdown</CardTitle>
        <CardDescription>Distribution of events by current status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {statusItems.map((item) => {
            const Icon = item.icon;
            const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
            
            return (
              <div key={item.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${item.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-2xl font-bold">{item.count}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% of total</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
