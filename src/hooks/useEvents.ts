import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventItem, EVENT_LIST_COLUMNS, EVENT_PUBLIC_COLUMNS } from "@/types/event";
import { eventIdOrSlugFilter } from "@/lib/eventUrl";

interface UseEventsOptions {
  statuses?: string[];
  category?: string;
  createdBy?: string;
  limit?: number;
  enabled?: boolean;
}

export function useEvents(options: UseEventsOptions = {}) {
  const {
    statuses = ["published", "featured", "approved", "upcoming", "ongoing"],
    category,
    createdBy,
    limit = 100,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ["events", { statuses, category, createdBy, limit }],
    queryFn: async (): Promise<EventItem[]> => {
      let query = supabase
        .from("events")
        .select(EVENT_LIST_COLUMNS)
        .in("status", statuses)
        .order("date", { ascending: true })
        .limit(limit);

      if (category) {
        query = query.eq("category", category);
      }
      if (createdBy) {
        query = query.eq("created_by", createdBy);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled,
  });
}

export function useEventById(id: string | undefined) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_PUBLIC_COLUMNS)
        .or(eventIdOrSlugFilter(id!))
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
