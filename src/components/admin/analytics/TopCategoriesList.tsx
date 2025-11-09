import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CategoryStats {
  category: string;
  eventCount: number;
  percentage: number;
}

export const TopCategoriesList = () => {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopCategories();
  }, []);

  const fetchTopCategories = async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('category')
        .in('status', ['approved', 'upcoming', 'ongoing']);

      if (error) throw error;

      // Group by category
      const categoryCount: { [key: string]: number } = {};
      events?.forEach((event) => {
        categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      });

      const total = events?.length || 0;
      const categoryStats: CategoryStats[] = Object.entries(categoryCount).map(([category, eventCount]) => ({
        category,
        eventCount,
        percentage: total > 0 ? Number(((eventCount / total) * 100).toFixed(1)) : 0,
      }));

      // Sort by event count
      categoryStats.sort((a, b) => b.eventCount - a.eventCount);

      setCategories(categoryStats);
    } catch (error) {
      console.error('Error fetching top categories:', error);
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
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>Event distribution by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No categories found</p>
          ) : (
            categories.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Badge variant="outline" className="font-medium">
                      {category.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{category.eventCount}</div>
                    <div className="text-xs text-muted-foreground">{category.percentage}%</div>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
