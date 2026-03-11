import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Download, Trash2, ClipboardList, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

const AdminRegistrations = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checkinFilter, setCheckinFilter] = useState("all");
  const [deleteReg, setDeleteReg] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 });

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchRegistrations();
  }, [isAdmin, adminCheckComplete]);

  const fetchRegistrations = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("event_guests")
      .select("*, events:event_id(title, date)")
      .order("created_at", { ascending: false })
      .limit(500);

    const regs = data || [];
    setRegistrations(regs);
    setStats({
      total: regs.length,
      checkedIn: regs.filter((r: any) => r.checked_in).length,
      pending: regs.filter((r: any) => r.status === "invited" || r.status === "pending").length,
    });
    setDataLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteReg) return;
    const { error } = await supabase.from("event_guests").delete().eq("id", deleteReg.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registration removed" });
      setDeleteReg(null);
      fetchRegistrations();
    }
  };

  const exportCSV = () => {
    const csvData = filtered.map((r: any) => ({
      Event: (r.events as any)?.title || "",
      Name: r.name || "",
      Email: r.email,
      Status: r.status,
      "Checked In": r.checked_in ? "Yes" : "No",
      "Registered At": r.created_at,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (dataLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const filtered = registrations.filter((r: any) => {
    if (checkinFilter === "checked" && !r.checked_in) return false;
    if (checkinFilter === "not_checked" && r.checked_in) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || (r.events as any)?.title?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <>
      <Seo title="Registrations" canonical="/admin/registrations" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Registrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor platform attendance activity</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div><div className="text-xl font-bold">{stats.total}</div><p className="text-[11px] text-muted-foreground">Total Registrations</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div><div className="text-xl font-bold">{stats.checkedIn}</div><p className="text-[11px] text-muted-foreground">Checked In</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-500" />
            <div><div className="text-xl font-bold">{stats.pending}</div><p className="text-[11px] text-muted-foreground">Pending</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, or event..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={checkinFilter} onValueChange={setCheckinFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Check-in" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="checked">Checked In</SelectItem>
              <SelectItem value="not_checked">Not Checked In</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {dataLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No registrations found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium max-w-[180px] truncate">{(r.events as any)?.title || "—"}</TableCell>
                      <TableCell className="text-sm">{r.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.checked_in ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">Checked In</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteReg(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteReg} onOpenChange={(open) => !open && setDeleteReg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Registration</AlertDialogTitle>
            <AlertDialogDescription>Remove {deleteReg?.name || deleteReg?.email}'s registration?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRegistrations;
