import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertTriangle, UserPlus, Eye, Globe, Video, Link, Copy, ExternalLink, Phone, Download } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import InviteGuestsDialog from "./InviteGuestsDialog";
import { GuestExportData, generateGuestPhoneCSV, generateGuestContactsCSV } from "@/lib/csvParser";

interface EventBuilderOverviewProps {
  event: any;
  onRefresh: () => void;
}

interface GuestStats {
  total: number;
  confirmed: number;
  pending: number;
  checkedIn: number;
  withPhone: number;
}

interface RecentGuest {
  id: string;
  name: string | null;
  email: string;
  status: string;
  created_at: string;
}

const EventBuilderOverview = ({ event, onRefresh }: EventBuilderOverviewProps) => {
  const [guestStats, setGuestStats] = useState<GuestStats>({ total: 0, confirmed: 0, pending: 0, checkedIn: 0, withPhone: 0 });
  const [recentGuests, setRecentGuests] = useState<RecentGuest[]>([]);
  const [guestsForExport, setGuestsForExport] = useState<GuestExportData[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  const eventLink = `${window.location.origin}/event/${event.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "✅ Link copied!",
      description: "Event link has been copied to clipboard",
    });
  };

  useEffect(() => {
    if (event?.id) {
      fetchGuestData();
    }
  }, [event?.id]);

  const fetchGuestData = async () => {
    try {
      // Fetch all guests for stats and export
      const { data: guests, error } = await supabase
        .from("event_guests")
        .select("id, name, email, phone_number, organization, status, checked_in, created_at")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (guests) {
        setGuestStats({
          total: guests.length,
          confirmed: guests.filter(g => g.status === "confirmed").length,
          pending: guests.filter(g => g.status === "pending").length,
          checkedIn: guests.filter(g => g.checked_in).length,
          withPhone: guests.filter(g => g.phone_number).length,
        });
        setRecentGuests(guests.slice(0, 5));
        setGuestsForExport(guests);
      }
    } catch (error) {
      console.error("Error fetching guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const eventDate = parseISO(event.date);
  const isEventPast = isPast(eventDate);
  const hasLocation = event.location && event.location.trim() !== "";
  const hasMeetingLink = event.meeting_link && event.meeting_link.trim() !== "";

  const getEventTypeLabel = () => {
    if (event.event_type === "online") return "Online Event";
    if (event.event_type === "hybrid") return "Hybrid Event";
    return "In-Person Event";
  };

  const handleExportPhones = () => {
    if (guestStats.withPhone === 0) {
      toast({
        title: "No phone numbers",
        description: "No guests have phone numbers to export",
        variant: "destructive",
      });
      return;
    }
    generateGuestPhoneCSV(guestsForExport, event.title);
    toast({
      title: "✅ Download started",
      description: `Exporting ${guestStats.withPhone} phone numbers`,
    });
  };

  const handleExportAllContacts = () => {
    if (guestStats.total === 0) {
      toast({
        title: "No contacts",
        description: "No guests to export",
        variant: "destructive",
      });
      return;
    }
    generateGuestContactsCSV(guestsForExport, event.title);
    toast({
      title: "✅ Download started",
      description: `Exporting ${guestStats.total} contacts`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Event Status Banner */}
      {isEventPast && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">This event has ended</span>
          </div>
        </div>
      )}

      {event.status === "pending" && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <span className="text-sm font-medium">Your event is not yet publicly listed on Kulmid</span>
              <p className="text-sm mt-1">You can still manage registrations and share your event link with guests.</p>
            </div>
          </div>
        </div>
      )}

      {event.status === "rejected" && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <span className="text-sm font-medium">Event was rejected</span>
              {event.rejection_reason && (
                <p className="text-sm mt-1 opacity-80">{event.rejection_reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Link Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Event Link</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
            <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-mono truncate flex-1">{eventLink}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              {linkCopied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a href={eventLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Event Page
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Event Recap Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Event Details</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">{format(eventDate, "EEEE, MMMM d, yyyy")}</div>
              <div className="text-sm text-muted-foreground">{format(eventDate, "h:mm a")}</div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            {event.event_type === "online" ? (
              <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            )}
            <div>
              {hasLocation ? (
                <>
                  <div className="font-medium">{event.location}</div>
                  <div className="text-sm text-muted-foreground">{getEventTypeLabel()}</div>
                </>
              ) : hasMeetingLink ? (
                <>
                  <div className="font-medium">Online</div>
                  <a 
                    href={event.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Join meeting
                  </a>
                </>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-sm">Location not set</span>
                </div>
              )}
            </div>
          </div>

          {/* Event Type */}
          <div className="flex items-start gap-3">
            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium capitalize">{event.category}</div>
              <div className="text-sm text-muted-foreground">
                {event.price === 0 ? "Free event" : `$${event.price}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guests Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Guests</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Invite
          </Button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{guestStats.confirmed}</div>
                  <div className="text-xs text-muted-foreground">Confirmed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{guestStats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{guestStats.checkedIn}</div>
                  <div className="text-xs text-muted-foreground">Checked In</div>
                </div>
              </div>

              {/* Progress Bar */}
              {event.max_attendees && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span>{guestStats.confirmed} / {event.max_attendees}</span>
                  </div>
                  <Progress 
                    value={(guestStats.confirmed / event.max_attendees) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Recent Registrations */}
              {recentGuests.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Recent Registrations</div>
                  <div className="space-y-2">
                    {recentGuests.map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{guest.name || guest.email}</div>
                          {guest.name && (
                            <div className="text-xs text-muted-foreground truncate">{guest.email}</div>
                          )}
                        </div>
                        <Badge 
                          variant={guest.status === "confirmed" ? "default" : "secondary"}
                          className="text-xs flex-shrink-0"
                        >
                          {guest.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guestStats.total === 0 && (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No guests yet</p>
                  <Button 
                    size="sm"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-2" />
                    Invite Guests
                  </Button>
                </div>
              )}

              {/* Export Contacts Section */}
              {guestStats.total > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                    Export Contacts
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleExportPhones}
                      disabled={guestStats.withPhone === 0}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Download Phone Numbers
                      <span className="ml-auto text-xs text-muted-foreground">
                        {guestStats.withPhone} contacts
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleExportAllContacts}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All Contacts
                      <span className="ml-auto text-xs text-muted-foreground">
                        {guestStats.total} total
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Visibility Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Visibility</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {event.status === "approved" || event.status === "upcoming" || event.status === "ongoing" 
                  ? "Publicly Listed" 
                  : "Not Publicly Listed"}
              </div>
              <div className="text-sm text-muted-foreground">
                {event.status === "approved" || event.status === "upcoming" || event.status === "ongoing" 
                  ? "Your event is publicly listed on Kulmid. Anyone can find it on the Discover page."
                  : event.status === "pending"
                    ? "Your event will be publicly listed once approved by admin."
                    : "This event is not visible on the Discover page."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hosts Section */}
      {event.host_name && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Hosts</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {event.host_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium">{event.host_name}</div>
                {event.host_email && (
                  <div className="text-sm text-muted-foreground">{event.host_email}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <InviteGuestsDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen}
        eventId={event.id}
        onSuccess={fetchGuestData}
      />
    </div>
  );
};

export default EventBuilderOverview;
