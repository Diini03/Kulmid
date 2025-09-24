import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { EventItem } from '@/data/events';

interface FavoritesContextType {
  favorites: EventItem[];
  addToFavorites: (event: EventItem) => void;
  removeFromFavorites: (eventId: string) => void;
  isFavorite: (eventId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<EventItem[]>([]);

  const addToFavorites = (event: EventItem) => {
    setFavorites(prev => [...prev.filter(fav => fav.id !== event.id), event]);
  };

  const removeFromFavorites = (eventId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== eventId));
  };

  const isFavorite = (eventId: string) => {
    return favorites.some(fav => fav.id === eventId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};