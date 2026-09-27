import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, ClipboardList, UserCheck, Users } from "lucide-react";

type Guest = { event_id: string; status: string; checked_in: boolean | null };
type Ev = { id: string; created_by: string; date: string };
type Organizer = {
  user_id: string; name: string; username: string | null; verified: boolean;
  events: number; upcoming: number; registrations: number; checkedIn: number;
};

async function fetchAllGuests(): Promise<Guest[]> {
  const out: Guest[] = [];
  const size = 1000;
  for (let from = 0; from < 20000; from += size) {
    const { data, error } = await supabase
      .from("event_guests")
      .select("event_id, status, checked_in")
      .range(from, from + size - 1);
    if (error) throw error;
    out.push(...((data as Guest[]) || []));
    if (!data || data.length < size) break;
  }
  return out;
}

export const PlatformPulse = () => {
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState({ active: 0, pending: 0, waitlisted: 0, cancelled: 0 });
  const [att, setAtt] = useState({ checkedIn: 0, eligible: 0 });
  const [organizers, setOrganizers] = useState<Organizer[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [guests, evRes] = await Promise.all([
          fetchAllGuests(),
          supabase.from("events").select("id, created_by, date").limit(5000),
        ]);
        const events = (evRes.data as Ev[]) || [];
        const r = { active: 0, pending: 0, waitlisted: 0, cancelled: 0 };
        let checkedIn = 0, eligible = 0;
        const byEvent: Record<string, { regs: number; checked: number }> = {};
        for (const g of guests) {
          const s = g.status;
          if (s === "cancelled") r.cancelled++;
          else if (s === "waitlisted") r.waitlisted++;
          else if (s === "pending") r.pending++;
          else if (s !== "rejected") r.active++;
          const counts = s !== "cancelled" && s !== "rejected" && s !== "waitlisted";
          if (counts) eligible++;
          if (g.checked_in) checkedIn++;
          const b = (byEvent[g.event_id] ||= { regs: 0, checked: 0 });
          if (counts) b.regs++;
          if (g.checked_in) b.checked++;
        }
        setReg(r);
        setAtt({ checkedIn, eligible });

        const now = Date.now();
        const map: Record<string, Organizer> = {};
        for (const e of events) {
          const o = (map[e.created_by] ||= {
            user_id: e.created_by, name: "Unknown", username: null, verified: false,
            events: 0, upcoming: 0, registrations: 0, checkedIn: 0,
          });
          o.events++;
          if (new Date(e.date).getTime() >= now) o.upcoming++;
          o.registrations += byEvent[e.id]?.regs || 0;
          o.checkedIn += byEvent[e.id]?.checked || 0;
        }
        const ids = Object.keys(map);
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles").select("user_id, full_name, username, verified").in("user_id", ids);
          (profs || []).forEach((p: any) => {
            const o = map[p.user_id];
            if (o) { o.name = p.full_name || "Unknown"; o.username = p.username; o.verified = !!p.verified; }
          });
        }
        setOrganizers(Object.values(map).sort((a, b) => b.registrations - a.registrations || b.events - a.events).slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  const rate = att.eligible ? Math.round((att.checkedIn / att.eligible) * 100) : 0;
  const total = reg.active + reg.pending + reg.waitlisted + reg.cancelled;
  const rows = [
    { label: "Confirmed", value: reg.active },
    { label: "Pending approval", value: reg.pending },
    { label: "Waitlisted", value: reg.waitlisted },
    { label: "Cancelled", value: reg.cancelled },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" />Registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-bold">{total.toLocaleString()}</div>
          {rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value.toLocaleString()}</span>
              </div>
              <Progress value={total ? (row.value / total) * 100 : 0} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" />Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">{rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">show-up rate across all events</p>
          </div>
          <Progress value={rate} className="h-2" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="font-semibold">{att.checkedIn.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Checked in</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="font-semibold">{Math.max(att.eligible - att.checkedIn, 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">No-shows / not yet</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Top organizers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {organizers.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">No organizer activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizer</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Regs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizers.map((o) => (
                  <TableRow key={o.user_id}>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1 text-sm font-medium truncate max-w-[140px]">
                        {o.username ? <Link to={`/u/${o.username}`} className="hover:underline truncate">{o.name}</Link> : <span className="truncate">{o.name}</span>}
                        {o.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{o.upcoming} upcoming · {o.checkedIn} checked in</div>
                    </TableCell>
                    <TableCell className="text-right text-sm py-2">{o.events}</TableCell>
                    <TableCell className="text-right text-sm py-2">{o.registrations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
