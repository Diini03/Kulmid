import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePendingActions } from "@/contexts/PendingActionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, UserPlus, QrCode, Users, CheckCircle2, Clock } from "lucide-react";
import InviteGuestsDialog from "./InviteGuestsDialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationsTab from "./RegistrationsTab";
import CheckedInTab from "./CheckedInTab";
import CheckInScannerDialog from "./CheckInScannerDialog";

interface EventBuilderGuestsProps {
  eventId: string;
}

const EventBuilderGuests = ({ eventId }: EventBuilderGuestsProps) => {
  const [guests, setGuests] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showScannerDialog, setShowScannerDialog] = useState(false);
  const [totalStats, setTotalStats] = useState({ total: 0, registered: 0, checkedIn: 0, pending: 0 });
  const { getPendingCountForEvent } = usePendingActions();
  const pendingCount = getPendingCountForEvent(eventId);

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

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
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

      {/* QR Scanner Button */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Event Check-In</h3>
              <p className="text-sm text-muted-foreground">
                Scan QR codes at the event entrance to check in attendees
              </p>
            </div>
            <Button onClick={() => setShowScannerDialog(true)} size="lg">
              <QrCode className="h-5 w-5 mr-2" />
              Open Scanner
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={pendingCount > 0 ? "registrations" : "invitations"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="registrations" className="relative">
            Registrations
            {pendingCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-orange-500 hover:bg-orange-500 text-white text-[9px] h-4 min-w-4 px-1 flex items-center justify-center">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checked-in" className="relative">
            Checked In
            {totalStats.checkedIn > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-green-600 hover:bg-green-600 text-white text-[9px] h-4 min-w-4 px-1 flex items-center justify-center">
                {totalStats.checkedIn}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invited Guests ({guests.length})</CardTitle>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Guests
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {guests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No guests yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    Invite Your First Guest
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-4 border border-border/60 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(guest.name || guest.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{guest.name || guest.email}</p>
                          {guest.name && <p className="text-sm text-muted-foreground">{guest.email}</p>}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(guest.status)}>
                        {guest.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Invitation History ({invitations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No invitations sent yet</p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border border-border/60 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Sent {new Date(invitation.sent_at).toLocaleDateString()}
                        </p>
                        {invitation.custom_title && (
                          <p className="text-sm text-muted-foreground italic">
                            "{invitation.custom_title}"
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">{invitation.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <InviteGuestsDialog
            eventId={eventId}
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            onSuccess={() => {
              fetchGuests();
              fetchInvitations();
            }}
          />
        </TabsContent>

        <TabsContent value="registrations">
          <RegistrationsTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="checked-in">
          <CheckedInTab eventId={eventId} />
        </TabsContent>
      </Tabs>

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
