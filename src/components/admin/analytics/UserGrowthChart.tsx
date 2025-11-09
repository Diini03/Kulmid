import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GrowthData {
  date: string;
  users: number;
  cumulative: number;
}

export const UserGrowthChart = () => {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', subDays(new Date(), 30).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedByDate: { [key: string]: number } = {};
      profiles?.forEach((profile) => {
        const date = format(new Date(profile.created_at), 'MMM dd');
        groupedByDate[date] = (groupedByDate[date] || 0) + 1;
      });

      // Create array for last 30 days
      const chartData: GrowthData[] = [];
      let cumulative = 0;
      
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        const users = groupedByDate[date] || 0;
        cumulative += users;
        chartData.push({
          date,
          users,
          cumulative,
        });
      }

      setData(chartData);
    } catch (error) {
      console.error('Error fetching growth data:', error);
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
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth Trend</CardTitle>
        <CardDescription>New user signups over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="New Users"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="cumulative" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Cumulative"
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
