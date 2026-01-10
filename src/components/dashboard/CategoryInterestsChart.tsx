import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const CategoryInterestsChart = () => {
  const { user } = useAuth();

  const { data: categoryData = [], isLoading } = useQuery({
    queryKey: ["user-category-interests", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data, error } = await supabase
        .from("event_guests")
        .select("event_id, events!inner(category)")
        .eq("email", user.email);
      
      if (error) throw error;
      
      // Count categories
      const categoryCounts: Record<string, number> = {};
      data?.forEach((item) => {
        const category = (item.events as any)?.category || "Other";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      return Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-lg">Your Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = categoryData.length > 0;

  return (
    <Card className="bg-card/50 backdrop-blur border">
      <CardHeader>
        <CardTitle className="text-lg">Your Interests</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p>Register for events to see your interests!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
