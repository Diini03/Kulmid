import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PendingEvent {
  eventId: string;
  count: number;
}

interface PendingActionsContextType {
  totalPendingCount: number;
  eventsWithPending: PendingEvent[];
  getPendingCountForEvent: (eventId: string) => number;
  refetch: () => void;
}

const PendingActionsContext = createContext<PendingActionsContextType | undefined>(undefined);

export const usePendingActions = () => {
  const context = useContext(PendingActionsContext);
  if (!context) {
    return { totalPendingCount: 0, eventsWithPending: [], getPendingCountForEvent: () => 0, refetch: () => {} };
  }
  return context;
};

export const PendingActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [eventsWithPending, setEventsWithPending] = useState<PendingEvent[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [userEventIds, setUserEventIds] = useState<string[]>([]);

  const fetchPendingRegistrations = useCallback(async () => {
    if (!user) {
      setEventsWithPending([]);
      setTotalPendingCount(0);
      setUserEventIds([]);
      return;
    }

    const { data: userEvents, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('created_by', user.id);

    if (eventsError || !userEvents?.length) {
      setEventsWithPending([]);
      setTotalPendingCount(0);
      setUserEventIds([]);
      return;
    }

    const eventIds = userEvents.map(e => e.id);
    setUserEventIds(eventIds);

    const { data: pendingGuests, error: guestsError } = await supabase
      .from('event_guests')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'pending')
      .eq('registration_type', 'registration');

    if (guestsError) {
      console.error('Error fetching pending registrations:', guestsError);
      return;
    }

    const countsByEvent: Record<string, number> = {};
    pendingGuests?.forEach(guest => {
      countsByEvent[guest.event_id] = (countsByEvent[guest.event_id] || 0) + 1;
    });

    const pendingEvents = Object.entries(countsByEvent).map(([eventId, count]) => ({
      eventId,
      count,
    }));

    const total = pendingEvents.reduce((sum, e) => sum + e.count, 0);

    setEventsWithPending(pendingEvents);
    setTotalPendingCount(total);
  }, [user]);

  useEffect(() => {
    fetchPendingRegistrations();
  }, [fetchPendingRegistrations]);

  // Narrowed realtime subscription — only listen to user's own events
  useEffect(() => {
    if (!user || userEventIds.length === 0) return;

    const channel = supabase
      .channel('pending-actions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_guests',
          filter: `event_id=in.(${userEventIds.join(',')})`,
        },
        () => {
          fetchPendingRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userEventIds, fetchPendingRegistrations]);

  const getPendingCountForEvent = useCallback((eventId: string) => {
    const event = eventsWithPending.find(e => e.eventId === eventId);
    return event?.count || 0;
  }, [eventsWithPending]);

  return (
    <PendingActionsContext.Provider value={{ 
      totalPendingCount, 
      eventsWithPending, 
      getPendingCountForEvent,
      refetch: fetchPendingRegistrations
    }}>
      {children}
    </PendingActionsContext.Provider>
  );
};
