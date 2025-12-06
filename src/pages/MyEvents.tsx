import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingActions } from "@/contexts/PendingActionsContext";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventForm } from "@/components/admin/EventForm";
import { Calendar, MapPin, Globe, DollarSign, Pencil, Trash2, Plus, AlertCircle, Users, Clock } from "lucide-react";
import { format } from "date-fns";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  meeting_link: string | null;
  event_type: string | null;
  category: string;
  price: number;
  image_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

const MyEvents = () => {
  const { user, loading: authLoading } = useAuth();
  const { getPendingCountForEvent } = usePendingActions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    } else if (!authLoading) {
      navigate("/signin");
    }
  }, [user, authLoading]);

  const fetchMyEvents = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your events",
        variant: "destructive",
      });
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('created_by', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully.",
      });
      fetchMyEvents();
    }
    setDeleteId(null);
  };

  const handleResubmit = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .update({ 
        status: 'pending',
        rejection_reason: null 
      })
      .eq('id', eventId)
      .eq('created_by', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Resubmitted",
        description: "Your event has been resubmitted for approval.",
      });
      fetchMyEvents();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pending Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      upcoming: { variant: "default", label: "Live" },
      ongoing: { variant: "default", label: "Ongoing" },
      past: { variant: "outline", label: "Past" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredEvents = events.filter(event => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return event.status === "pending";
    if (activeTab === "approved") return ["approved", "upcoming", "ongoing"].includes(event.status);
    if (activeTab === "rejected") return event.status === "rejected";
    if (activeTab === "past") return event.status === "past";
    return true;
  });

  const getCounts = () => ({
    all: events.length,
    draft: events.filter(e => e.status === "draft").length,
    pending: events.filter(e => e.status === "pending").length,
    approved: events.filter(e => ["approved", "upcoming", "ongoing"].includes(e.status)).length,
    rejected: events.filter(e => e.status === "rejected").length,
    past: events.filter(e => e.status === "past").length,
  });

  const counts = getCounts();

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="My Events" description="Manage your submitted events" canonical="/my-events" />
      
      <div className="container max-w-6xl py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground">
              Manage and track your event submissions
            </p>
          </div>
          <Button onClick={() => navigate("/create")} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Live ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="past">Past ({counts.past})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading your events...</div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    {activeTab === "all" 
                      ? "Create your first event to get started"
                      : `No ${activeTab} events found`
                    }
                  </p>
                  <Button onClick={() => navigate("/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    {event.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                          {getPendingCountForEvent(event.id) > 0 && (
                            <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[10px] h-5 px-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getPendingCountForEvent(event.id)} pending
                            </Badge>
                          )}
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), "PPP 'at' p")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      {event.meeting_link && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          Online Event
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {event.price === 0 ? "Free" : `$${event.price}`}
                      </div>
                      
                      {event.status === "rejected" && event.rejection_reason && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                              <p className="text-sm text-destructive/80 mt-1">{event.rejection_reason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t pt-4">
                      {event.status === "draft" && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/event/${event.id}/builder`)}
                          >
                            Continue Building
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => setDeleteId(event.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                      {(event.status === "approved" || event.status === "upcoming" || event.status === "ongoing") && (
                        <Button 
                          variant="default" 
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/event/${event.id}/builder`)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Manage Event & Guests
                        </Button>
                      )}
                      {event.status === "pending" && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/event/${event.id}/builder`)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Manage Event & Guests
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDeleteId(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {event.status === "rejected" && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/event/${event.id}/builder`)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Manage Event & Guests
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleResubmit(event.id)}
                          >
                            Resubmit for Approval
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDeleteId(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {["approved", "upcoming", "ongoing"].includes(event.status) && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate(`/event/${event.id}`)}
                        >
                          View Event
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <EventForm
              event={editingEvent}
              onSuccess={() => {
                setEditingEvent(null);
                fetchMyEvents();
              }}
              onCancel={() => setEditingEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default MyEvents;
