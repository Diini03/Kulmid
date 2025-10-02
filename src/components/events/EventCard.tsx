import { CalendarDays, MapPin, Ticket, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
};

interface Props {
  event: EventItem;
}

export const EventCard = ({ event }: Props) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const isLiked = isFavorite(event.id);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      removeFromFavorites(event.id);
    } else {
      addToFavorites(event);
    }
  };
  return (
    <Card className="group overflow-hidden border-muted/60 hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img
          src={event.image_url || '/placeholder.svg'}
          alt={`${event.title} event image`}
          loading="lazy"
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge variant="secondary" className="backdrop-blur-sm">
            {event.category}
          </Badge>
          <Badge className="bg-primary text-primary-foreground shadow">
            ${event.price}
          </Badge>
        </div>
        <button
          onClick={toggleFavorite}
          className="absolute right-3 top-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-muted/60 hover:bg-background transition-colors"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`} 
          />
        </button>
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
          <Button asChild variant="outline" size="sm">
            <Link to={`/events/${event.id}`}>View Details</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={`/events/${event.id}`} className="inline-flex items-center"><Ticket className="mr-2 h-4 w-4"/> Book</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
