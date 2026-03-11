import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tag } from "lucide-react";

const AdminCategories = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Seo title="Categories" canonical="/admin/categories" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage event classification</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Tag className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">Category management coming in Phase 2</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
