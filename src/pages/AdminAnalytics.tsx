import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { StatsCards } from "@/components/admin/analytics/StatsCards";
import { UserGrowthChart } from "@/components/admin/analytics/UserGrowthChart";
import { CategoryDistributionChart } from "@/components/admin/analytics/CategoryDistributionChart";
import { PopularEventsTable } from "@/components/admin/analytics/PopularEventsTable";
import { TopCategoriesList } from "@/components/admin/analytics/TopCategoriesList";
import { ActivityFeed } from "@/components/admin/analytics/ActivityFeed";
import { EventStatusBreakdown } from "@/components/admin/analytics/EventStatusBreakdown";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const AdminAnalytics = () => {
  const { isAdmin, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-12">Loading...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Seo title="Analytics Dashboard" canonical="/admin/analytics" />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights and platform performance metrics
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics */}
        <StatsCards key={`stats-${refreshKey}`} />

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <UserGrowthChart key={`growth-${refreshKey}`} />
          <CategoryDistributionChart key={`category-${refreshKey}`} />
        </div>

        {/* Top Performers Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <PopularEventsTable key={`popular-${refreshKey}`} />
          <TopCategoriesList key={`top-categories-${refreshKey}`} />
        </div>

        {/* Event Status Breakdown */}
        <EventStatusBreakdown key={`status-${refreshKey}`} />

        {/* Recent Activity Feed */}
        <ActivityFeed key={`activity-${refreshKey}`} />
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
