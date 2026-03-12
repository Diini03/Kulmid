import { supabase } from "@/integrations/supabase/client";
import { RECOMMENDATION_CONFIG, SCORING_WEIGHTS } from "@/constants/recommendations";
import { EventItem, EVENT_LIST_COLUMNS } from "@/types/event";

export type { EventItem };

export interface UserPreferences {
  event_categories: string[];
  preferred_format: string;
  topics: string[];
  allow_recommendations: boolean;
}

async function fetchUserFavorites(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("user_favorites")
    .select("event_id")
    .eq("user_id", userId);

  if (!data || data.length === 0) return [];

  const eventIds = data.map((f) => f.event_id);
  const { data: events } = await supabase
    .from("events")
    .select("category")
    .in("id", eventIds);

  return events ? events.map((e) => e.category) : [];
}

async function fetchUserRegistrations(userEmail: string): Promise<string[]> {
  const { data } = await supabase
    .from("event_guests")
    .select("event_id")
    .eq("email", userEmail)
    .in("status", ["confirmed", "checked_in"]);

  if (!data || data.length === 0) return [];

  const eventIds = data.map((g) => g.event_id);
  const { data: events } = await supabase
    .from("events")
    .select("category")
    .in("id", eventIds);

  return events ? events.map((e) => e.category) : [];
}

async function fetchEventPopularity(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("event_guests")
    .select("event_id")
    .in("status", ["confirmed", "pending", "checked_in"]);

  if (!data) return {};

  const counts: Record<string, number> = {};
  data.forEach((guest) => {
    counts[guest.event_id] = (counts[guest.event_id] || 0) + 1;
  });

  return counts;
}

function calculateRecommendationScore(
  event: EventItem,
  prefs: UserPreferences,
  favoriteCategories: string[],
  registrationCategories: string[],
  popularityCounts: Record<string, number>
): number {
  let score = 0;

  if (prefs.event_categories?.includes(event.category)) {
    score += SCORING_WEIGHTS.CATEGORY_MATCH;
  }

  if (prefs.topics && prefs.topics.length > 0) {
    const eventText = `${event.title} ${event.description || ""}`.toLowerCase();
    const topicMatches = prefs.topics.some((topic) =>
      eventText.includes(topic.toLowerCase())
    );
    if (topicMatches) {
      score += SCORING_WEIGHTS.TOPIC_MATCH;
    }
  }

  if (prefs.preferred_format && event.category.toLowerCase().includes(prefs.preferred_format.toLowerCase())) {
    score += SCORING_WEIGHTS.FORMAT_MATCH;
  }

  if (favoriteCategories.includes(event.category)) {
    score += SCORING_WEIGHTS.FAVORITE_SIMILARITY;
  }

  if (registrationCategories.includes(event.category)) {
    score += SCORING_WEIGHTS.REGISTRATION_SIMILARITY;
  }

  const registrationCount = popularityCounts[event.id] || 0;
  if (registrationCount > 0) {
    score += Math.min(SCORING_WEIGHTS.POPULARITY, Math.ceil(registrationCount / 3) * 3);
  }

  const eventDate = new Date(event.date);
  const now = new Date();
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilEvent >= 0 && daysUntilEvent <= 30) {
    score += SCORING_WEIGHTS.RECENCY;
  }

  return score;
}

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
    .select(EVENT_LIST_COLUMNS)
    .in("status", ["approved", "upcoming", "ongoing"])
    .order("date", { ascending: true })
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

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

export async function getPersonalizedEvents(
  userId: string,
  userEmail?: string
): Promise<{
  events: EventItem[];
  hasPreferences: boolean;
  isSupplemented: boolean;
  preferenceMatchCount: number;
}> {
  const { MINIMUM_EVENTS_THRESHOLD } = RECOMMENDATION_CONFIG;

  try {
    // Call update_event_status once per session
    const statusKey = 'kulmid_status_updated';
    const prefsPromise = supabase
      .from("user_preferences")
      .select("event_categories, preferred_format, topics, allow_recommendations")
      .eq("user_id", userId)
      .maybeSingle();

    const promises: [typeof prefsPromise, Promise<void> | Promise<null>] = [
      prefsPromise,
      sessionStorage.getItem(statusKey)
        ? Promise.resolve(null)
        : supabase.rpc("update_event_status").then(() => { sessionStorage.setItem(statusKey, '1'); return null; }),
    ];

    const [prefsResult] = await Promise.all(promises);
    const { data: prefs, error: prefsError } = prefsResult;

    if (prefsError || !prefs || !prefs.allow_recommendations) {
      const { data: allEvents } = await supabase
        .from("events")
        .select(EVENT_LIST_COLUMNS)
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

    // Resolve email if not passed
    const email = userEmail || (await supabase.auth.getUser()).data.user?.email || "";

    const [favoriteCategories, registrationCategories, { data: allEvents }, popularityCounts] = 
      await Promise.all([
        fetchUserFavorites(userId),
        fetchUserRegistrations(email),
        supabase
          .from("events")
          .select(EVENT_LIST_COLUMNS)
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

    const scoredEvents = allEvents.map((event) => ({
      ...event,
      score: calculateRecommendationScore(
        event, prefs, favoriteCategories, registrationCategories, popularityCounts
      ),
    }));

    scoredEvents.sort((a, b) => (b.score || 0) - (a.score || 0));
    const matchCount = scoredEvents.filter((e) => (e.score || 0) > 0).length;

    if (matchCount < MINIMUM_EVENTS_THRESHOLD) {
      const supplementalEvents = await fetchSupplementalEvents({
        excludeIds: scoredEvents.slice(0, matchCount).map((e) => e.id),
        excludeCategories: prefs.event_categories || [],
        limit: MINIMUM_EVENTS_THRESHOLD - matchCount,
      });

      return {
        events: [...scoredEvents.slice(0, matchCount), ...supplementalEvents],
        hasPreferences: true,
        isSupplemented: true,
        preferenceMatchCount: matchCount,
      };
    }

    return {
      events: scoredEvents.slice(0, 50),
      hasPreferences: true,
      isSupplemented: false,
      preferenceMatchCount: matchCount,
    };
  } catch (error) {
    console.error("Error fetching personalized events:", error);
    
    try {
      const { data: fallbackEvents } = await supabase
        .from("events")
        .select(EVENT_LIST_COLUMNS)
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
