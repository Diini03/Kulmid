import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthRequiredModal } from '@/components/auth/AuthGuard';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EventItem } from '@/types/event';
import { toast } from '@/hooks/use-toast';

interface FavoritesContextType {
  favorites: EventItem[];
  favoriteCount: number;
  addToFavorites: (event: EventItem) => void;
  removeFromFavorites: (eventId: string) => void;
  isFavorite: (eventId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<EventItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (showAuthModal && (location.pathname === '/signin' || location.pathname === '/signup')) {
      setShowAuthModal(false);
    }
  }, [location.pathname, showAuthModal]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const loadUserFavorites = async () => {
      try {
        const { data: favoriteRecords, error } = await supabase
          .from('user_favorites')
          .select('event_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading favorites:', error);
          return;
        }

        if (!favoriteRecords || favoriteRecords.length === 0) {
          setFavorites([]);
          return;
        }

        const { data: favoriteEvents, error: eventsError } = await supabase
          .from('events')
          .select('id, title, date, location, category, price, image_url, status')
          .in('id', favoriteRecords.map(f => f.event_id));

        if (eventsError) {
          console.error('Error loading favorite events:', eventsError);
          return;
        }

        setFavorites(favoriteEvents || []);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadUserFavorites();
  }, [user]);

  const addToFavorites = async (event: EventItem) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic update
    setFavorites(prev => {
      const filtered = prev.filter(fav => fav.id !== event.id);
      return [...filtered, event];
    });

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, event_id: event.id });

      if (error) {
        // Rollback on failure
        setFavorites(prev => prev.filter(fav => fav.id !== event.id));
        toast({ title: 'Error', description: 'Failed to add to favorites', variant: 'destructive' });
        return;
      }
    } catch (error) {
      setFavorites(prev => prev.filter(fav => fav.id !== event.id));
      toast({ title: 'Error', description: 'Failed to add to favorites', variant: 'destructive' });
    }
  };

  const removeFromFavorites = async (eventId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic update - save for rollback
    const previousFavorites = favorites;
    setFavorites(prev => prev.filter(fav => fav.id !== eventId));

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        // Rollback on failure
        setFavorites(previousFavorites);
        toast({ title: 'Error', description: 'Failed to remove from favorites', variant: 'destructive' });
        return;
      }
    } catch (error) {
      setFavorites(previousFavorites);
      toast({ title: 'Error', description: 'Failed to remove from favorites', variant: 'destructive' });
    }
  };

  const isFavorite = (eventId: string) => {
    return favorites.some(fav => fav.id === eventId);
  };

  const value: FavoritesContextType = {
    favorites,
    favoriteCount: favorites.length,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <AuthRequiredModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="add events to favorites"
      />
    </FavoritesContext.Provider>
  );
};
