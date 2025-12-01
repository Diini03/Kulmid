import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Target, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

export const AttendanceInsights = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['attendance-insights'],
    queryFn: async () => {
      // Fetch all attendance stats
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_stats')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(100);

      if (attendanceError) throw attendanceError;

      // Fetch events with registration counts
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          category,
          event_type,
          price,
          status
        `);

      if (eventsError) throw eventsError;

      // Calculate platform-wide metrics
      const totalPredictions = attendanceData?.length || 0;
      const avgPredictedRate = attendanceData && attendanceData.length > 0
        ? attendanceData.reduce((sum, stat) => sum + (stat.predicted_rate || 0), 0) / totalPredictions
        : 0;

      // Calculate completed events (with actual check-ins)
      const completedEvents = attendanceData?.filter(stat => stat.total_checked_in > 0) || [];
      const avgActualRate = completedEvents.length > 0
        ? completedEvents.reduce((sum, stat) => sum + (stat.actual_rate || 0), 0) / completedEvents.length
        : 0;

      // Calculate prediction accuracy
      const accuratePredictions = completedEvents.filter(stat => {
        if (!stat.predicted_rate || !stat.actual_rate) return false;
        const diff = Math.abs(stat.predicted_rate - stat.actual_rate);
        return diff < 10; // Within 10% is considered accurate
      });

      const accuracy = completedEvents.length > 0
        ? (accuratePredictions.length / completedEvents.length) * 100
        : 0;

      // Category breakdown
      const categoryStats = new Map<string, { total: number; avgRate: number }>();
      
      attendanceData?.forEach(stat => {
        const event = eventsData?.find(e => e.id === stat.event_id);
        if (!event) return;

        const category = event.category;
        if (!categoryStats.has(category)) {
          categoryStats.set(category, { total: 0, avgRate: 0 });
        }

        const current = categoryStats.get(category)!;
        current.total += 1;
        current.avgRate += stat.predicted_rate || 0;
      });

      const categoryData = Array.from(categoryStats.entries()).map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        rate: Math.round(data.avgRate / data.total),
        events: data.total,
      })).sort((a, b) => b.rate - a.rate);

      return {
        totalPredictions,
        avgPredictedRate: Math.round(avgPredictedRate),
        avgActualRate: Math.round(avgActualRate),
        completedEvents: completedEvents.length,
        accuracy: Math.round(accuracy),
        categoryData,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Insights</CardTitle>
          <CardDescription>Platform-wide attendance analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Insights</CardTitle>
          <CardDescription>Platform-wide attendance analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No attendance data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Attendance Insights
        </CardTitle>
        <CardDescription>Platform-wide attendance predictions and analytics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              Total Predictions
            </div>
            <div className="text-2xl font-bold">{stats.totalPredictions}</div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Avg Attendance Rate
            </div>
            <div className="text-2xl font-bold">{stats.avgPredictedRate}%</div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Completed Events
            </div>
            <div className="text-2xl font-bold">{stats.completedEvents}</div>
            {stats.completedEvents > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {stats.avgActualRate}% actual rate
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Prediction Accuracy
            </div>
            <div className="text-2xl font-bold">
              {stats.completedEvents > 0 ? `${stats.accuracy}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completedEvents > 0 ? 'Within 10% margin' : 'No completed events yet'}
            </div>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        {stats.categoryData.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Attendance Rate by Category</h3>
              <p className="text-xs text-muted-foreground">Average predicted attendance rate for each event category</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'rate') return [`${value}%`, 'Attendance Rate'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Insights */}
        <div className="pt-4 border-t space-y-2">
          <h3 className="text-sm font-medium">Key Insights</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {stats.avgPredictedRate < 60 && (
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Platform average attendance is below 60% - consider engagement strategies</span>
              </li>
            )}
            {stats.avgPredictedRate >= 75 && (
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Strong attendance rates indicate high-quality events and engaged audience</span>
              </li>
            )}
            {stats.completedEvents === 0 && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>Start tracking check-ins to improve prediction accuracy with real data</span>
              </li>
            )}
            {stats.accuracy > 80 && stats.completedEvents > 5 && (
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Prediction model is highly accurate - use it for planning with confidence</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};