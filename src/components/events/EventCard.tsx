import { CalendarDays, MapPin, Ticket, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { AuthRequiredModal } from "@/components/auth/AuthGuard";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLiked = isFavorite(event.id);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState("");

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setAuthAction("add to favorites");
      setShowAuthModal(true);
      return;
    }
    
    if (isLiked) {
      removeFromFavorites(event.id);
    } else {
      addToFavorites(event);
    }
  };

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthAction("register for this event");
      setShowAuthModal(true);
    } else {
      navigate(`/events/${event.id}`);
    }
  };

  // Memoize formatted date for better performance
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <>
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        action={authAction}
      />
      <Card 
        className="group overflow-hidden border hover-lift card-interactive"
        onClick={handleCardClick}
      >
        <div className="relative">
          <img
            src={event.image_url || '/placeholder.svg'}
            alt={`${event.title} event image`}
            loading="lazy"
            className="h-56 w-full object-cover"
          />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm border">
              {event.category}
            </Badge>
          </div>
          <button
            onClick={toggleFavorite}
            className="absolute right-4 top-4 p-2 rounded-full bg-background/90 backdrop-blur-sm border hover:bg-background transition-colors"
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={`h-4 w-4 transition-all ${
                isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground'
              }`} 
            />
          </button>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            {event.price === 0 ? (
              <span className="text-sm font-medium tracking-wide text-primary/90 bg-primary/10 px-2 py-0.5 rounded">
                Free
              </span>
            ) : (
              <div className="text-lg font-bold">${event.price}</div>
            )}
            <Button 
              size="sm" 
              onClick={handleBookClick}
              className="shadow-sm"
            >
              Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
