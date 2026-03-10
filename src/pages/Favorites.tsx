import { Seo } from "@/components/Seo";
import { EventCard } from "@/components/events/EventCard";
import { useFavorites } from "@/contexts/FavoritesContext";
import { EmptyState } from "@/components/common/EmptyState";
import { Heart } from "lucide-react";

const Favorites = () => {
  const { favorites } = useFavorites();

  return (
    <>
      <Seo title="My Favorites" description="Your favorite events in one place" canonical="/favorites" />
      
      <section className="container max-w-5xl px-4 py-16">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-3 text-primary mb-2">
            <Heart className="h-7 w-7 fill-current" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">My Favorites</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Keep track of events you love and never miss out
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {favorites.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Start exploring events and add them to your favorites by clicking the heart icon!"
            actionLabel="Browse Events"
            actionLink="/events"
          />
        )}
      </section>
    </>
  );
};

export default Favorites;