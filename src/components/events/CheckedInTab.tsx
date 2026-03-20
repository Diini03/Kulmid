import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Users, Search } from "lucide-react";

interface CheckedInTabProps {
  eventId: string;
}

interface CheckedInGuest {
  id: string;
  name: string | null;
  email: string;
  checked_in_at: string | null;
  organization: string | null;
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const CheckedInTab = ({ eventId }: CheckedInTabProps) => {
  const [guests, setGuests] = useState<CheckedInGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCheckedIn = async () => {
    const { data } = await supabase
      .from("event_guests")
      .select("id, name, email, checked_in_at, organization")
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .order("checked_in_at", { ascending: false });

    if (data) setGuests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCheckedIn();

    const channel = supabase
      .channel(`checked-in-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_guests",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new.checked_in) {
            fetchCheckedIn();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        (g.name && g.name.toLowerCase().includes(q)) ||
        g.email.toLowerCase().includes(q)
    );
  }, [guests, search]);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Checked In ({guests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {guests.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {guests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No guests checked in yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the scanner to check in attendees
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No results for "{search}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((guest) => {
              const initial = (guest.name || guest.email).charAt(0).toUpperCase();
              const colorClass = getAvatarColor(guest.name || guest.email);
              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-4 border border-border/60 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${colorClass}`}>
                      {initial}
                    </div>
                    <div>
                      <p className="font-medium">{guest.name || guest.email}</p>
                      {guest.name && (
                        <p className="text-sm text-muted-foreground">{guest.email}</p>
                      )}
                      {guest.organization && (
                        <p className="text-xs text-muted-foreground">{guest.organization}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {guest.checked_in_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(guest.checked_in_at).toLocaleTimeString()}
                      </span>
                    )}
                    <Badge variant="success">Checked in</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckedInTab;
