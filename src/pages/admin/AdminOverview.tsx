import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar, Users, ClipboardList, ShieldCheck, Zap, CalendarCheck, Check, X, Eye,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorCard } from "@/components/common/ErrorCard";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";

const CHART_COLORS = ["hsl(175, 70%, 42%)", "hsl(0, 0%, 60%)", "hsl(0, 0%, 80%)", "hsl(0, 0%, 40%)", "hsl(175, 70%, 60%)"];

const AdminOverview = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalEvents: 0, pendingApprovals: 0, totalUsers: 0,
    totalRegistrations: 0, eventsToday: 0, activeEvents: 0,
  });
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchData();
  }, [isAdmin, adminCheckComplete]);

  const fetchData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const sevenDaysAgo = startOfDay(subDays(today, 6));

      const [eventsRes, profilesRes, guestsRes, pendingRes, todayRes, activeRes, catEventsRes, trendRes, recentGuestsRes] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("event_guests").select("*", { count: "exact", head: true }),
        supabase.from("events").select("id, title, date, category, location, created_at, created_by, status, description, profiles:created_by(full_name)").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("*", { count: "exact", head: true }).gte("date", todayStart.toISOString()).lte("date", todayEnd.toISOString()),
        supabase.from("events").select("*", { count: "exact", head: true }).in("status", ["approved", "upcoming", "ongoing"]),
        supabase.from("events").select("category"),
        // Single query for 7-day registration trend instead of 7 sequential queries
        supabase.from("event_guests").select("created_at").gte("created_at", sevenDaysAgo.toISOString()).lte("created_at", todayEnd.toISOString()),
        supabase.from("event_guests").select("name, email, created_at, event_id, status").order("created_at", { ascending: false }).limit(8),
      ]);

      const pendingCount = pendingRes.data?.length || 0;

      setStats({
        totalEvents: eventsRes.count || 0,
        pendingApprovals: pendingCount,
        totalUsers: profilesRes.count || 0,
        totalRegistrations: guestsRes.count || 0,
        eventsToday: todayRes.count || 0,
        activeEvents: activeRes.count || 0,
      });

      setPendingEvents(pendingRes.data || []);

      // Category distribution
      if (catEventsRes.data) {
        const counts: Record<string, number> = {};
        catEventsRes.data.forEach((e: any) => {
          counts[e.category] = (counts[e.category] || 0) + 1;
        });
        setCategoryData(Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5));
      }

      // Registration trend - group client-side
      if (trendRes.data) {
        const dayCounts: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = subDays(today, i);
          dayCounts[format(d, "EEE")] = 0;
        }
        trendRes.data.forEach((g: any) => {
          const dayKey = format(new Date(g.created_at), "EEE");
          if (dayKey in dayCounts) {
            dayCounts[dayKey]++;
          }
        });
        setRegistrationTrend(Object.entries(dayCounts).map(([day, count]) => ({ day, count })));
      }

      setRecentActivity(recentGuestsRes.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    const { error } = await supabase.from("events").update({ status: "approved" }).eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event approved" });
      fetchData();
    }
    setActionLoading(null);
  };

  const handleReject = async (eventId: string) => {
    setActionLoading(eventId);
    const { error } = await supabase.from("events").update({ status: "rejected" }).eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event rejected" });
      fetchData();
    }
    setActionLoading(null);
  };

  if (loadingData) {
    return (
      <>
        <Seo title="Admin Overview" canonical="/admin" />
        <div className="space-y-8">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Seo title="Admin Overview" canonical="/admin" />
        <div className="py-20">
          <ErrorCard message={error} onRetry={fetchData} />
        </div>
      </>
    );
  }

  const metricCards = [
    { label: "Total Events", value: stats.totalEvents, icon: Calendar, color: "text-primary" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: ShieldCheck, color: "text-orange-500" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Registrations", value: stats.totalRegistrations, icon: ClipboardList, color: "text-primary" },
    { label: "Events Today", value: stats.eventsToday, icon: CalendarCheck, color: "text-primary" },
    { label: "Active Events", value: stats.activeEvents, icon: Zap, color: "text-emerald-500" },
  ];

  return (
    <>
      <Seo title="Admin Overview" canonical="/admin" />
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform health and activity at a glance</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map((m) => (
            <Card key={m.label} className="border">
              <CardContent className="pt-5 pb-4 px-4">
                <div className="flex items-center justify-between mb-2">
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <div className="text-2xl font-bold">{m.value}</div>
                <p className="text-[11px] text-muted-foreground mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingEvents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-500" />
                Events Waiting For Approval
                <Badge variant="secondary" className="ml-2">{stats.pendingApprovals}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEvents.map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{event.description}</div>
                      </TableCell>
                      <TableCell className="text-sm">{(event.profiles as any)?.full_name || "Unknown"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{event.category}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(event.created_at), "MMM d")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`/event/${event.id}`} target="_blank"><Eye className="h-3.5 w-3.5" /></a>
                          </Button>
                          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleApprove(event.id)} disabled={actionLoading === event.id}>
                            <Check className="h-3 w-3 mr-1" />{actionLoading === event.id ? "..." : "Approve"}
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleReject(event.id)} disabled={actionLoading === event.id}>
                            <X className="h-3 w-3 mr-1" />{actionLoading === event.id ? "..." : "Reject"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registrations (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={registrationTrend}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(175, 70%, 42%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(175, 70%, 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(175, 70%, 42%)" fill="url(#regGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground flex-1 truncate">{c.name}</span>
                    <span className="font-medium">{c.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="font-medium">{a.name || a.email}</span>
                    <span className="text-muted-foreground">registered for an event</span>
                    <span className="ml-auto text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminOverview;
