import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePendingActions } from "@/contexts/PendingActionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, UserPlus, QrCode } from "lucide-react";
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
  const [checkedInCount, setCheckedInCount] = useState(0);
  const { getPendingCountForEvent } = usePendingActions();
  const pendingCount = getPendingCountForEvent(eventId);

  useEffect(() => {
    fetchGuests();
    fetchInvitations();
    fetchCheckedInCount();
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

  const fetchCheckedInCount = async () => {
    const { count } = await supabase
      .from("event_guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("checked_in", true);

    setCheckedInCount(count || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "declined":
        return "destructive";
      case "invited":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Scanner Button */}
      <Card>
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
            {checkedInCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-green-600 hover:bg-green-600 text-white text-[9px] h-4 min-w-4 px-1 flex items-center justify-center">
                {checkedInCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-6">
          <Card>
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
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{guest.name || guest.email}</p>
                        {guest.name && <p className="text-sm text-muted-foreground">{guest.email}</p>}
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

          <Card>
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
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
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
          if (!open) fetchCheckedInCount();
        }}
      />
    </div>
  );
};

export default EventBuilderGuests;
