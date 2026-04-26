import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, User, Mail, Phone, Building2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Eye } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Skeleton } from "@/components/ui/skeleton";
import { useProcessingSet } from "@/hooks/useAsyncAction";
import RegistrationResponseDialog from "./RegistrationResponseDialog";

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
  const { isProcessing, startProcessing, stopProcessing } = useProcessingSet();
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [viewerGuestId, setViewerGuestId] = useState<string | null>(null);

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
    const processingBatch = ids.filter(id => !isProcessing(id));
    if (processingBatch.length === 0) return;
    
    processingBatch.forEach(startProcessing);

    try {
      for (const id of processingBatch) {
        const { data, error } = await supabase.functions.invoke('handle-registration-action', {
          body: { guestId: id, action: 'approve' },
        });

        if (error) throw error;

        // Update local state immediately
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: "registered" } : r));
      }

      toast({
        title: "✅ Approved",
        description: `${processingBatch.length} registration(s) approved successfully`,
      });

      setSelectedIds(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve registration",
        variant: "destructive",
      });
    } finally {
      processingBatch.forEach(stopProcessing);
    }
  };

  const handleReject = async (ids: string[]) => {
    const processingBatch = ids.filter(id => !isProcessing(id));
    if (processingBatch.length === 0) return;
    
    processingBatch.forEach(startProcessing);

    try {
      for (const id of processingBatch) {
        const { data, error } = await supabase.functions.invoke('handle-registration-action', {
          body: { guestId: id, action: 'reject' },
        });

        if (error) throw error;

        // Update local state immediately
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      }

      toast({
        title: "Registration Rejected",
        description: `${processingBatch.length} registration(s) rejected`,
      });

      setSelectedIds(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject registration",
        variant: "destructive",
      });
    } finally {
      processingBatch.forEach(stopProcessing);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkProcessing(true);

    if (action === "approve") {
      await handleApprove(ids);
    } else {
      await handleReject(ids);
    }
    setBulkProcessing(false);
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
        return <Badge variant="success">Approved</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                  <Skeleton className="h-8 w-12 mx-auto" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
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
        <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
          All ({registrations.length})
        </Button>
        <Button variant={filterStatus === "pending" ? "default" : "outline"} onClick={() => setFilterStatus("pending")}>
          Pending ({stats.pending})
        </Button>
        <Button variant={filterStatus === "registered" ? "default" : "outline"} onClick={() => setFilterStatus("registered")}>
          Approved ({stats.registered})
        </Button>
        <Button variant={filterStatus === "rejected" ? "default" : "outline"} onClick={() => setFilterStatus("rejected")}>
          Rejected ({stats.rejected})
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{selectedIds.size} selected</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkAction("approve")}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("reject")}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              {filteredRegistrations.map((registration) => {
                const rowProcessing = isProcessing(registration.id);
                return (
                  <Collapsible key={registration.id}>
                    <div className={`border border-border rounded-lg p-4 ${rowProcessing ? 'opacity-70' : ''}`}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Checkbox
                          checked={selectedIds.has(registration.id)}
                          onCheckedChange={() => toggleSelection(registration.id)}
                          disabled={rowProcessing}
                        />
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold break-words">{registration.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex min-w-0 items-start gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="break-all">{registration.email}</span>
                                </span>
                                {registration.phone_number && (
                                  <span className="flex min-w-0 items-start gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span className="break-all">{registration.phone_number}</span>
                                  </span>
                                )}
                              </div>
                              {(registration.organization || registration.job_title) && (
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  {registration.organization && (
                                    <span className="flex min-w-0 items-start gap-1">
                                      <Building2 className="h-3 w-3" />
                                      <span className="break-words">{registration.organization}</span>
                                    </span>
                                  )}
                                  {registration.job_title && (
                                    <span className="break-words">• {registration.job_title}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
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
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove([registration.id])}
                                disabled={rowProcessing}
                              >
                                {rowProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject([registration.id])}
                                disabled={rowProcessing}
                              >
                                {rowProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewerGuestId(registration.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View full response
                              </Button>
                            </div>
                          )}
                          {registration.status !== "pending" && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewerGuestId(registration.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View full response
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
                          {registration.about && (
                            <div>
                              <span className="font-medium">About:</span>
                              <p className="text-muted-foreground">{registration.about}</p>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <RegistrationResponseDialog
        guestId={viewerGuestId}
        eventId={eventId}
        open={viewerGuestId !== null}
        onOpenChange={(open) => {
          if (!open) setViewerGuestId(null);
        }}
      />
    </div>
  );
};

export default RegistrationsTab;
