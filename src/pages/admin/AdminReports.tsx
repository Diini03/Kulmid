import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Flag, ShieldAlert, AlertTriangle, Eye, CheckCircle, XCircle, Ban,
  ExternalLink, Loader2, Search, Download, FileText, MoreHorizontal,
  ShieldCheck, Clock, AlertOctagon, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

// ── Styles ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  reviewing: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-transparent",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-muted text-muted-foreground border-transparent",
};

const TYPE_ICONS: Record<string, typeof Flag> = {
  event: AlertTriangle,
  user: Ban,
  spam: ShieldAlert,
  system: ShieldAlert,
  platform: Flag,
};

// ── Types ───────────────────────────────────────────────────
interface Report {
  id: string;
  type: string;
  target_id: string;
  reported_by: string | null;
  reason: string;
  description: string | null;
  admin_notes: string | null;
  priority: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// ── Component ───────────────────────────────────────────────
const AdminReports = () => {
  const { isAdmin, adminCheckComplete, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail panel
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Enrichment caches
  const [reporterNames, setReporterNames] = useState<Record<string, string>>({});
  const [eventTitles, setEventTitles] = useState<Record<string, string>>({});
  const [eventDetails, setEventDetails] = useState<Record<string, { status: string; host_name: string | null; registrations: number }>>({});
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

    // Fetch event info for event-type reports
    const eventIds = [...new Set(list.filter((r) => r.type === "event").map((r) => r.target_id))];
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("id, title, status, host_name")
        .in("id", eventIds);
      const titles: Record<string, string> = {};
      const details: Record<string, { status: string; host_name: string | null; registrations: number }> = {};
      events?.forEach((e) => {
        titles[e.id] = e.title;
        details[e.id] = { status: e.status, host_name: e.host_name, registrations: 0 };
      });

      // Fetch registration counts
      if (eventIds.length > 0) {
        const { data: regData } = await supabase
          .from("event_guests")
          .select("event_id")
          .in("event_id", eventIds);
        if (regData) {
          regData.forEach((r) => {
            if (details[r.event_id]) details[r.event_id].registrations++;
          });
        }
      }

      setEventTitles(titles);
      setEventDetails(details);
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
  }, [adminNotes, updateReportStatus]);

  const openDetail = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
  };

  // ── Filtering ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (q) {
        const targetName = r.type === "event" ? (eventTitles[r.target_id] || "") : "";
        const reporterName = r.reported_by ? (reporterNames[r.reported_by] || "") : "";
        const searchable = `${r.id} ${r.reason} ${r.description || ""} ${targetName} ${reporterName}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [reports, statusFilter, typeFilter, priorityFilter, searchQuery, eventTitles, reporterNames]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    highPriority: reports.filter((r) => r.priority === "high" || r.priority === "critical").length,
  }), [reports]);

  const handleStatClick = (status: string) => {
    if (status === "highPriority") {
      setStatusFilter("all");
      setPriorityFilter("high");
    } else if (status === "total") {
      setStatusFilter("all");
      setPriorityFilter("all");
    } else {
      setStatusFilter(status);
      setPriorityFilter("all");
    }
  };

  // ── Related reports for detail panel ──────────────────────
  const relatedReports = useMemo(() => {
    if (!selectedReport) return [];
    return reports.filter(
      (r) => r.target_id === selectedReport.target_id && r.id !== selectedReport.id
    );
  }, [selectedReport, reports]);

  // ── Export CSV ─────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID", "Type", "Target", "Reason", "Priority", "Status", "Reporter", "Date", "Description", "Admin Notes"];
    const rows = filtered.map((r) => [
      r.id,
      r.type,
      r.type === "event" ? (eventTitles[r.target_id] || r.target_id) : r.target_id,
      r.reason,
      r.priority,
      r.status,
      r.reported_by ? (reporterNames[r.reported_by] || "Unknown") : "System",
      format(new Date(r.created_at), "yyyy-MM-dd"),
      (r.description || "").replace(/"/g, '""'),
      (r.admin_notes || "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  // ── Export PDF ─────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Kulmid — Moderation Reports", 14, 20);
    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), "PPP")}  |  ${filtered.length} reports`, 14, 28);

    let y = 38;
    doc.setFontSize(8);
    // Header row
    doc.setFont("helvetica", "bold");
    doc.text("Type", 14, y);
    doc.text("Target", 34, y);
    doc.text("Reason", 84, y);
    doc.text("Priority", 134, y);
    doc.text("Status", 156, y);
    doc.text("Date", 178, y);
    doc.setFont("helvetica", "normal");
    y += 6;

    filtered.forEach((r) => {
      if (y > 280) { doc.addPage(); y = 20; }
      const target = r.type === "event" ? (eventTitles[r.target_id] || r.target_id).substring(0, 25) : r.target_id.substring(0, 25);
      doc.text(r.type, 14, y);
      doc.text(target, 34, y);
      doc.text(r.reason.substring(0, 25), 84, y);
      doc.text(r.priority, 134, y);
      doc.text(r.status, 156, y);
      doc.text(format(new Date(r.created_at), "MM/dd/yy"), 178, y);
      y += 5;
    });

    doc.save(`reports-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "PDF exported" });
  };

  const isProcessing = (key: string) => processingAction === key;

  if (dataLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <>
      <Seo title="Reports & Moderation" canonical="/admin/reports" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports & Moderation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detect issues, investigate reports, and take moderation actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-1.5" />CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
              <FileText className="h-4 w-4 mr-1.5" />PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[
            { key: "total", label: "Total Reports", value: stats.total, icon: Flag, color: "text-muted-foreground" },
            { key: "open", label: "Open", value: stats.open, icon: AlertTriangle, color: "text-amber-500" },
            { key: "reviewing", label: "Under Review", value: stats.reviewing, icon: Eye, color: "text-primary" },
            { key: "resolved", label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-emerald-500" },
            { key: "highPriority", label: "High Priority", value: stats.highPriority, icon: AlertOctagon, color: "text-red-500" },
          ].map(({ key, label, value, icon: Icon, color }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                (key === "highPriority" && priorityFilter === "high") ||
                (key !== "highPriority" && key !== "total" && statusFilter === key) ||
                (key === "total" && statusFilter === "all" && priorityFilter === "all")
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => handleStatClick(key)}
            >
              <CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <div className="text-xl font-bold">{value}</div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-muted-foreground font-medium">
                  {reports.length === 0
                    ? "No reports have been submitted yet"
                    : "No reports match your filters"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reports.length === 0
                    ? "Reported events and users will appear here for review."
                    : "Try adjusting your filters or search query."
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((report) => {
                    const TypeIcon = TYPE_ICONS[report.type] || Flag;
                    const targetName = report.type === "event" ? eventTitles[report.target_id] : null;
                    const count = reportCounts[report.target_id] || 1;
                    return (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => openDetail(report)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {report.id.substring(0, 8)}
                        </TableCell>
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
                        <TableCell className="text-sm max-w-[180px] truncate">{report.reason}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] capitalize border ${PRIORITY_STYLES[report.priority] || PRIORITY_STYLES.medium}`}>
                            {report.priority}
                          </Badge>
                        </TableCell>
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
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetail(report)}>
                                <Eye className="h-4 w-4 mr-2" />View Report
                              </DropdownMenuItem>
                              {report.type === "event" && (
                                <DropdownMenuItem asChild>
                                  <a href={`/events/${report.target_id}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />View Event
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {report.status === "open" && (
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, "reviewing")}>
                                  <Clock className="h-4 w-4 mr-2" />Mark Reviewing
                                </DropdownMenuItem>
                              )}
                              {report.status !== "resolved" && (
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, "resolved")}>
                                  <CheckCircle className="h-4 w-4 mr-2" />Resolve
                                </DropdownMenuItem>
                              )}
                              {report.status !== "dismissed" && (
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, "dismissed")}>
                                  <XCircle className="h-4 w-4 mr-2" />Dismiss
                                </DropdownMenuItem>
                              )}
                              {report.type === "event" && report.status !== "resolved" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => rejectEvent(report.target_id, report.id)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />Reject Event
                                  </DropdownMenuItem>
                                </>
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

      {/* ── Detail Side Sheet ─────────────────────────────── */}
      <Sheet open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Report Details</SheetTitle>
            <SheetDescription>Review and take action on this report</SheetDescription>
          </SheetHeader>
          {selectedReport && (
            <div className="space-y-5 mt-4">
              {/* Info grid */}
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report ID</span>
                  <span className="font-mono text-xs">{selectedReport.id.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize font-medium">{selectedReport.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge variant="outline" className={`text-[11px] capitalize border ${PRIORITY_STYLES[selectedReport.priority] || PRIORITY_STYLES.medium}`}>
                    {selectedReport.priority}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-[11px] capitalize border ${STATUS_STYLES[selectedReport.status] || ""}`}>
                    {selectedReport.status}
                  </Badge>
                </div>
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

              <Separator />

              {/* Reason & Description */}
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

              {/* Event Details */}
              {selectedReport.type === "event" && eventDetails[selectedReport.target_id] && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Event Information</p>
                    <div className="rounded-lg border p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title</span>
                        <a
                          href={`/events/${selectedReport.target_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {eventTitles[selectedReport.target_id]}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event Status</span>
                        <span className="capitalize">{eventDetails[selectedReport.target_id].status}</span>
                      </div>
                      {eventDetails[selectedReport.target_id].host_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Organizer</span>
                          <span>{eventDetails[selectedReport.target_id].host_name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registrations</span>
                        <span>{eventDetails[selectedReport.target_id].registrations}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Related Reports */}
              {relatedReports.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Related Reports ({relatedReports.length})
                    </p>
                    <div className="space-y-2">
                      {relatedReports.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg border p-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => openDetail(r)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{r.reason}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] capitalize border ${STATUS_STYLES[r.status] || ""}`}>
                              {r.status}
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Moderation Timeline */}
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-sm">Report created</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(selectedReport.created_at), "PPP 'at' p")}</p>
                    </div>
                  </div>
                  {selectedReport.status === "reviewing" && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm">Marked under review</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.resolved_at && (
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full ${selectedReport.status === "resolved" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm capitalize">{selectedReport.status}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(selectedReport.resolved_at), "PPP 'at' p")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {(selectedReport.status !== "resolved" && selectedReport.status !== "dismissed") && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Notes</label>
                    <Textarea
                      placeholder="Internal notes about this report..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}

              {selectedReport.admin_notes && (selectedReport.status === "resolved" || selectedReport.status === "dismissed") && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.admin_notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {selectedReport.type === "event" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
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
                      {selectedReport.status === "open" && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          disabled={isProcessing(`${selectedReport.id}-reviewing`)}
                          onClick={() => updateReportStatus(selectedReport.id, "reviewing", adminNotes)}
                        >
                          {isProcessing(`${selectedReport.id}-reviewing`) ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          Mark Reviewing
                        </Button>
                      )}
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
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminReports;
