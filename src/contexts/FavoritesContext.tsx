import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { EventItem } from '@/data/events';
import { useAuth } from '@/contexts/AuthContext';
import { AuthRequiredModal } from '@/components/auth/AuthGuard';
import { useLocation } from 'react-router-dom';

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

  const addToFavorites = (event: EventItem) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setFavorites(prev => {
      const filtered = prev.filter(fav => fav.id !== event.id);
      return [...filtered, event];
    });
  };

  const removeFromFavorites = (eventId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setFavorites(prev => prev.filter(fav => fav.id !== eventId));
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