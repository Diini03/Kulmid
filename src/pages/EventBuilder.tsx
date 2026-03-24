import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import EventBuilderOverview from "@/components/events/EventBuilderOverview";
import EventBuilderEdit from "@/components/events/EventBuilderEdit";
import EventBuilderGuests from "@/components/events/EventBuilderGuests";
import EventBuilderRegistration from "@/components/events/EventBuilderRegistration";
import EventBuilderSettings from "@/components/events/EventBuilderSettings";
import { ChevronRight, ExternalLink, ArrowLeft } from "lucide-react";

const EventBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id && user) {
      fetchEvent();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (error || !data) {
      navigate("/events");
      return;
    }

    setEvent(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Event not found</h2>
            <Button asChild variant="outline">
              <Link to="/events">Back to Events</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title={`Manage: ${event.title}`} description={`Manage ${event.title} on Kulmid`} />
      
      <div className="container max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link 
            to="/events" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Events
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{event.title}</h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {event.status === "upcoming" || event.status === "approved" ? "Live" : event.status}
            </p>
          </div>
          
          {/* Event Page Link */}
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="flex-shrink-0"
          >
            <Link to={`/events/${event.id}`} className="gap-2">
              Event Page
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 overflow-x-auto scrollbar-hide flex-nowrap">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="guests"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
            >
              Guests
            </TabsTrigger>
            <TabsTrigger 
              value="registration"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
            >
              Registration
            </TabsTrigger>
            <TabsTrigger 
              value="edit"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
            >
              Edit
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <EventBuilderOverview event={event} onRefresh={fetchEvent} />
          </TabsContent>

          <TabsContent value="guests" className="mt-6">
            <EventBuilderGuests eventId={event.id} />
          </TabsContent>

          <TabsContent value="registration" className="mt-6">
            <EventBuilderRegistration eventId={event.id} />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <EventBuilderEdit event={event} onUpdate={fetchEvent} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <EventBuilderSettings event={event} onUpdate={fetchEvent} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default EventBuilder;
