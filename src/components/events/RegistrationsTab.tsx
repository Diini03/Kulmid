import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, User, Mail, Phone, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { sendRegistrationEmail, generateCheckInToken, isEmailJSConfigured } from "@/lib/emailjs";

interface RegistrationsTabProps {
  eventId: string;
}

const RegistrationsTab = ({ eventId }: RegistrationsTabProps) => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "registered" | "rejected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
    fetchEventSettings();
  }, [eventId]);

  const fetchEventSettings = async () => {
    const { data } = await supabase
      .from("events")
      .select("auto_approve_registrations")
      .eq("id", eventId)
      .single();

    if (data) {
      setAutoApprove(data.auto_approve_registrations || false);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", eventId)
      .eq("registration_type", "registration")
      .order("created_at", { ascending: false });

    if (data) setRegistrations(data);
    setLoading(false);
  };

  const handleAutoApproveToggle = async (checked: boolean) => {
    const { error } = await supabase
      .from("events")
      .update({ auto_approve_registrations: checked })
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update auto-approve setting",
        variant: "destructive",
      });
      return;
    }

    setAutoApprove(checked);
    toast({
      title: checked ? "Auto-approve enabled" : "Auto-approve disabled",
      description: checked
        ? "New registrations will be automatically approved"
        : "New registrations will require manual approval",
    });
  };

  const handleApprove = async (ids: string[]) => {
    try {
      for (const id of ids) {
        // Get guest and event details
        const { data: guest } = await supabase
          .from("event_guests")
          .select("*, events:event_id(title, date, location)")
          .eq("id", id)
          .single();

        if (!guest) continue;

        // Generate check-in token
        const checkInToken = generateCheckInToken();

        // Update guest status and token
        const { error } = await supabase
          .from("event_guests")
          .update({
            status: "registered",
            check_in_token: checkInToken,
            rsvp_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;

        // Send approval email via EmailJS
        if (isEmailJSConfigured() && guest.email) {
          const event = guest.events as any;
          await sendRegistrationEmail({
            toEmail: guest.email,
            toName: guest.name || "Guest",
            eventTitle: event?.title || "",
            eventDate: event?.date ? new Date(event.date).toLocaleString() : "",
            eventLocation: event?.location || "",
            status: "registered",
            eventId: guest.event_id,
          });
        }
      }

      toast({
        title: "✅ Approved",
        description: `${ids.length} registration(s) approved successfully`,
      });

      fetchRegistrations();
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve registration",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (ids: string[]) => {
    try {
      for (const id of ids) {
        // Get guest and event details
        const { data: guest } = await supabase
          .from("event_guests")
          .select("*, events:event_id(title, date, location)")
          .eq("id", id)
          .single();

        if (!guest) continue;

        // Update guest status
        const { error } = await supabase
          .from("event_guests")
          .update({ status: "rejected" })
          .eq("id", id);

        if (error) throw error;

        // Send rejection email via EmailJS
        if (isEmailJSConfigured() && guest.email) {
          const event = guest.events as any;
          await sendRegistrationEmail({
            toEmail: guest.email,
            toName: guest.name || "Guest",
            eventTitle: event?.title || "",
            eventDate: event?.date ? new Date(event.date).toLocaleString() : "",
            eventLocation: event?.location || "",
            status: "rejected",
            eventId: guest.event_id,
          });
        }
      }

      toast({
        title: "Registration Rejected",
        description: `${ids.length} registration(s) rejected`,
      });

      fetchRegistrations();
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject registration",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    for (const id of ids) {
      if (action === "approve") {
        await handleApprove([id]);
      } else {
        await handleReject([id]);
      }
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRegistrations.map((r) => r.id)));
    }
  };

  const filteredRegistrations =
    filterStatus === "all"
      ? registrations
      : registrations.filter((r) => r.status === filterStatus);

  const stats = {
    pending: registrations.filter((r) => r.status === "pending").length,
    registered: registrations.filter((r) => r.status === "registered").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registered":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading registrations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.registered}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Approve Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approve" className="text-base">
                Auto-approve registrations
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve future registrations without manual review
              </p>
            </div>
            <Switch
              id="auto-approve"
              checked={autoApprove}
              onCheckedChange={handleAutoApproveToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => setFilterStatus("all")}
        >
          All ({registrations.length})
        </Button>
        <Button
          variant={filterStatus === "pending" ? "default" : "outline"}
          onClick={() => setFilterStatus("pending")}
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={filterStatus === "registered" ? "default" : "outline"}
          onClick={() => setFilterStatus("registered")}
        >
          Approved ({stats.registered})
        </Button>
        <Button
          variant={filterStatus === "rejected" ? "default" : "outline"}
          onClick={() => setFilterStatus("rejected")}
        >
          Rejected ({stats.rejected})
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkAction("approve")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("reject")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registrations ({filteredRegistrations.length})</CardTitle>
            {filteredRegistrations.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                <Checkbox checked={selectedIds.size === filteredRegistrations.length} className="mr-2" />
                Select All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No registrations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((registration) => (
                <Collapsible key={registration.id}>
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.has(registration.id)}
                        onCheckedChange={() => toggleSelection(registration.id)}
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{registration.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {registration.email}
                              </span>
                              {registration.phone_number && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {registration.phone_number}
                                </span>
                              )}
                            </div>
                            {(registration.organization || registration.job_title) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                {registration.organization && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {registration.organization}
                                  </span>
                                )}
                                {registration.job_title && (
                                  <span>• {registration.job_title}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(registration.status)}
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedId(expandedId === registration.id ? null : registration.id)
                                }
                              >
                                {expandedId === registration.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        {registration.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove([registration.id])}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject([registration.id])}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <CollapsibleContent className="pt-4 mt-4 border-t">
                      <div className="space-y-3 text-sm">
                        {registration.degree && (
                          <div>
                            <span className="font-medium">Education:</span>
                            <p className="text-muted-foreground">{registration.degree}</p>
                          </div>
                        )}
                        {registration.why_interested && (
                          <div>
                            <span className="font-medium">Why interested:</span>
                            <p className="text-muted-foreground">{registration.why_interested}</p>
                          </div>
                        )}
                        {registration.what_to_gain && (
                          <div>
                            <span className="font-medium">What to gain:</span>
                            <p className="text-muted-foreground">{registration.what_to_gain}</p>
                          </div>
                        )}
                        {registration.heard_from && (
                          <div>
                            <span className="font-medium">Heard from:</span>
                            <p className="text-muted-foreground">{registration.heard_from}</p>
                          </div>
                        )}
                        {registration.questions && (
                          <div>
                            <span className="font-medium">Questions:</span>
                            <p className="text-muted-foreground">{registration.questions}</p>
                          </div>
                        )}
                        {registration.dietary_restrictions && (
                          <div>
                            <span className="font-medium">Dietary restrictions:</span>
                            <p className="text-muted-foreground">{registration.dietary_restrictions}</p>
                          </div>
                        )}
                        {registration.special_requirements && (
                          <div>
                            <span className="font-medium">Special requirements:</span>
                            <p className="text-muted-foreground">{registration.special_requirements}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground pt-2">
                          Registered: {new Date(registration.created_at).toLocaleString()}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationsTab;
