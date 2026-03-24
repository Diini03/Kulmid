import { CalendarDays, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
  status?: string;
  description?: string | null;
};

interface Props {
  event: EventItem;
  basePath?: string;
}

export const EventCard = ({ event, basePath = "/events" }: Props) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { t } = useLanguage();
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
    navigate(`${basePath}/${event.id}`);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthAction("register for this event");
      setShowAuthModal(true);
    } else {
      navigate(`${basePath}/${event.id}`);
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
        className="overflow-hidden border border-border/50 bg-card shadow-sm cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <img
            src={event.image_url || '/placeholder.svg'}
            alt={`${event.title} event image`}
            loading="lazy"
            className="h-48 w-full object-cover"
          />
          
          {/* Category Badge */}
          <div className="absolute left-3 top-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground text-xs">
              {event.category}
            </Badge>
          </div>
          
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className="absolute right-3 top-3 p-2 rounded-full bg-background/90 border cursor-pointer"
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={`h-4 w-4 ${
                isLiked 
                  ? 'fill-rose-500 text-rose-500' 
                  : 'text-muted-foreground'
              }`} 
            />
          </button>

          {/* Price Tag */}
          <div className="absolute bottom-3 right-3">
            {event.price === 0 ? (
              <Badge className="bg-foreground text-background text-xs px-3 py-1">
                Free
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-background text-foreground text-xs px-3 py-1">
                ${event.price}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-base font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
            {event.title}
          </h3>

          {/* Meta Info */}
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* CTA */}
          <Button 
            size="default"
            variant="default"
            onClick={handleBookClick}
            className="w-full mt-2"
          >
            Register
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
