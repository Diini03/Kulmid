import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, CalendarClock } from "lucide-react";
import RegistrationStatusBadge from "@/components/events/RegistrationStatusBadge";
import {
  getRegistrationStatus,
  getRegistrationCloseDate,
  daysRemaining,
} from "@/lib/registrationStatus";

interface Props {
  eventId: string;
}

const toLocalInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const RegistrationAvailabilityCard = ({ eventId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [count, setCount] = useState(0);

  const [openAt, setOpenAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [capacityLimited, setCapacityLimited] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState<string>("");
  const [allowWaitlist, setAllowWaitlist] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, date, end_date, max_attendees, registration_open_at, registration_close_at, registration_deadline, registration_override, allow_waitlist")
      .eq("id", eventId)
      .maybeSingle();

    const { data: c } = await supabase.rpc("get_event_registration_count", { _event_id: eventId });

    if (data) {
      setEvent(data);
      setOpenAt(toLocalInput(data.registration_open_at));
      setCloseAt(toLocalInput(data.registration_close_at ?? data.registration_deadline));
      setCapacityLimited(data.max_attendees != null);
      setMaxAttendees(data.max_attendees != null ? String(data.max_attendees) : "");
      setAllowWaitlist(!!data.allow_waitlist);
      setCancelled(data.registration_override === "cancelled");
    }
    setCount(typeof c === "number" ? c : 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const validate = (): string | null => {
    if (openAt && closeAt && new Date(closeAt) <= new Date(openAt)) {
      return "Registration close time must be after the open time.";
    }
    const eventEnd = event?.end_date || event?.date;
    if (openAt && eventEnd && new Date(openAt) > new Date(eventEnd)) {
      return "Registration cannot open after the event has ended.";
    }
    if (capacityLimited && (!maxAttendees || Number(maxAttendees) < 1)) {
      return "Enter a capacity of at least 1.";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    setError(err);
    if (err) return;

    setSaving(true);
    const { error: dbError } = await supabase
      .from("events")
      .update({
        registration_open_at: openAt ? new Date(openAt).toISOString() : null,
        registration_close_at: closeAt ? new Date(closeAt).toISOString() : null,
        registration_deadline: closeAt ? new Date(closeAt).toISOString() : null,
        max_attendees: capacityLimited ? Number(maxAttendees) : null,
        allow_waitlist: allowWaitlist,
        registration_override: cancelled ? "cancelled" : null,
      })
      .eq("id", eventId);
    setSaving(false);

    if (dbError) {
      toast({ title: "Could not save", description: dbError.message, variant: "destructive" });
      return;
    }
    toast({ title: "Registration settings saved" });
    load();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const preview = getRegistrationStatus(
    {
      date: event?.date,
      end_date: event?.end_date,
      max_attendees: capacityLimited ? Number(maxAttendees) || null : null,
      registration_open_at: openAt ? new Date(openAt).toISOString() : null,
      registration_close_at: closeAt ? new Date(closeAt).toISOString() : null,
      registration_override: cancelled ? "cancelled" : null,
    },
    count
  );
  const days = daysRemaining(getRegistrationCloseDate({ registration_close_at: closeAt || null }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Registration availability
            </CardTitle>
            <CardDescription>Control when people can register for this event.</CardDescription>
          </div>
          <RegistrationStatusBadge status={preview} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Registration opens at</Label>
            <DateTimePicker value={openAt} onChange={setOpenAt} placeholder="Immediately" />
            <p className="text-xs text-muted-foreground">Leave empty to open immediately.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Registration closes at</Label>
            <DateTimePicker value={closeAt} onChange={setCloseAt} placeholder="When the event ends" />
            <p className="text-xs text-muted-foreground">
              {days != null ? `${days} day${days === 1 ? "" : "s"} remaining.` : "Defaults to the event end time."}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Limit capacity</Label>
              <p className="text-xs text-muted-foreground">
                {count} registered so far{capacityLimited && maxAttendees ? ` of ${maxAttendees}` : ""}
              </p>
            </div>
            <Switch checked={capacityLimited} onCheckedChange={setCapacityLimited} />
          </div>
          {capacityLimited && (
            <Input
              type="number"
              min={1}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Maximum attendees"
              className="max-w-[200px]"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div>
            <Label className="text-sm">Allow waitlist</Label>
            <p className="text-xs text-muted-foreground">Collect sign-ups once the event is full (coming soon).</p>
          </div>
          <Switch checked={allowWaitlist} onCheckedChange={setAllowWaitlist} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 p-3">
          <div>
            <Label className="text-sm">Cancel registration</Label>
            <p className="text-xs text-muted-foreground">Manually stop all registrations regardless of dates.</p>
          </div>
          <Switch checked={cancelled} onCheckedChange={setCancelled} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save registration settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default RegistrationAvailabilityCard;
