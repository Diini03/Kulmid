import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventBuilderOverview from "@/components/events/EventBuilderOverview";
import EventBuilderEdit from "@/components/events/EventBuilderEdit";
import EventBuilderGuests from "@/components/events/EventBuilderGuests";
import EventBuilderSettings from "@/components/events/EventBuilderSettings";
import { Seo } from "@/components/Seo";

const EventBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }
    fetchEvent();
  }, [id, user]);

  const fetchEvent = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Event not found.",
        variant: "destructive",
      });
      navigate("/my-events");
      return;
    }

    // Check if user owns this event
    if (data.created_by !== user?.id) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage this event.",
        variant: "destructive",
      });
      navigate("/my-events");
      return;
    }

    setEvent(data);
    setLoading(false);
  };

  const handleSubmitForReview = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("events")
      .update({ status: "pending" })
      .eq("id", id)
      .eq("created_by", user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit for review.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Submitted for Review",
      description: "Your event has been submitted and is pending admin approval.",
    });

    navigate("/my-events");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <>
      <Seo
        title={`Edit ${event.title} - EventEase`}
        description="Build and manage your event"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/my-events">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{event.status}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {event.status === "draft" && (
                  <Button onClick={handleSubmitForReview} variant="default">
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="guests">Guests</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <EventBuilderOverview event={event} onRefresh={fetchEvent} />
            </TabsContent>

            <TabsContent value="edit" className="mt-6">
              <EventBuilderEdit event={event} onUpdate={fetchEvent} />
            </TabsContent>

            <TabsContent value="guests" className="mt-6">
              <EventBuilderGuests eventId={event.id} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <EventBuilderSettings event={event} onUpdate={fetchEvent} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default EventBuilder;
