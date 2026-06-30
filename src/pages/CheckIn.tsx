import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { CheckCircle2, XCircle, Clock, CalendarDays, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CheckInData {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  status: string;
  checkedIn: boolean;
  isExpired: boolean;
}

const CheckIn = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CheckInData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCheckIn = async () => {
      if (!token) {
        setError("Invalid check-in link.");
        setLoading(false);
        return;
      }

      try {
        const { data: guest, error: guestError } = await supabase
          .from("event_guests")
          .select("name, email, status, checked_in, event_id")
          .eq("check_in_token", token)
          .single();

        if (guestError || !guest) {
          setError("This check-in pass was not found. It may be invalid or expired.");
          setLoading(false);
          return;
        }

        const { data: event } = await supabase
          .from("events")
          .select("title, date, end_date, location, status")
          .eq("id", guest.event_id)
          .single();

        // QR codes stop being valid after the event end (or date + 24h grace).
        const eventEnd = event?.end_date
          ? new Date(event.end_date)
          : event?.date
          ? new Date(new Date(event.date).getTime() + 24 * 60 * 60 * 1000)
          : null;
        const isExpired = eventEnd
          ? new Date() > eventEnd || event?.status === "past" || event?.status === "rejected"
          : false;

        setData({
          guestName: guest.name || "Guest",
          guestEmail: guest.email,
          eventTitle: event?.title || "Event",
          eventDate: event?.date || "",
          eventLocation: event?.location || "",
          status: guest.status,
          checkedIn: !!guest.checked_in,
          isExpired,
        });
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckIn();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Seo title="Invalid Pass | Kulmid" description="Check-in pass not found" />
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pass Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Link to="/discover" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = data.eventDate
    ? format(new Date(data.eventDate), "EEE, MMM d, yyyy 'at' h:mm a")
    : "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Seo title={`Check-in Pass | ${data.eventTitle}`} description="Your event check-in pass" />
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-primary/10 px-6 py-4 flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">Kulmid</span>
            {data.checkedIn ? (
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">Checked In</span>
            ) : data.isExpired ? (
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">Expired</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">Valid Pass</span>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Status icon */}
            <div className="flex justify-center">
              {data.checkedIn ? (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
              ) : data.isExpired ? (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-foreground">
                {data.checkedIn ? "You're checked in!" : data.isExpired ? "Event has ended" : "Your Event Pass"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {data.checkedIn
                  ? "You've been successfully checked in to this event."
                  : data.isExpired
                  ? "This event has already taken place."
                  : "Show this pass at the door for check-in."}
              </p>
            </div>

            {/* Event info */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
              <h2 className="font-semibold text-foreground">{data.eventTitle}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{data.eventLocation}</span>
                </div>
              </div>
            </div>

            {/* Guest info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>{data.guestName} · {data.guestEmail}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 text-center">
            <Link to="/discover" className="text-sm text-primary hover:underline font-medium">
              Discover more events on Kulmid
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
