import { supabase } from "@/integrations/supabase/client";
import { RECOMMENDATION_CONFIG } from "@/constants/recommendations";

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  status: string;
  description?: string;
}

export interface UserPreferences {
  event_categories: string[];
  preferred_format: string;
  topics: string[];
  allow_recommendations: boolean;
}

/**
 * Fetch supplemental events to ensure minimum threshold
 */
async function fetchSupplementalEvents({
  excludeIds,
  excludeCategories,
  limit,
}: {
  excludeIds: string[];
  excludeCategories?: string[];
  limit: number;
}): Promise<EventItem[]> {
  let query = supabase
    .from("events")
    .select("*")
    .in("status", ["approved", "upcoming", "ongoing"])
    .order("date", { ascending: true })
    .limit(limit);

  // Exclude already fetched events
  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  // Optional: exclude user's already-preferred categories to show variety
  if (
    RECOMMENDATION_CONFIG.PREFER_DIFFERENT_CATEGORIES &&
    excludeCategories &&
    excludeCategories.length > 0
  ) {
    query = query.not("category", "in", `(${excludeCategories.join(",")})`);
  }

  const { data } = await query;
  return data || [];
}

/**
 * Fetch personalized events based on user preferences
 * Implements smart fallback to ensure minimum event threshold
 * Optimized with better error handling and performance
 */
export async function getPersonalizedEvents(
  userId: string
): Promise<{
  events: EventItem[];
  hasPreferences: boolean;
  isSupplemented: boolean;
  preferenceMatchCount: number;
}> {
  const { MINIMUM_EVENTS_THRESHOLD } = RECOMMENDATION_CONFIG;

  try {
    // Fetch user preferences and update event statuses in parallel for better performance
    const [prefsResult, _] = await Promise.all([
      supabase
        .from("user_preferences")
        .select("event_categories, preferred_format, topics, allow_recommendations")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.rpc("update_event_status")
    ]);

    const { data: prefs, error: prefsError } = prefsResult;

    if (prefsError || !prefs || !prefs.allow_recommendations) {
      // No preferences or recommendations disabled - return all events
      const { data: allEvents } = await supabase
        .from("events")
        .select("*")
        .in("status", ["approved", "upcoming", "ongoing"])
        .order("date", { ascending: true })
        .limit(50); // Limit to 50 events for better performance

      return {
        events: allEvents || [],
        hasPreferences: false,
        isSupplemented: false,
        preferenceMatchCount: 0,
      };
    }

    // Fetch preference-matched events
    let query = supabase
      .from("events")
      .select("*")
      .in("status", ["approved", "upcoming", "ongoing"]);

    // Filter by preferred categories if available
    if (prefs.event_categories && prefs.event_categories.length > 0) {
      query = query.in("category", prefs.event_categories);
    }

    // Order by date and limit results
    query = query.order("date", { ascending: true }).limit(50);

    const { data: preferenceEvents, error: eventsError } = await query;
    
    if (eventsError) {
      console.error("Error fetching preference events:", eventsError);
      throw eventsError;
    }
    
    const matchCount = preferenceEvents?.length || 0;

    // Check if we need to supplement with additional events
    if (matchCount < MINIMUM_EVENTS_THRESHOLD) {
      const supplementalEvents = await fetchSupplementalEvents({
        excludeIds: preferenceEvents?.map((e) => e.id) || [],
        excludeCategories: prefs.event_categories,
        limit: MINIMUM_EVENTS_THRESHOLD - matchCount,
      });

      return {
        events: [...(preferenceEvents || []), ...supplementalEvents],
        hasPreferences: true,
        isSupplemented: true,
        preferenceMatchCount: matchCount,
      };
    }

    return {
      events: preferenceEvents || [],
      hasPreferences: true,
      isSupplemented: false,
      preferenceMatchCount: matchCount,
    };
  } catch (error) {
    console.error("Error fetching personalized events:", error);
    
    // Fallback: return all events if personalization fails
    try {
      const { data: fallbackEvents } = await supabase
        .from("events")
        .select("*")
        .in("status", ["approved", "upcoming", "ongoing"])
        .order("date", { ascending: true })
        .limit(50);
        
      return {
        events: fallbackEvents || [],
        hasPreferences: false,
        isSupplemented: false,
        preferenceMatchCount: 0,
      };
    } catch {
      return {
        events: [],
        hasPreferences: false,
        isSupplemented: false,
        preferenceMatchCount: 0,
      };
    }
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}
