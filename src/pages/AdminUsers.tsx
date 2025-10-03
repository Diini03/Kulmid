import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users as UsersIcon, UserCheck, Clock } from "lucide-react";

const AdminUsers = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    recentSignups: 0
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get admin count
      const { count: admins } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Get recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentSignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        admins: admins || 0,
        recentSignups: recentSignups || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  return (
    <AdminLayout>
      <Seo title="User Management" canonical="/admin/users" />
      <div>
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-primary/20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Administrators</p>
                <p className="text-3xl font-bold">{stats.admins}</p>
              </div>
              <UserCheck className="h-12 w-12 text-primary/20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recent Signups</p>
                <p className="text-3xl font-bold">{stats.recentSignups}</p>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <Clock className="h-12 w-12 text-primary/20" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-muted-foreground">
            User management features coming soon. You'll be able to view all users, 
            manage roles, and moderate accounts from this panel.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
