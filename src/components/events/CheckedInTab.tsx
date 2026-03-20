import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users } from "lucide-react";

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

const CheckedInTab = ({ eventId }: CheckedInTabProps) => {
  const [guests, setGuests] = useState<CheckedInGuest[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Real-time subscription
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Checked In ({guests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {guests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No guests checked in yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the scanner to check in attendees
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium">{guest.name || guest.email}</p>
                  {guest.name && (
                    <p className="text-sm text-muted-foreground">{guest.email}</p>
                  )}
                  {guest.organization && (
                    <p className="text-xs text-muted-foreground">{guest.organization}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {guest.checked_in_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(guest.checked_in_at).toLocaleTimeString()}
                    </span>
                  )}
                  <Badge className="bg-green-600 hover:bg-green-600 text-white">
                    Checked in
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckedInTab;
