import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface EventBuilderOverviewProps {
  event: any;
  onRefresh: () => void;
}

const EventBuilderOverview = ({ event }: EventBuilderOverviewProps) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default EventBuilderOverview;
