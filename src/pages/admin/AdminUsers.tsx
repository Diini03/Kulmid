import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MoreHorizontal, Search, Shield, User, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const AdminUsersPage = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchUsers();
  }, [isAdmin, adminCheckComplete]);

  const fetchUsers = async () => {
    setDataLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    setUsers(profilesRes.data || []);
    const roleMap: Record<string, string> = {};
    (rolesRes.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    setRoles(roleMap);
    setDataLoading(false);
  };

  const viewUser = async (user: any) => {
    setSelectedUser(user);
    const { data } = await supabase.from("events").select("id, title, date, status").eq("created_by", user.user_id).order("date", { ascending: false }).limit(10);
    setUserEvents(data || []);
  };

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as any });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User promoted to admin" });
      fetchUsers();
    }
  };

  const removeAdmin = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin role removed" });
      fetchUsers();
    }
  };

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = users.filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s);
  });

  return (
    <AdminLayout>
      <Seo title="User Management" canonical="/admin/users" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform users and roles</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {dataLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading users...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user: any) => {
                    const role = roles[user.user_id] || "user";
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.full_name}</div>
                              {user.username && <div className="text-xs text-muted-foreground">@{user.username}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role === "admin" ? "default" : "outline"} className="text-xs capitalize">
                            {role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                            {role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.location || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewUser(user)}>
                                <Eye className="h-4 w-4 mr-2" />View Profile
                              </DropdownMenuItem>
                              {role !== "admin" && (
                                <DropdownMenuItem onClick={() => promoteToAdmin(user.user_id)}>
                                  <Shield className="h-4 w-4 mr-2" />Promote to Admin
                                </DropdownMenuItem>
                              )}
                              {role === "admin" && (
                                <DropdownMenuItem onClick={() => removeAdmin(user.user_id)}>
                                  <User className="h-4 w-4 mr-2" />Remove Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User Profile</SheetTitle>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{selectedUser.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name}</h3>
                  {selectedUser.username && <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>}
                  <Badge variant={roles[selectedUser.user_id] === "admin" ? "default" : "outline"} className="mt-1 text-xs capitalize">
                    {roles[selectedUser.user_id] || "user"}
                  </Badge>
                </div>
              </div>
              {selectedUser.bio && <p className="text-sm text-muted-foreground">{selectedUser.bio}</p>}
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Location:</span> {selectedUser.location || "Not set"}</div>
                <div><span className="text-muted-foreground">Joined:</span> {format(new Date(selectedUser.created_at), "PPP")}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Hosted Events ({userEvents.length})</h4>
                {userEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events hosted</p>
                ) : (
                  <div className="space-y-2">
                    {userEvents.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                        <span className="truncate flex-1">{e.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${
                          e.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        }`}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminUsersPage;
