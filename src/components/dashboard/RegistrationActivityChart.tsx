import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export const RegistrationActivityChart = () => {
  const { user } = useAuth();

  const { data: registrationData = [], isLoading } = useQuery({
    queryKey: ["user-registration-activity", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      // Get registrations for the last 6 months
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const { data, error } = await supabase
        .from("event_guests")
        .select("created_at")
        .eq("email", user.email)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, number> = {};
      
      // Initialize all months with 0
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const monthKey = format(month, "MMM yyyy");
        monthlyData[monthKey] = 0;
      }
      
      // Count registrations per month
      data?.forEach((reg) => {
        const monthKey = format(new Date(reg.created_at), "MMM yyyy");
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      });
      
      return Object.entries(monthlyData).map(([month, count]) => ({
        month,
        registrations: count,
      }));
    },
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-lg">Registration Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = registrationData.some((d) => d.registrations > 0);

  return (
    <Card className="bg-card/50 backdrop-blur border">
      <CardHeader>
        <CardTitle className="text-lg">Registration Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={registrationData}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRegistrations)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p>No registration activity yet. Start exploring events!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
