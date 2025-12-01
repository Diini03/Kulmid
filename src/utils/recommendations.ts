import { supabase } from "@/integrations/supabase/client";
import { RECOMMENDATION_CONFIG, SCORING_WEIGHTS } from "@/constants/recommendations";

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
  score?: number;
}

export interface UserPreferences {
  event_categories: string[];
  preferred_format: string;
  topics: string[];
  allow_recommendations: boolean;
}

/**
 * Fetch user's favorite event categories
 */
async function fetchUserFavorites(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("user_favorites")
    .select("event_id")
    .eq("user_id", userId);

  if (!data || data.length === 0) return [];

  // Get categories of favorited events
  const eventIds = data.map((f) => f.event_id);
  const { data: events } = await supabase
    .from("events")
    .select("category")
    .in("id", eventIds);

  return events ? events.map((e) => e.category) : [];
}

/**
 * Fetch user's past registration categories
 */
async function fetchUserRegistrations(userId: string): Promise<string[]> {
  // Get user's email from auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return [];

  const { data } = await supabase
    .from("event_guests")
    .select("event_id")
    .eq("email", user.email)
    .in("status", ["confirmed", "checked_in"]);

  if (!data || data.length === 0) return [];

  // Get categories of registered events
  const eventIds = data.map((g) => g.event_id);
  const { data: events } = await supabase
    .from("events")
    .select("category")
    .in("id", eventIds);

  return events ? events.map((e) => e.category) : [];
}

/**
 * Fetch registration counts for popularity scoring
 */
async function fetchEventPopularity(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("event_guests")
    .select("event_id")
    .in("status", ["confirmed", "pending", "checked_in"]);

  if (!data) return {};

  // Count registrations per event
  const counts: Record<string, number> = {};
  data.forEach((guest) => {
    counts[guest.event_id] = (counts[guest.event_id] || 0) + 1;
  });

  return counts;
}

/**
 * Calculate recommendation score for an event
 */
function calculateRecommendationScore(
  event: EventItem,
  prefs: UserPreferences,
  favoriteCategories: string[],
  registrationCategories: string[],
  popularityCounts: Record<string, number>
): number {
  let score = 0;

  // Category match (30 points)
  if (prefs.event_categories?.includes(event.category)) {
    score += SCORING_WEIGHTS.CATEGORY_MATCH;
  }

  // Topic match (20 points) - check if event title/description contains user's topics
  if (prefs.topics && prefs.topics.length > 0) {
    const eventText = `${event.title} ${event.description || ""}`.toLowerCase();
    const topicMatches = prefs.topics.some((topic) =>
      eventText.includes(topic.toLowerCase())
    );
    if (topicMatches) {
      score += SCORING_WEIGHTS.TOPIC_MATCH;
    }
  }

  // Format match (15 points) - match preferred_format to category
  if (prefs.preferred_format && event.category.toLowerCase().includes(prefs.preferred_format.toLowerCase())) {
    score += SCORING_WEIGHTS.FORMAT_MATCH;
  }

  // Favorite similarity (25 points) - same category as favorited events
  if (favoriteCategories.includes(event.category)) {
    score += SCORING_WEIGHTS.FAVORITE_SIMILARITY;
  }

  // Registration similarity (20 points) - same category as past registrations
  if (registrationCategories.includes(event.category)) {
    score += SCORING_WEIGHTS.REGISTRATION_SIMILARITY;
  }

  // Popularity (10 points) - normalize based on registration count
  const registrationCount = popularityCounts[event.id] || 0;
  if (registrationCount > 0) {
    // Scale: 1-3 registrations = 3 points, 4-9 = 6 points, 10+ = 10 points
    score += Math.min(SCORING_WEIGHTS.POPULARITY, Math.ceil(registrationCount / 3) * 3);
  }

  // Recency (5 points) - events within 30 days
  const eventDate = new Date(event.date);
  const now = new Date();
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilEvent >= 0 && daysUntilEvent <= 30) {
    score += SCORING_WEIGHTS.RECENCY;
  }

  return score;
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
 * Fetch personalized events with multi-factor scoring
 * Uses collaborative filtering with user preferences, favorites, and registration history
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
    // Fetch user preferences and update event statuses in parallel
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
      // No preferences or recommendations disabled - return all events without scoring
      const { data: allEvents } = await supabase
        .from("events")
        .select("*")
        .in("status", ["approved", "upcoming", "ongoing"])
        .order("date", { ascending: true })
        .limit(50);

      return {
        events: allEvents || [],
        hasPreferences: false,
        isSupplemented: false,
        preferenceMatchCount: 0,
      };
    }

    // Fetch user behavior data and all events in parallel
    const [favoriteCategories, registrationCategories, { data: allEvents }, popularityCounts] = 
      await Promise.all([
        fetchUserFavorites(userId),
        fetchUserRegistrations(userId),
        supabase
          .from("events")
          .select("*")
          .in("status", ["approved", "upcoming", "ongoing"])
          .limit(100),
        fetchEventPopularity()
      ]);

    if (!allEvents || allEvents.length === 0) {
      return {
        events: [],
        hasPreferences: true,
        isSupplemented: false,
        preferenceMatchCount: 0,
      };
    }

    // Calculate score for each event
    const scoredEvents = allEvents.map((event) => ({
      ...event,
      score: calculateRecommendationScore(
        event,
        prefs,
        favoriteCategories,
        registrationCategories,
        popularityCounts
      ),
    }));

    // Sort by score (highest first)
    scoredEvents.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Count how many events have a score > 0 (preference matches)
    const matchCount = scoredEvents.filter((e) => (e.score || 0) > 0).length;

    // Check if we need supplemental events
    if (matchCount < MINIMUM_EVENTS_THRESHOLD) {
      const supplementalEvents = await fetchSupplementalEvents({
        excludeIds: scoredEvents.slice(0, matchCount).map((e) => e.id),
        excludeCategories: prefs.event_categories || [],
        limit: MINIMUM_EVENTS_THRESHOLD - matchCount,
      });

      return {
        events: [
          ...scoredEvents.slice(0, matchCount),
          ...supplementalEvents,
        ],
        hasPreferences: true,
        isSupplemented: true,
        preferenceMatchCount: matchCount,
      };
    }

    // Return top scored events
    return {
      events: scoredEvents.slice(0, 50),
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
