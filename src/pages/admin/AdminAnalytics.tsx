import { Seo } from "@/components/Seo";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { UserGrowthChart } from "@/components/admin/analytics/UserGrowthChart";
import { CategoryDistributionChart } from "@/components/admin/analytics/CategoryDistributionChart";
import { PopularEventsTable } from "@/components/admin/analytics/PopularEventsTable";
import { TopCategoriesList } from "@/components/admin/analytics/TopCategoriesList";
import { EventStatusBreakdown } from "@/components/admin/analytics/EventStatusBreakdown";
import { AttendanceInsights } from "@/components/admin/analytics/AttendanceInsights";
import { ActivityFeed } from "@/components/admin/analytics/ActivityFeed";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const AdminAnalytics = () => {
  const [refreshKey, setRefreshKey] = useState(0);


  return (
    <>
      <Seo title="Analytics" canonical="/admin/analytics" />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive platform performance metrics</p>
          </div>
          <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        </div>

        <StatsCards key={`s-${refreshKey}`} />

        <div className="grid gap-6 md:grid-cols-2">
          <UserGrowthChart key={`g-${refreshKey}`} />
          <CategoryDistributionChart key={`c-${refreshKey}`} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PopularEventsTable key={`p-${refreshKey}`} />
          <TopCategoriesList key={`t-${refreshKey}`} />
        </div>

        <EventStatusBreakdown key={`e-${refreshKey}`} />
        <AttendanceInsights key={`a-${refreshKey}`} />
        <ActivityFeed key={`f-${refreshKey}`} />
      </div>
    </>
  );
};

export default AdminAnalytics;
