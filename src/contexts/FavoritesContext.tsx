import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { EventItem } from '@/data/events';
import { useAuth } from '@/contexts/AuthContext';
import { AuthRequiredModal } from '@/components/auth/AuthGuard';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { events } from '@/data/events';

interface FavoritesContextType {
  favorites: EventItem[];
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

  // Close auth modal when location changes (user navigates to sign in/up pages)
  useEffect(() => {
    if (showAuthModal && (location.pathname === '/signin' || location.pathname === '/signup')) {
      setShowAuthModal(false);
    }
  }, [location.pathname, showAuthModal]);

  // Load user favorites from database when user logs in, clear when logs out
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const loadUserFavorites = async () => {
      try {
        const { data: favoriteIds, error } = await supabase
          .from('user_favorites')
          .select('event_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading favorites:', error);
          return;
        }

        // Map favorite event IDs to actual event objects
        const favoriteEvents = favoriteIds
          .map(fav => events.find(event => event.id === fav.event_id))
          .filter(Boolean) as EventItem[];

        setFavorites(favoriteEvents);
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

    try {
      // Add to database
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          event_id: event.id
        });

      if (error) {
        console.error('Error adding to favorites:', error);
        return;
      }

      // Update local state
      setFavorites(prev => {
        const filtered = prev.filter(fav => fav.id !== event.id);
        return [...filtered, event];
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (eventId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Remove from database
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error removing from favorites:', error);
        return;
      }

      // Update local state
      setFavorites(prev => prev.filter(fav => fav.id !== eventId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (eventId: string) => {
    return favorites.some(fav => fav.id === eventId);
  };

  const value: FavoritesContextType = {
    favorites,
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