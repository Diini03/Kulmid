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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Flag, ShieldAlert, AlertTriangle, Eye, CheckCircle, XCircle, Ban,
  ExternalLink, Loader2, Search, Download, FileText, MoreHorizontal,
  ShieldCheck, Clock, AlertOctagon, ChevronRight, Calendar, Users,
  BarChart3, Tag, Printer, ClipboardList, TrendingUp, UserCheck
} from "lucide-react";
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

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

const EVENT_STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  upcoming: "bg-primary/10 text-primary border-primary/20",
  ongoing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  past: "bg-muted text-muted-foreground border-transparent",
  draft: "bg-muted text-muted-foreground border-transparent",
};

const CHART_COLORS = ["hsl(175, 70%, 42%)", "hsl(175, 70%, 55%)", "hsl(175, 70%, 68%)", "hsl(0, 0%, 70%)", "hsl(0, 0%, 50%)", "hsl(0, 0%, 85%)"];

// ── Types ───────────────────────────────────────────────────
interface Report {
  id: string; type: string; target_id: string; reported_by: string | null;
  reason: string; description: string | null; admin_notes: string | null;
  priority: string; status: string; created_at: string;
  resolved_at: string | null; resolved_by: string | null;
}

interface EventRow {
  id: string; title: string; category: string; date: string; location: string;
  status: string; created_by: string; created_at: string; host_name: string | null;
  host_email: string | null; max_attendees: number | null;
}

interface GuestRow {
  id: string; event_id: string; name: string | null; email: string;
  status: string; checked_in: boolean | null; created_at: string;
}

interface ProfileRow {
  user_id: string; full_name: string; created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────
const inRange = (dateStr: string | null, start: Date, end: Date) => {
  if (!dateStr) return false;
  try {
    return isWithinInterval(parseISO(dateStr), { start: startOfDay(start), end: endOfDay(end) });
  } catch { return false; }
};

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ── Component ───────────────────────────────────────────────
const AdminReports = () => {
  const { isAdmin, adminCheckComplete, user } = useAuth();

  // Global date range
  const [dateStart, setDateStart] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateEnd, setDateEnd] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const startDate = useMemo(() => new Date(dateStart), [dateStart]);
  const endDate = useMemo(() => new Date(dateEnd), [dateEnd]);

  // Active tab
  const [activeTab, setActiveTab] = useState("events");

  // Data
  const [events, setEvents] = useState<EventRow[]>([]);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [reporterNames, setReporterNames] = useState<Record<string, string>>({});
  const [eventTitlesMap, setEventTitlesMap] = useState<Record<string, string>>({});
  const [eventDetailsMap, setEventDetailsMap] = useState<Record<string, { status: string; host_name: string | null; registrations: number }>>({});

  // Tab-level filters
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("all");
  const [regSearch, setRegSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");
  const [regCheckinFilter, setRegCheckinFilter] = useState("all");
  const [orgSearch, setOrgSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [modSearch, setModSearch] = useState("");
  const [modStatusFilter, setModStatusFilter] = useState("all");
  const [modTypeFilter, setModTypeFilter] = useState("all");
  const [modPriorityFilter, setModPriorityFilter] = useState("all");

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchAll();
  }, [isAdmin, adminCheckComplete]);

  const fetchAll = async () => {
    setLoading(true);
    const [evRes, guestRes, profileRes, reportRes] = await Promise.all([
      supabase.from("events").select("id, title, category, date, location, status, created_by, created_at, host_name, host_email, max_attendees"),
      supabase.from("event_guests").select("id, event_id, name, email, status, checked_in, created_at"),
      supabase.from("profiles").select("user_id, full_name, created_at"),
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
    ]);
    setEvents((evRes.data || []) as EventRow[]);
    setGuests((guestRes.data || []) as GuestRow[]);
    setProfiles((profileRes.data || []) as ProfileRow[]);
    const reps = (reportRes.data || []) as Report[];
    setReports(reps);

    // Enrichment for moderation
    const reporterIds = [...new Set(reps.map(r => r.reported_by).filter(Boolean))] as string[];
    if (reporterIds.length > 0) {
      const { data: rProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", reporterIds);
      const names: Record<string, string> = {};
      rProfiles?.forEach(p => { names[p.user_id] = p.full_name; });
      setReporterNames(names);
    }
    const eventIds = [...new Set(reps.filter(r => r.type === "event").map(r => r.target_id))];
    if (eventIds.length > 0) {
      const titles: Record<string, string> = {};
      const details: Record<string, { status: string; host_name: string | null; registrations: number }> = {};
      (evRes.data || []).forEach((e: any) => {
        if (eventIds.includes(e.id)) {
          titles[e.id] = e.title;
          details[e.id] = { status: e.status, host_name: e.host_name, registrations: 0 };
        }
      });
      (guestRes.data || []).forEach((g: any) => {
        if (details[g.event_id]) details[g.event_id].registrations++;
      });
      setEventTitlesMap(titles);
      setEventDetailsMap(details);
    }
    setLoading(false);
  };

  // ── Derived data ──────────────────────────────────────────

  // Date-filtered events
  const rangeEvents = useMemo(() => events.filter(e => inRange(e.created_at, startDate, endDate)), [events, startDate, endDate]);
  const rangeGuests = useMemo(() => guests.filter(g => inRange(g.created_at, startDate, endDate)), [guests, startDate, endDate]);
  const rangeReports = useMemo(() => reports.filter(r => inRange(r.created_at, startDate, endDate)), [reports, startDate, endDate]);

  // Guest count per event
  const guestCountByEvent = useMemo(() => {
    const map: Record<string, number> = {};
    guests.forEach(g => { map[g.event_id] = (map[g.event_id] || 0) + 1; });
    return map;
  }, [guests]);

  // Checkin count per event
  const checkinCountByEvent = useMemo(() => {
    const map: Record<string, number> = {};
    guests.forEach(g => { if (g.checked_in) map[g.event_id] = (map[g.event_id] || 0) + 1; });
    return map;
  }, [guests]);

  // Event title lookup
  const eventTitleLookup = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach(e => { map[e.id] = e.title; });
    return map;
  }, [events]);

  // Profile lookup
  const profileLookup = useMemo(() => {
    const map: Record<string, string> = {};
    profiles.forEach(p => { map[p.user_id] = p.full_name; });
    return map;
  }, [profiles]);

  // Stats
  const stats = useMemo(() => ({
    totalEvents: rangeEvents.length,
    approved: rangeEvents.filter(e => e.status === "approved" || e.status === "upcoming" || e.status === "ongoing").length,
    pending: rangeEvents.filter(e => e.status === "pending").length,
    totalRegs: rangeGuests.length,
    activeOrganizers: new Set(rangeEvents.map(e => e.created_by)).size,
    modReports: rangeReports.length,
  }), [rangeEvents, rangeGuests, rangeReports]);

  // ── TAB A: Event Reports ──────────────────────────────────
  const filteredEvents = useMemo(() => {
    const q = eventSearch.toLowerCase();
    return rangeEvents.filter(e => {
      if (eventStatusFilter !== "all" && e.status !== eventStatusFilter) return false;
      if (eventCategoryFilter !== "all" && e.category !== eventCategoryFilter) return false;
      if (q) {
        const s = `${e.title} ${e.host_name || ""} ${e.location} ${e.category}`.toLowerCase();
        if (!s.includes(q)) return false;
      }
      return true;
    });
  }, [rangeEvents, eventSearch, eventStatusFilter, eventCategoryFilter]);

  const eventChartData = useMemo(() => {
    const map: Record<string, { month: string; approved: number; pending: number; rejected: number; other: number }> = {};
    rangeEvents.forEach(e => {
      const m = format(parseISO(e.created_at), "MMM yyyy");
      if (!map[m]) map[m] = { month: m, approved: 0, pending: 0, rejected: 0, other: 0 };
      if (["approved", "upcoming", "ongoing"].includes(e.status)) map[m].approved++;
      else if (e.status === "pending") map[m].pending++;
      else if (e.status === "rejected") map[m].rejected++;
      else map[m].other++;
    });
    return Object.values(map);
  }, [rangeEvents]);

  // ── TAB B: Registration Reports ───────────────────────────
  const filteredGuests = useMemo(() => {
    const q = regSearch.toLowerCase();
    return rangeGuests.filter(g => {
      if (regStatusFilter !== "all" && g.status !== regStatusFilter) return false;
      if (regCheckinFilter === "checked_in" && !g.checked_in) return false;
      if (regCheckinFilter === "not_checked_in" && g.checked_in) return false;
      if (q) {
        const s = `${g.name || ""} ${g.email} ${eventTitleLookup[g.event_id] || ""}`.toLowerCase();
        if (!s.includes(q)) return false;
      }
      return true;
    });
  }, [rangeGuests, regSearch, regStatusFilter, regCheckinFilter, eventTitleLookup]);

  const regChartData = useMemo(() => {
    const map: Record<string, { day: string; count: number }> = {};
    rangeGuests.forEach(g => {
      const d = format(parseISO(g.created_at), "MMM dd");
      if (!map[d]) map[d] = { day: d, count: 0 };
      map[d].count++;
    });
    return Object.values(map).slice(-14);
  }, [rangeGuests]);

  // ── TAB C: Organizer Reports ──────────────────────────────
  const organizerData = useMemo(() => {
    const map: Record<string, { name: string; userId: string; total: number; approved: number; rejected: number; pending: number; regs: number; joinDate: string }> = {};
    rangeEvents.forEach(e => {
      if (!map[e.created_by]) {
        map[e.created_by] = {
          name: profileLookup[e.created_by] || e.host_name || "Unknown",
          userId: e.created_by,
          total: 0, approved: 0, rejected: 0, pending: 0, regs: 0,
          joinDate: profiles.find(p => p.user_id === e.created_by)?.created_at || "",
        };
      }
      const o = map[e.created_by];
      o.total++;
      if (["approved", "upcoming", "ongoing"].includes(e.status)) o.approved++;
      else if (e.status === "rejected") o.rejected++;
      else if (e.status === "pending") o.pending++;
      o.regs += guestCountByEvent[e.id] || 0;
    });
    return Object.values(map);
  }, [rangeEvents, profileLookup, profiles, guestCountByEvent]);

  const filteredOrganizers = useMemo(() => {
    const q = orgSearch.toLowerCase();
    return organizerData.filter(o => !q || o.name.toLowerCase().includes(q)).sort((a, b) => b.total - a.total);
  }, [organizerData, orgSearch]);

  const orgChartData = useMemo(() => filteredOrganizers.slice(0, 5).map(o => ({ name: o.name.split(" ")[0], events: o.total, regs: o.regs })), [filteredOrganizers]);

  // ── TAB D: Category Reports ───────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, { category: string; events: number; regs: number; approved: number; pending: number; rejected: number }> = {};
    rangeEvents.forEach(e => {
      if (!map[e.category]) map[e.category] = { category: e.category, events: 0, regs: 0, approved: 0, pending: 0, rejected: 0 };
      const c = map[e.category];
      c.events++;
      c.regs += guestCountByEvent[e.id] || 0;
      if (["approved", "upcoming", "ongoing"].includes(e.status)) c.approved++;
      else if (e.status === "pending") c.pending++;
      else if (e.status === "rejected") c.rejected++;
    });
    return Object.values(map).sort((a, b) => b.events - a.events);
  }, [rangeEvents, guestCountByEvent]);

  const filteredCategories = useMemo(() => {
    const q = catSearch.toLowerCase();
    return categoryData.filter(c => !q || c.category.toLowerCase().includes(q));
  }, [categoryData, catSearch]);

  // ── TAB E: Moderation Reports ─────────────────────────────
  const filteredMod = useMemo(() => {
    const q = modSearch.toLowerCase();
    return rangeReports.filter(r => {
      if (modStatusFilter !== "all" && r.status !== modStatusFilter) return false;
      if (modTypeFilter !== "all" && r.type !== modTypeFilter) return false;
      if (modPriorityFilter !== "all" && r.priority !== modPriorityFilter) return false;
      if (q) {
        const targetName = r.type === "event" ? (eventTitlesMap[r.target_id] || "") : "";
        const rName = r.reported_by ? (reporterNames[r.reported_by] || "") : "";
        if (!`${r.id} ${r.reason} ${r.description || ""} ${targetName} ${rName}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rangeReports, modSearch, modStatusFilter, modTypeFilter, modPriorityFilter, eventTitlesMap, reporterNames]);

  const modChartData = useMemo(() => {
    const byType: Record<string, number> = {};
    rangeReports.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [rangeReports]);

  // ── Moderation actions ────────────────────────────────────
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
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: `Report ${status}` }); fetchAll(); if (selectedReport?.id === reportId) setSelectedReport(null); }
  }, [user, selectedReport]);

  const rejectEvent = useCallback(async (eventId: string, reportId: string) => {
    setProcessingAction(`${reportId}-reject`);
    const { error } = await supabase.from("events").update({ status: "rejected", rejection_reason: "Rejected due to community reports" }).eq("id", eventId);
    setProcessingAction(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Event rejected" }); updateReportStatus(reportId, "resolved", adminNotes || "Event rejected via report action"); }
  }, [adminNotes, updateReportStatus]);

  const relatedReports = useMemo(() => {
    if (!selectedReport) return [];
    return reports.filter(r => r.target_id === selectedReport.target_id && r.id !== selectedReport.id);
  }, [selectedReport, reports]);

  const isProcessing = (key: string) => processingAction === key;

  // ── Export / Print ────────────────────────────────────────
  const getExportData = (): { title: string; headers: string[]; rows: string[][] } => {
    const range = `${format(startDate, "MMM d, yyyy")} — ${format(endDate, "MMM d, yyyy")}`;
    switch (activeTab) {
      case "events":
        return {
          title: `Kulmid Event Report — ${range}`,
          headers: ["Title", "Organizer", "Category", "Date", "Location", "Status", "Registrations"],
          rows: filteredEvents.map(e => [e.title, e.host_name || profileLookup[e.created_by] || "—", e.category, format(parseISO(e.date), "MMM d, yyyy"), e.location, e.status, String(guestCountByEvent[e.id] || 0)]),
        };
      case "registrations":
        return {
          title: `Kulmid Registration Report — ${range}`,
          headers: ["Event", "Guest Name", "Email", "Status", "Checked In", "Registered At"],
          rows: filteredGuests.map(g => [eventTitleLookup[g.event_id] || g.event_id, g.name || "—", g.email, g.status, g.checked_in ? "Yes" : "No", format(parseISO(g.created_at), "MMM d, yyyy")]),
        };
      case "organizers":
        return {
          title: `Kulmid Organizer Report — ${range}`,
          headers: ["Organizer", "Events Hosted", "Approved", "Rejected", "Pending", "Total Registrations"],
          rows: filteredOrganizers.map(o => [o.name, String(o.total), String(o.approved), String(o.rejected), String(o.pending), String(o.regs)]),
        };
      case "categories":
        return {
          title: `Kulmid Category Report — ${range}`,
          headers: ["Category", "Events", "Registrations", "Approved", "Pending", "Rejected"],
          rows: filteredCategories.map(c => [c.category, String(c.events), String(c.regs), String(c.approved), String(c.pending), String(c.rejected)]),
        };
      case "moderation":
        return {
          title: `Kulmid Moderation Report — ${range}`,
          headers: ["ID", "Type", "Target", "Reason", "Priority", "Status", "Reporter", "Date"],
          rows: filteredMod.map(r => [r.id.substring(0, 8), r.type, r.type === "event" ? (eventTitlesMap[r.target_id] || r.target_id) : r.target_id, r.reason, r.priority, r.status, r.reported_by ? (reporterNames[r.reported_by] || "Unknown") : "System", format(parseISO(r.created_at), "MMM d, yyyy")]),
        };
      default:
        return { title: "", headers: [], rows: [] };
    }
  };

  const exportCSV = () => {
    const { title, headers, rows } = getExportData();
    if (rows.length === 0) return;
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(csv, `${title.replace(/\s/g, "_")}.csv`, "text/csv");
    toast({ title: "CSV exported" });
  };

  const exportPDF = () => {
    const { title, headers, rows } = getExportData();
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(14);
    doc.text(title, 14, 18);
    doc.setFontSize(8);
    doc.text(`Generated: ${format(new Date(), "PPP")}  |  ${rows.length} records`, 14, 25);
    let y = 34;
    const colW = headers.length > 6 ? 38 : 30;
    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => doc.text(h.substring(0, 15), 14 + i * colW, y));
    doc.setFont("helvetica", "normal");
    y += 6;
    rows.forEach(row => {
      if (y > 280) { doc.addPage(); y = 20; }
      row.forEach((c, i) => doc.text(String(c).substring(0, 18), 14 + i * colW, y));
      y += 5;
    });
    doc.save(`${title.replace(/\s/g, "_")}.pdf`);
    toast({ title: "PDF exported" });
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="py-20 text-center text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />Loading reporting data...</div>;

  return (
    <>
      <Seo title="Reporting Center" canonical="/admin/reports" />
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reporting Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform-wide reports, insights, and data exports</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-[140px] h-9 text-xs" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-[140px] h-9 text-xs" />
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1.5" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="h-4 w-4 mr-1.5" />PDF</Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Events", value: stats.totalEvents, icon: Calendar, color: "text-primary" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-500" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
            { label: "Registrations", value: stats.totalRegs, icon: ClipboardList, color: "text-blue-500" },
            { label: "Organizers", value: stats.activeOrganizers, icon: Users, color: "text-violet-500" },
            { label: "Mod. Reports", value: stats.modReports, icon: Flag, color: "text-red-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <div className="text-xl font-bold">{value}</div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Events</TabsTrigger>
            <TabsTrigger value="registrations" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Registrations</TabsTrigger>
            <TabsTrigger value="organizers" className="gap-1.5"><Users className="h-3.5 w-3.5" />Organizers</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5"><Tag className="h-3.5 w-3.5" />Categories</TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" />Moderation</TabsTrigger>
          </TabsList>

          {/* ── Events Tab ─────────────────────────────────── */}
          <TabsContent value="events" className="space-y-4 mt-4">
            {eventChartData.length > 0 && (
              <Card><CardContent className="pt-4 pb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Events Created Over Time</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={eventChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="approved" fill="hsl(160, 60%, 45%)" stackId="a" name="Approved" />
                    <Bar dataKey="pending" fill="hsl(38, 90%, 50%)" stackId="a" name="Pending" />
                    <Bar dataKey="rejected" fill="hsl(0, 72%, 50%)" stackId="a" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventCategoryFilter} onValueChange={setEventCategoryFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {["Seminar", "Workshop", "Conference", "Festival", "Webinar", "Meetup"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card><CardContent className="p-0">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center"><Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">No events found for the selected filters.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Title</TableHead><TableHead>Organizer</TableHead><TableHead>Category</TableHead>
                    <TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Regs</TableHead><TableHead className="w-[50px]" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredEvents.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{e.title}</TableCell>
                        <TableCell className="text-sm">{e.host_name || profileLookup[e.created_by] || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[11px]">{e.category}</Badge></TableCell>
                        <TableCell className="text-sm">{format(parseISO(e.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate">{e.location}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-[11px] capitalize border ${EVENT_STATUS_STYLES[e.status] || ""}`}>{e.status}</Badge></TableCell>
                        <TableCell className="text-right">{guestCountByEvent[e.id] || 0}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={`/events/${e.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredEvents.length > 0 && (
                <div className="px-4 py-3 border-t text-xs text-muted-foreground flex gap-4">
                  <span>Total: {filteredEvents.length} events</span>
                  <span>Registrations: {filteredEvents.reduce((s, e) => s + (guestCountByEvent[e.id] || 0), 0)}</span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ── Registrations Tab ──────────────────────────── */}
          <TabsContent value="registrations" className="space-y-4 mt-4">
            {regChartData.length > 0 && (
              <Card><CardContent className="pt-4 pb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Registrations Trend (Last 14 Days)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={regChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(175, 70%, 42%)" strokeWidth={2} dot={false} name="Registrations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, email, event..." value={regSearch} onChange={e => setRegSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={regStatusFilter} onValueChange={setRegStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regCheckinFilter} onValueChange={setRegCheckinFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Check-in" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Check-in</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card><CardContent className="p-0">
              {filteredGuests.length === 0 ? (
                <div className="py-16 text-center"><ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">No registrations found for the selected filters.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Event</TableHead><TableHead>Guest</TableHead><TableHead>Email</TableHead>
                    <TableHead>Status</TableHead><TableHead>Check-in</TableHead><TableHead>Registered</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredGuests.slice(0, 100).map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium max-w-[180px] truncate">{eventTitleLookup[g.event_id] || g.event_id}</TableCell>
                        <TableCell className="text-sm">{g.name || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{g.email}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[11px] capitalize">{g.status}</Badge></TableCell>
                        <TableCell>{g.checked_in ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                        <TableCell className="text-sm">{format(parseISO(g.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredGuests.length > 0 && (
                <div className="px-4 py-3 border-t text-xs text-muted-foreground flex gap-4">
                  <span>Total: {filteredGuests.length} registrations{filteredGuests.length > 100 ? " (showing first 100)" : ""}</span>
                  <span>Checked in: {filteredGuests.filter(g => g.checked_in).length}</span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ── Organizers Tab ─────────────────────────────── */}
          <TabsContent value="organizers" className="space-y-4 mt-4">
            {orgChartData.length > 0 && (
              <Card><CardContent className="pt-4 pb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Top Organizers</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={orgChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="events" fill="hsl(175, 70%, 42%)" name="Events" />
                    <Bar dataKey="regs" fill="hsl(175, 70%, 65%)" name="Registrations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search organizers..." value={orgSearch} onChange={e => setOrgSearch(e.target.value)} className="pl-9" />
            </div>

            <Card><CardContent className="p-0">
              {filteredOrganizers.length === 0 ? (
                <div className="py-16 text-center"><Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">No organizer data available for this period.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Organizer</TableHead><TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Approved</TableHead><TableHead className="text-right">Rejected</TableHead>
                    <TableHead className="text-right">Pending</TableHead><TableHead className="text-right">Registrations</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredOrganizers.map(o => (
                      <TableRow key={o.userId}>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell className="text-right">{o.total}</TableCell>
                        <TableCell className="text-right text-emerald-600">{o.approved}</TableCell>
                        <TableCell className="text-right text-red-500">{o.rejected}</TableCell>
                        <TableCell className="text-right text-amber-500">{o.pending}</TableCell>
                        <TableCell className="text-right">{o.regs}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredOrganizers.length > 0 && (
                <div className="px-4 py-3 border-t text-xs text-muted-foreground flex gap-4">
                  <span>Total: {filteredOrganizers.length} organizers</span>
                  <span>Events: {filteredOrganizers.reduce((s, o) => s + o.total, 0)}</span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ── Categories Tab ─────────────────────────────── */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            {categoryData.length > 0 && (
              <Card><CardContent className="pt-4 pb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Category Distribution</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="events" nameKey="category" cx="50%" cy="50%" outerRadius={75} label={({ category, events }) => `${category} (${events})`} labelLine={{ stroke: "hsl(0,0%,70%)" }}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search categories..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="pl-9" />
            </div>

            <Card><CardContent className="p-0">
              {filteredCategories.length === 0 ? (
                <div className="py-16 text-center"><Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">No category data available for this period.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Category</TableHead><TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Registrations</TableHead><TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Pending</TableHead><TableHead className="text-right">Rejected</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredCategories.map(c => (
                      <TableRow key={c.category}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right">{c.events}</TableCell>
                        <TableCell className="text-right">{c.regs}</TableCell>
                        <TableCell className="text-right text-emerald-600">{c.approved}</TableCell>
                        <TableCell className="text-right text-amber-500">{c.pending}</TableCell>
                        <TableCell className="text-right text-red-500">{c.rejected}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredCategories.length > 0 && (
                <div className="px-4 py-3 border-t text-xs text-muted-foreground flex gap-4">
                  <span>Total: {filteredCategories.reduce((s, c) => s + c.events, 0)} events across {filteredCategories.length} categories</span>
                  <span>Registrations: {filteredCategories.reduce((s, c) => s + c.regs, 0)}</span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ── Moderation Tab ─────────────────────────────── */}
          <TabsContent value="moderation" className="space-y-4 mt-4">
            {modChartData.length > 0 && (
              <Card><CardContent className="pt-4 pb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Reports by Type</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={modChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(0, 72%, 50%)" name="Reports" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search reports..." value={modSearch} onChange={e => setModSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={modStatusFilter} onValueChange={setModStatusFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={modTypeFilter} onValueChange={setModTypeFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
              <Select value={modPriorityFilter} onValueChange={setModPriorityFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card><CardContent className="p-0">
              {filteredMod.length === 0 ? (
                <div className="py-16 text-center"><ShieldCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">{rangeReports.length === 0 ? "No moderation reports have been submitted yet." : "No reports match the selected filters."}</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
                    <TableHead>Reporter</TableHead><TableHead>Date</TableHead><TableHead className="w-[50px]" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredMod.map(r => (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => { setSelectedReport(r); setAdminNotes(r.admin_notes || ""); }}>
                        <TableCell className="font-mono text-xs">{r.id.substring(0, 8)}</TableCell>
                        <TableCell className="capitalize text-sm">{r.type}</TableCell>
                        <TableCell className="text-sm max-w-[140px] truncate">{r.type === "event" ? (eventTitlesMap[r.target_id] || r.target_id.substring(0, 12)) : r.target_id.substring(0, 12)}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{r.reason}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-[11px] capitalize border ${PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.medium}`}>{r.priority}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={`text-[11px] capitalize border ${STATUS_STYLES[r.status] || ""}`}>{r.status}</Badge></TableCell>
                        <TableCell className="text-sm">{r.reported_by ? (reporterNames[r.reported_by] || "Unknown") : "System"}</TableCell>
                        <TableCell className="text-sm">{format(parseISO(r.created_at), "MMM d")}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); setSelectedReport(r); setAdminNotes(r.admin_notes || ""); }}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                              {r.type === "event" && (
                                <DropdownMenuItem asChild><a href={`/events/${r.target_id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />View Event</a></DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {r.status === "open" && <DropdownMenuItem onClick={e => { e.stopPropagation(); updateReportStatus(r.id, "reviewing"); }}><Clock className="h-4 w-4 mr-2" />Mark Reviewing</DropdownMenuItem>}
                              {r.status !== "resolved" && <DropdownMenuItem onClick={e => { e.stopPropagation(); updateReportStatus(r.id, "resolved"); }}><CheckCircle className="h-4 w-4 mr-2" />Resolve</DropdownMenuItem>}
                              {r.status !== "dismissed" && <DropdownMenuItem onClick={e => { e.stopPropagation(); updateReportStatus(r.id, "dismissed"); }}><XCircle className="h-4 w-4 mr-2" />Dismiss</DropdownMenuItem>}
                              {r.type === "event" && r.status !== "resolved" && (<><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); rejectEvent(r.target_id, r.id); }}><Ban className="h-4 w-4 mr-2" />Reject Event</DropdownMenuItem></>)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredMod.length > 0 && (
                <div className="px-4 py-3 border-t text-xs text-muted-foreground flex gap-4">
                  <span>Total: {filteredMod.length} reports</span>
                  <span>Open: {filteredMod.filter(r => r.status === "open").length}</span>
                  <span>Resolved: {filteredMod.filter(r => r.status === "resolved").length}</span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Moderation Detail Sheet ────────────────────────── */}
      <Sheet open={!!selectedReport} onOpenChange={open => !open && setSelectedReport(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Report Details</SheetTitle>
            <SheetDescription>Review and take action on this report</SheetDescription>
          </SheetHeader>
          {selectedReport && (
            <div className="space-y-5 mt-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Report ID</span><span className="font-mono text-xs">{selectedReport.id.substring(0, 12)}...</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize font-medium">{selectedReport.type}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Priority</span><Badge variant="outline" className={`text-[11px] capitalize border ${PRIORITY_STYLES[selectedReport.priority] || PRIORITY_STYLES.medium}`}>{selectedReport.priority}</Badge></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={`text-[11px] capitalize border ${STATUS_STYLES[selectedReport.status] || ""}`}>{selectedReport.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reporter</span><span>{selectedReport.reported_by ? reporterNames[selectedReport.reported_by] || "Unknown" : "System"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reported</span><span>{format(parseISO(selectedReport.created_at), "PPP")}</span></div>
                {selectedReport.resolved_at && <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span>{format(parseISO(selectedReport.resolved_at), "PPP")}</span></div>}
              </div>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground mb-1">Reason</p><p className="text-sm font-medium">{selectedReport.reason}</p></div>
              {selectedReport.description && <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p></div>}

              {selectedReport.type === "event" && eventDetailsMap[selectedReport.target_id] && (<>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Event Information</p>
                  <div className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Title</span><a href={`/events/${selectedReport.target_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">{eventTitlesMap[selectedReport.target_id]}<ExternalLink className="h-3 w-3" /></a></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Event Status</span><span className="capitalize">{eventDetailsMap[selectedReport.target_id].status}</span></div>
                    {eventDetailsMap[selectedReport.target_id].host_name && <div className="flex justify-between"><span className="text-muted-foreground">Organizer</span><span>{eventDetailsMap[selectedReport.target_id].host_name}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Registrations</span><span>{eventDetailsMap[selectedReport.target_id].registrations}</span></div>
                  </div>
                </div>
              </>)}

              {relatedReports.length > 0 && (<>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Related Reports ({relatedReports.length})</p>
                  <div className="space-y-2">
                    {relatedReports.map(r => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => { setSelectedReport(r); setAdminNotes(r.admin_notes || ""); }}>
                        <div className="flex-1 min-w-0"><p className="text-sm truncate">{r.reason}</p><p className="text-xs text-muted-foreground">{format(parseISO(r.created_at), "MMM d, yyyy")}</p></div>
                        <div className="flex items-center gap-2"><Badge variant="outline" className={`text-[10px] capitalize border ${STATUS_STYLES[r.status] || ""}`}>{r.status}</Badge><ChevronRight className="h-3 w-3 text-muted-foreground" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3"><div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" /><div><p className="text-sm">Report created</p><p className="text-xs text-muted-foreground">{format(parseISO(selectedReport.created_at), "PPP 'at' p")}</p></div></div>
                  {selectedReport.status === "reviewing" && <div className="flex items-start gap-3"><div className="mt-0.5 h-2 w-2 rounded-full bg-primary" /><div><p className="text-sm">Marked under review</p></div></div>}
                  {selectedReport.resolved_at && <div className="flex items-start gap-3"><div className={`mt-0.5 h-2 w-2 rounded-full ${selectedReport.status === "resolved" ? "bg-emerald-500" : "bg-muted-foreground"}`} /><div><p className="text-sm capitalize">{selectedReport.status}</p><p className="text-xs text-muted-foreground">{format(parseISO(selectedReport.resolved_at), "PPP 'at' p")}</p></div></div>}
                </div>
              </div>

              {(selectedReport.status !== "resolved" && selectedReport.status !== "dismissed") && (<>
                <Separator />
                <div className="space-y-2"><label className="text-sm font-medium">Admin Notes</label><Textarea placeholder="Internal notes..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} /></div>
              </>)}

              {selectedReport.admin_notes && (selectedReport.status === "resolved" || selectedReport.status === "dismissed") && (
                <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground mb-1">Admin Notes</p><p className="text-sm whitespace-pre-wrap">{selectedReport.admin_notes}</p></div>
              )}

              {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (<>
                <Separator />
                <div className="space-y-3">
                  {selectedReport.type === "event" && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild><a href={`/events/${selectedReport.target_id}`} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-2" />View Event</a></Button>
                      <Button variant="destructive" size="sm" className="flex-1" disabled={isProcessing(`${selectedReport.id}-reject`)} onClick={() => rejectEvent(selectedReport.target_id, selectedReport.id)}>
                        {isProcessing(`${selectedReport.id}-reject`) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}Reject Event
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {selectedReport.status === "open" && <Button variant="outline" className="flex-1" disabled={isProcessing(`${selectedReport.id}-reviewing`)} onClick={() => updateReportStatus(selectedReport.id, "reviewing", adminNotes)}>{isProcessing(`${selectedReport.id}-reviewing`) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}Mark Reviewing</Button>}
                    <Button className="flex-1" disabled={isProcessing(`${selectedReport.id}-resolved`)} onClick={() => updateReportStatus(selectedReport.id, "resolved", adminNotes)}>{isProcessing(`${selectedReport.id}-resolved`) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}Resolve</Button>
                    <Button variant="outline" className="flex-1" disabled={isProcessing(`${selectedReport.id}-dismissed`)} onClick={() => updateReportStatus(selectedReport.id, "dismissed", adminNotes)}>{isProcessing(`${selectedReport.id}-dismissed`) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}Dismiss</Button>
                  </div>
                </div>
              </>)}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminReports;
