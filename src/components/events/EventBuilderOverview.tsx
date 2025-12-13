import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Link as LinkIcon, ExternalLink, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AttendancePrediction } from "./AttendancePrediction";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
interface EventBuilderOverviewProps {
  event: any;
  onRefresh: () => void;
}

const EventBuilderOverview = ({ event }: EventBuilderOverviewProps) => {
  // Fetch registration count
  const [registrationCount, setRegistrationCount] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `${window.location.origin}/events/${event.id}`;
  const shortUrl = `${window.location.origin}/e/${event.id}`;

  useEffect(() => {
    const fetchRegistrationCount = async () => {
      const { count } = await supabase
        .from('event_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id);
      
      setRegistrationCount(count || 0);
    };

    fetchRegistrationCount();
  }, [event.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Event link has been copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">View & Share Your Event</h3>
              <p className="text-sm text-muted-foreground">
                Preview your event page and share the link with others
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button asChild variant="default" className="flex-1 sm:flex-none">
                <Link to={`/events/${event.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Event Page
                </Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {linkCopied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Share URL:</span>
            <code className="px-2 py-1 bg-muted rounded">{shortUrl}</code>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Preview Card */}
        <Card>
        <CardHeader>
          <CardTitle>Event Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          
          <div>
            <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
            <Badge variant="secondary">{event.category}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.date), "PPP 'at' p")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {event.event_type === "online" || event.event_type === "hybrid" ? (
                <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              ) : (
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {event.location || event.meeting_link || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {event.description && (
            <div>
              <p className="text-sm font-medium mb-2">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Event Details</p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize">{event.event_type || "In-person"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span>{event.price === 0 ? "Free" : `$${event.price}`}</span>
              </div>
              {event.host_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span>{event.host_name}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Attendance Prediction Card */}
        <AttendancePrediction 
          eventId={event.id}
          registrationCount={registrationCount}
          event={event}
        />
      </div>
    </div>
  );
};

export default EventBuilderOverview;
