import { CalendarDays, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
        className="group overflow-hidden card-interactive border-border/50 bg-card hover:border-primary/20"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <img
            src={event.image_url || '/placeholder.svg'}
            alt={`${event.title} event image`}
            loading="lazy"
            className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Badge */}
          <div className="absolute left-4 top-4">
            <Badge variant="glass" className="backdrop-blur-md bg-background/80 border-border/50">
              {event.category}
            </Badge>
          </div>
          
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className="absolute right-4 top-4 p-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 hover:bg-background hover:scale-110 transition-all duration-300 group/fav"
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={`h-4 w-4 transition-all duration-300 ${
                isLiked 
                  ? 'fill-rose-500 text-rose-500 scale-110' 
                  : 'text-muted-foreground group-hover/fav:text-rose-500'
              }`} 
            />
          </button>

          {/* Price Tag */}
          <div className="absolute bottom-4 right-4">
            {event.price === 0 ? (
              <Badge variant="gradient" className="text-sm px-4 py-1.5 shadow-lg">
                Free
              </Badge>
            ) : (
              <Badge variant="default" className="text-sm px-4 py-1.5 bg-background text-foreground shadow-lg">
                ${event.price}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Title */}
          <h3 className="text-lg font-bold leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors duration-300">
            {event.title}
          </h3>

          {/* Meta Info */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* CTA */}
          <Button 
            size="default"
            variant="gradient"
            onClick={handleBookClick}
            className="w-full mt-2"
          >
            Register Now
          </Button>
        </CardContent>
      </Card>
    </>
  );
};