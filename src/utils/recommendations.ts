import { supabase } from "@/integrations/supabase/client";

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
 * Fetch personalized events based on user preferences
 */
export async function getPersonalizedEvents(
  userId: string
): Promise<{ events: EventItem[]; hasPreferences: boolean }> {
  try {
    // Fetch user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("user_preferences")
      .select("event_categories, preferred_format, topics, allow_recommendations")
      .eq("user_id", userId)
      .single();

    if (prefsError || !prefs || !prefs.allow_recommendations) {
      // No preferences or recommendations disabled - return all events
      const { data: allEvents } = await supabase
        .from("events")
        .select("*")
        .in("status", ["upcoming", "ongoing"])
        .order("date", { ascending: true });

      return { events: allEvents || [], hasPreferences: false };
    }

    // Update event statuses first
    await supabase.rpc("update_event_status");

    // Build query based on preferences
    let query = supabase
      .from("events")
      .select("*")
      .in("status", ["upcoming", "ongoing"]);

    // Filter by preferred categories if available
    if (prefs.event_categories && prefs.event_categories.length > 0) {
      query = query.in("category", prefs.event_categories);
    }

    // Order by date
    query = query.order("date", { ascending: true });

    const { data: events } = await query;

    return { events: events || [], hasPreferences: true };
  } catch (error) {
    console.error("Error fetching personalized events:", error);
    return { events: [], hasPreferences: false };
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
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}
