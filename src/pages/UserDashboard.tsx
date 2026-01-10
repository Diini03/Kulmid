import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { RegistrationActivityChart } from "@/components/dashboard/RegistrationActivityChart";
import { CategoryInterestsChart } from "@/components/dashboard/CategoryInterestsChart";
import { UpcomingEventsList } from "@/components/dashboard/UpcomingEventsList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";

const UserDashboard = () => {
  const { isAdmin, loading, user, profile } = useAuth();

  // Redirect admins to admin panel
  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <Layout>
      <Seo title="My Dashboard" canonical="/dashboard" />
      <section className="container max-w-5xl px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your event activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <DashboardStatsCards />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <RegistrationActivityChart />
          <CategoryInterestsChart />
        </div>

        {/* Bottom Section: Upcoming Events, Quick Actions, Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UpcomingEventsList />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <RecentActivityFeed />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default UserDashboard;
