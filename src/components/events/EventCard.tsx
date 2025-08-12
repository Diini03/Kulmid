import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/data/events";
import { Link } from "react-router-dom";

interface Props {
  event: EventItem;
  onQuickView?: (event: EventItem) => void;
}

export const EventCard = ({ event, onQuickView }: Props) => {
  return (
    <Card className="group overflow-hidden border-muted/60 hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img
          src={event.image}
          alt={`${event.title} event image`}
          loading="lazy"
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge variant="secondary" className="backdrop-blur-sm">
            {event.category}
          </Badge>
          <Badge className="bg-primary text-primary-foreground shadow">${"$"}
            {event.price}
          </Badge>
        </div>
      </div>
      <CardHeader className="space-y-2">
        <Link to={`/events/${event.id}`} className="story-link text-lg font-semibold">
          {event.title}
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground gap-3">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(event.date).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(event);
            }}
          >
            Quick View
          </Button>
          <Button asChild size="sm">
            <Link to={`/events/${event.id}`} className="inline-flex items-center"><Ticket className="mr-2 h-4 w-4"/> Book</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
