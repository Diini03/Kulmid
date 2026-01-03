import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const UserDashboard = () => {
  const { isAdmin, loading } = useAuth();

  // Redirect admins to admin panel
  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return (
    <Layout>
      <Seo title="My Dashboard" canonical="/dashboard" />
      <section className="container max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Upcoming Bookings</div>
            <div className="text-3xl font-semibold">2</div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Saved Events</div>
            <div className="text-3xl font-semibold">5</div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Profile Completion</div>
            <div className="text-3xl font-semibold">80%</div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default UserDashboard;
