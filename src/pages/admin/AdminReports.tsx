import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Flag, ShieldAlert, AlertTriangle, Eye, CheckCircle, XCircle, Ban, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
  system: ShieldAlert,
  platform: Flag,
};

interface Report {
  id: string;
  type: string;
  target_id: string;
  reported_by: string | null;
  reason: string;
  description: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

const AdminReports = () => {
  const { isAdmin, adminCheckComplete, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Enrichment caches
  const [reporterNames, setReporterNames] = useState<Record<string, string>>({});
  const [eventTitles, setEventTitles] = useState<Record<string, string>>({});
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchReports();
  }, [isAdmin, adminCheckComplete]);

  const fetchReports = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    const list = (data || []) as Report[];
    setReports(list);

    // Compute report counts per target
    const counts: Record<string, number> = {};
    list.forEach((r) => {
      counts[r.target_id] = (counts[r.target_id] || 0) + 1;
    });
    setReportCounts(counts);

    // Fetch reporter names
    const reporterIds = [...new Set(list.map((r) => r.reported_by).filter(Boolean))] as string[];
    if (reporterIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", reporterIds);
      const names: Record<string, string> = {};
      profiles?.forEach((p) => { names[p.user_id] = p.full_name; });
      setReporterNames(names);
    }

    // Fetch event titles for event-type reports
    const eventIds = [...new Set(list.filter((r) => r.type === "event").map((r) => r.target_id))];
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("id, title")
        .in("id", eventIds);
      const titles: Record<string, string> = {};
      events?.forEach((e) => { titles[e.id] = e.title; });
      setEventTitles(titles);
    }

    setDataLoading(false);
  };

  const updateReportStatus = useCallback(async (reportId: string, status: string, notes?: string) => {
    setProcessingAction(`${reportId}-${status}`);
    const updates: Record<string, any> = { status };
    if (notes !== undefined) updates.admin_notes = notes;
    if (status === "resolved" || status === "dismissed") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user?.id;
    }
    const { error } = await supabase.from("reports").update(updates).eq("id", reportId);
    setProcessingAction(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Report ${status}` });
      fetchReports();
      if (selectedReport?.id === reportId) setSelectedReport(null);
    }
  }, [user, selectedReport]);

  const rejectEvent = useCallback(async (eventId: string, reportId: string) => {
    setProcessingAction(`${reportId}-reject`);
    const { error } = await supabase
      .from("events")
      .update({ status: "rejected", rejection_reason: "Rejected due to community reports" })
      .eq("id", eventId);
    setProcessingAction(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event rejected" });
      updateReportStatus(reportId, "resolved", adminNotes || "Event rejected via report action");
    }
  }, [adminNotes]);

  const openDetail = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
  };

  if (dataLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const filtered = reports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  const isProcessing = (key: string) => processingAction === key;

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
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
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
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((report) => {
                    const TypeIcon = TYPE_ICONS[report.type] || Flag;
                    const targetName = report.type === "event" ? eventTitles[report.target_id] : null;
                    const count = reportCounts[report.target_id] || 1;
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{report.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm max-w-[160px] truncate">
                              {targetName || report.target_id.substring(0, 12) + "..."}
                            </span>
                            {count > 1 && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                {count}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{report.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {report.reported_by ? reporterNames[report.reported_by] || "Unknown" : "System"}
                        </TableCell>
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
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openDetail(report)}>
                              <Eye className="h-3 w-3 mr-1" />Review
                            </Button>
                            {report.status === "open" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={isProcessing(`${report.id}-reviewing`)}
                                onClick={() => updateReportStatus(report.id, "reviewing")}
                              >
                                {isProcessing(`${report.id}-reviewing`) && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
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
        <DialogContent className="sm:max-w-lg">
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
                {selectedReport.type === "event" && eventTitles[selectedReport.target_id] && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Event</span>
                    <a
                      href={`/events/${selectedReport.target_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      {eventTitles[selectedReport.target_id]}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {!eventTitles[selectedReport.target_id] && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target ID</span>
                    <span className="font-mono text-xs">{selectedReport.target_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reporter</span>
                  <span>{selectedReport.reported_by ? reporterNames[selectedReport.reported_by] || "Unknown" : "System"}</span>
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
                <p className="text-sm font-medium">{selectedReport.reason}</p>
              </div>

              {selectedReport.description && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              )}

              {/* Admin Notes */}
              {(selectedReport.status !== "resolved" && selectedReport.status !== "dismissed") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    placeholder="Internal notes about this report..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {selectedReport.admin_notes && (selectedReport.status === "resolved" || selectedReport.status === "dismissed") && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.admin_notes}</p>
                </div>
              )}

              {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Quick actions for event reports */}
                  {selectedReport.type === "event" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a href={`/events/${selectedReport.target_id}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />View Event
                        </a>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        disabled={isProcessing(`${selectedReport.id}-reject`)}
                        onClick={() => rejectEvent(selectedReport.target_id, selectedReport.id)}
                      >
                        {isProcessing(`${selectedReport.id}-reject`) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4 mr-2" />
                        )}
                        Reject Event
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={isProcessing(`${selectedReport.id}-resolved`)}
                      onClick={() => updateReportStatus(selectedReport.id, "resolved", adminNotes)}
                    >
                      {isProcessing(`${selectedReport.id}-resolved`) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessing(`${selectedReport.id}-dismissed`)}
                      onClick={() => updateReportStatus(selectedReport.id, "dismissed", adminNotes)}
                    >
                      {isProcessing(`${selectedReport.id}-dismissed`) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminReports;
