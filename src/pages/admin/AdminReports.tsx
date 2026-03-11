import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Flag } from "lucide-react";

const AdminReports = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Seo title="Reports" canonical="/admin/reports" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Handle platform abuse and flagged content</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Flag className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">Reports & moderation coming in Phase 2</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
