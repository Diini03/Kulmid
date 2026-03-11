import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Flag, ShieldAlert, AlertTriangle, Eye, CheckCircle, XCircle, Ban } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  reviewing: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-transparent",
};

const TYPE_ICONS: Record<string, typeof Flag> = {
  event: AlertTriangle,
  user: Ban,
  spam: ShieldAlert,
};

const AdminReports = () => {
  const { isAdmin, loading, adminCheckComplete, user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchReports();
  }, [isAdmin, adminCheckComplete]);

  const fetchReports = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports(data || []);
    setDataLoading(false);
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const updates: any = { status };
    if (status === "resolved" || status === "dismissed") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user?.id;
    }
    const { error } = await supabase.from("reports").update(updates).eq("id", reportId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Report ${status}` });
      fetchReports();
      if (selectedReport?.id === reportId) setSelectedReport(null);
    }
  };

  if (dataLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const filtered = reports.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    reviewing: reports.filter(r => r.status === "reviewing").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };

  return (
    <>
      <Seo title="Reports" canonical="/admin/reports" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports & Moderation</h1>
          <p className="text-sm text-muted-foreground mt-1">Handle platform abuse and flagged content</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <Flag className="h-5 w-5 text-muted-foreground" />
            <div><div className="text-xl font-bold">{stats.total}</div><p className="text-[11px] text-muted-foreground">Total Reports</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div><div className="text-xl font-bold">{stats.open}</div><p className="text-[11px] text-muted-foreground">Open</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <div><div className="text-xl font-bold">{stats.reviewing}</div><p className="text-[11px] text-muted-foreground">Reviewing</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div><div className="text-xl font-bold">{stats.resolved}</div><p className="text-[11px] text-muted-foreground">Resolved</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {dataLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading reports...</p>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Flag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  {reports.length === 0 ? "No reports yet" : "No reports match your filters"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((report: any) => {
                    const TypeIcon = TYPE_ICONS[report.type] || Flag;
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{report.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[250px] truncate">{report.reason}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{report.target_id.substring(0, 12)}...</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] capitalize border ${STATUS_STYLES[report.status] || ""}`}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedReport(report)}>
                              <Eye className="h-3 w-3 mr-1" />Review
                            </Button>
                            {report.status === "open" && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateReportStatus(report.id, "reviewing")}>
                                Mark Reviewing
                              </Button>
                            )}
                          </div>
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

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Review and take action on this report</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize font-medium">{selectedReport.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-[11px] capitalize border ${STATUS_STYLES[selectedReport.status] || ""}`}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target ID</span>
                  <span className="font-mono text-xs">{selectedReport.target_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reported</span>
                  <span>{format(new Date(selectedReport.created_at), "PPP")}</span>
                </div>
                {selectedReport.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span>{format(new Date(selectedReport.resolved_at), "PPP")}</span>
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{selectedReport.reason}</p>
              </div>
              {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button className="flex-1" onClick={() => updateReportStatus(selectedReport.id, "resolved")}>
                    <CheckCircle className="h-4 w-4 mr-2" />Resolve
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => updateReportStatus(selectedReport.id, "dismissed")}>
                    <XCircle className="h-4 w-4 mr-2" />Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReports;
