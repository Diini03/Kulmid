import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, QrCode, Users, CheckCircle2, Clock, Download, ChevronDown } from "lucide-react";
import InviteGuestsDialog from "./InviteGuestsDialog";
import { Badge } from "@/components/ui/badge";
import RegistrationsTab from "./RegistrationsTab";
import CheckInScannerDialog from "./CheckInScannerDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { exportRegistrationsToCsv } from "@/lib/exportRegistrations";
import { toast } from "@/hooks/use-toast";

interface EventBuilderGuestsProps {
  eventId: string;
}

const EventBuilderGuests = ({ eventId }: EventBuilderGuestsProps) => {
  const [guests, setGuests] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showScannerDialog, setShowScannerDialog] = useState(false);
  const [totalStats, setTotalStats] = useState({ total: 0, registered: 0, checkedIn: 0, pending: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchGuests();
    fetchInvitations();
    fetchTotalStats();
  }, [eventId]);

  const fetchGuests = async () => {
    const { data } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", eventId)
      .or("registration_type.eq.invitation,registration_type.is.null")
      .order("created_at", { ascending: false });

    if (data) setGuests(data);
  };

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from("event_invitations")
      .select("*")
      .eq("event_id", eventId)
      .order("sent_at", { ascending: false });

    if (data) setInvitations(data);
  };

  const fetchTotalStats = async () => {
    const { data } = await supabase
      .from("event_guests")
      .select("status, checked_in")
      .eq("event_id", eventId);

    if (data) {
      setTotalStats({
        total: data.length,
        registered: data.filter(g => g.status === "registered" || g.status === "confirmed").length,
        checkedIn: data.filter(g => g.checked_in).length,
        pending: data.filter(g => g.status === "pending").length,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "declined":
        return "destructive" as const;
      case "invited":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [eventRes, qRes, gRes] = await Promise.all([
        supabase.from("events").select("title").eq("id", eventId).maybeSingle(),
        supabase
          .from("event_registration_questions")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order"),
        supabase
          .from("event_guests")
          .select("id,name,email,phone_number,organization,status,checked_in,created_at")
          .eq("event_id", eventId)
          .eq("registration_type", "registration")
          .order("created_at", { ascending: false }),
      ]);

      const gs = (gRes.data || []) as any[];
      const qs = (qRes.data || []) as any[];
      let answers: any[] = [];
      if (gs.length > 0) {
        const ids = gs.map((g) => g.id);
        for (let i = 0; i < ids.length; i += 200) {
          const { data } = await supabase
            .from("event_registration_answers")
            .select("*")
            .in("registration_id", ids.slice(i, i + 200));
          if (data) answers.push(...data);
        }
      }
      exportRegistrationsToCsv(eventRes.data?.title || "event", gs, qs, answers);
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold leading-none">{totalStats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Guests</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-lg font-bold leading-none">{totalStats.registered}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Registered</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
          <QrCode className="h-4 w-4 text-primary" />
          <div>
            <p className="text-lg font-bold leading-none">{totalStats.checkedIn}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Checked In</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
          <Clock className="h-4 w-4 text-yellow-600" />
          <div>
            <p className="text-lg font-bold leading-none">{totalStats.pending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setShowScannerDialog(true)} variant="default">
          <QrCode className="h-4 w-4 mr-2" />
          Open Scanner
        </Button>
        <Button onClick={() => setShowInviteDialog(true)} variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Invite Guests
        </Button>
        <Button onClick={handleExport} variant="outline" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Main: registrations directly */}
      <RegistrationsTab eventId={eventId} />

      {/* Invitation log (collapsed) */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ChevronDown className="h-4 w-4 mr-1" />
            View invitation log ({invitations.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="border-border/60 mt-3">
            <CardHeader>
              <CardTitle className="text-base">Invited Guests ({guests.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invited guests yet.</p>
              ) : (
                <div className="space-y-2">
                  {guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 border border-border/60 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                          {(guest.name || guest.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{guest.name || guest.email}</p>
                          {guest.name && <p className="text-xs text-muted-foreground truncate">{guest.email}</p>}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(guest.status)}>{guest.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {invitations.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Invitation history</p>
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 border border-border/60 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(invitation.sent_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{invitation.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <InviteGuestsDialog
        eventId={eventId}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={() => {
          fetchGuests();
          fetchInvitations();
        }}
      />

      <CheckInScannerDialog
        eventId={eventId}
        open={showScannerDialog}
        onOpenChange={(open) => {
          setShowScannerDialog(open);
          if (!open) fetchTotalStats();
        }}
      />
    </div>
  );
};

export default EventBuilderGuests;
