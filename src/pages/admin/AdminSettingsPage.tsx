import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shield, UserPlus, Trash2, Clock, CheckCircle, XCircle, Settings, AlertTriangle, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  admin_email: string;
  timestamp: string;
}

const AdminSettingsPage = () => {
  const { isAdmin, loading, adminCheckComplete, user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removeAdmin, setRemoveAdmin] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) {
      fetchAdmins();
      fetchAuditLog();
    }
  }, [isAdmin, adminCheckComplete]);

  const fetchAdmins = async () => {
    setDataLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin" as any);

    if (roles && roles.length > 0) {
      const userIds = roles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const adminList = roles.map((role: any) => {
        const profile = (profiles || []).find((p: any) => p.user_id === role.user_id);
        return {
          ...role,
          full_name: profile?.full_name || "Unknown",
          avatar_url: profile?.avatar_url || null,
          username: profile?.username || null,
        };
      });
      setAdmins(adminList);
    } else {
      setAdmins([]);
    }
    setDataLoading(false);
  };

  const fetchAuditLog = async () => {
    // Build audit log from platform_settings changes and recent admin actions
    const { data: settingsLog } = await supabase
      .from("platform_settings")
      .select("key, updated_at, updated_by")
      .order("updated_at", { ascending: false })
      .limit(20);

    const entries: AuditEntry[] = (settingsLog || []).map((s: any, i: number) => ({
      id: `settings-${i}`,
      action: "Settings changed",
      details: `Updated "${s.key}"`,
      admin_email: s.updated_by ? "Admin" : "System",
      timestamp: s.updated_at,
    }));

    setAuditLog(entries);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({ title: "Enter an email", variant: "destructive" });
      return;
    }

    setAddingAdmin(true);

    // Note: only kulmid@gmail.com can be admin due to DB trigger
    // This UI shows the attempt but the DB will enforce the restriction
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .limit(1000);

    // We can't query auth.users directly, so we check user_roles
    // The validate_admin_email trigger will enforce the restriction
    toast({
      title: "Admin restriction",
      description: "Only kulmid@gmail.com can have admin role (enforced at database level).",
      variant: "destructive",
    });

    setAddingAdmin(false);
    setNewAdminEmail("");
  };

  const handleRemoveAdmin = async () => {
    if (!removeAdmin) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", removeAdmin.user_id)
      .eq("role", "admin" as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin role removed" });
      fetchAdmins();
    }
    setRemoveAdmin(null);
  };

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Seo title="Admin Settings" canonical="/admin/settings/admin" />
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage admin roles, permissions, and audit logs</p>
        </div>

        {/* Current Admins */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Admin Users</CardTitle>
            </div>
            <CardDescription>Users with administrative access to the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No admins found</p>
            ) : (
              <div className="space-y-3">
                {admins.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={admin.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{admin.full_name?.charAt(0) || "A"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{admin.full_name}</p>
                        <p className="text-xs text-muted-foreground">{admin.email || "kulmid@gmail.com"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />Admin
                      </Badge>
                      {admin.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setRemoveAdmin(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t">
              <Label className="text-sm font-medium">Add Admin</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="kulmid@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddAdmin} disabled={addingAdmin} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />Add
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>Only kulmid@gmail.com can be assigned admin role (database enforced)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Permissions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Admin Permissions</CardTitle>
            </div>
            <CardDescription>What admins can do on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Approve/Reject events", icon: CheckCircle, active: true },
                { label: "Manage users & roles", icon: User, active: true },
                { label: "View all registrations", icon: Clock, active: true },
                { label: "Delete any event", icon: XCircle, active: true },
                { label: "Manage platform settings", icon: Settings, active: true },
                { label: "Handle reports", icon: AlertTriangle, active: true },
              ].map((perm) => (
                <div key={perm.label} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <perm.icon className={`h-4 w-4 ${perm.active ? "text-emerald-500" : "text-muted-foreground"}`} />
                  <span className="text-sm">{perm.label}</span>
                  <Badge variant={perm.active ? "default" : "secondary"} className="ml-auto text-[10px]">
                    {perm.active ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Audit Log</CardTitle>
            </div>
            <CardDescription>Recent administrative actions on the platform</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {auditLog.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No audit entries yet</p>
                <p className="text-xs text-muted-foreground mt-1">Actions will appear here as admins use the platform</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm font-medium">{entry.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.details}</TableCell>
                      <TableCell className="text-sm">{entry.admin_email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.timestamp ? format(new Date(entry.timestamp), "MMM d, h:mm a") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove Admin Confirmation */}
      <AlertDialog open={!!removeAdmin} onOpenChange={(open) => !open && setRemoveAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Remove admin privileges from {removeAdmin?.full_name}? They will become a regular user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
