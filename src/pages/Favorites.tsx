import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { EventCard } from "@/components/events/EventCard";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Favorites = () => {
  const { favorites } = useFavorites();

  return (
    <Layout>
      <Seo title="My Favorites" description="Your favorite events in one place" canonical="/favorites" />
      
      <section className="container py-12">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 text-primary">
            <Heart className="h-6 w-6 fill-current" />
            <h1 className="text-4xl md:text-5xl font-bold">My Favorites</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Keep track of events you love and never miss out
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center space-y-6 py-20">
            <div className="text-6xl text-muted-foreground">💝</div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">No favorites yet</h2>
              <p className="text-muted-foreground">
                Start exploring events and add them to your favorites!
              </p>
            </div>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Favorites;