import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Settings as SettingsIcon } from "lucide-react";

const AdminSettings = () => {
  const { profile } = useAuth();

  return (
    <AdminLayout>
      <Seo title="Admin Settings" canonical="/admin/settings" />
      <div>
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Profile Settings</h2>
            </div>
            <Separator className="mb-6" />
            
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  defaultValue={profile?.full_name || "Admin"}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value="Administrator"
                  disabled
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Profile editing features coming soon.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
            <Separator className="mb-6" />
            <p className="text-muted-foreground">
              Advanced settings and configurations will be available here.
            </p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
