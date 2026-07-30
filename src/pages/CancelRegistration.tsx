import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Loader2, MapPin, XCircle } from "lucide-react";
import { format } from "date-fns";

interface LookupResult {
  registration: { name: string | null; email: string; status: string; cancelled_at: string | null };
  event: { id: string; title: string; date: string; location: string; slug: string | null } | null;
}

const CancelRegistration = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const call = async (action: "lookup" | "cancel") => {
    const { data: res, error: fnError } = await supabase.functions.invoke("cancel-registration", {
      body: { token, action },
    });
    if (fnError) throw new Error("We couldn't reach the server. Please try again.");
    if ((res as any)?.error) throw new Error((res as any).error);
    return res as LookupResult & { cancelled?: boolean; alreadyCancelled?: boolean };
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await call("lookup");
        if (!active) return;
        setData(res);
        if (res.registration.status === "cancelled") setDone(true);
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCancel = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await call("cancel");
      setData(res);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <Seo title="Cancel registration" canonical={`/r/cancel/${token}`} />
      <Card className="w-full max-w-md border">
        <CardContent className="p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your registration…</p>
            </div>
          ) : error && !data ? (
            <div className="text-center space-y-4">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <div>
                <h1 className="text-lg font-semibold">Link no longer valid</h1>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/discover">Browse events</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <div>
                <h1 className="text-lg font-semibold">Registration cancelled</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  You're no longer registered for{" "}
                  <span className="font-medium text-foreground">{data?.event?.title}</span>. Your spot has been
                  released to the waitlist.
                </p>
              </div>
              {data?.event && (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/event/${data.event.slug || data.event.id}`}>Register again</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-semibold">Cancel your registration?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  This frees up your spot for the next person waiting.
                </p>
              </div>

              {data?.event && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <p className="font-medium text-sm">{data.event.title}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(data.event.date), "EEE, MMM d, yyyy · h:mm a")}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {data.event.location}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Registered as {data?.registration.name || data?.registration.email}
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={data?.event ? `/event/${data.event.slug || data.event.id}` : "/discover"}>
                    Keep my spot
                  </Link>
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cancel registration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelRegistration;