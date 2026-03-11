import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Sliders } from "lucide-react";

const AdminPlatformSettings = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Seo title="Platform Settings" canonical="/admin/settings/platform" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure platform-wide settings</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Sliders className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">Platform settings coming in Phase 2</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlatformSettings;
