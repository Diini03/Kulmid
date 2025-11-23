type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  description: string | null;
  status: string;
  registration_count?: number;
};

/**
 * Calculate a popularity score for an event based on various factors
 */
function calculatePopularityScore(event: EventItem, registrationCounts: Record<string, number>): number {
  const registrations = registrationCounts[event.id] || 0;
  
  // Base score from registrations
  let score = registrations * 10;
  
  // Boost for upcoming events (within 30 days)
  const daysUntilEvent = (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilEvent > 0 && daysUntilEvent <= 30) {
    score += 5;
  }
  
  // Slight boost for free events
  if (event.price === 0) {
    score += 2;
  }
  
  return score;
}

/**
 * Smart shuffle that ensures variety while keeping popular events near the top
 */
export function smartShuffleEvents(
  events: EventItem[],
  registrationCounts: Record<string, number> = {}
): EventItem[] {
  if (events.length === 0) return events;
  
  // Calculate popularity scores
  const eventsWithScores = events.map(event => ({
    event,
    score: calculatePopularityScore(event, registrationCounts),
    random: Math.random(),
  }));
  
  // Sort by combined score and randomness
  // Popular events get weighted toward top, but with randomness mixed in
  eventsWithScores.sort((a, b) => {
    const scoreWeight = 0.6; // 60% score, 40% random
    const randomWeight = 0.4;
    
    const aValue = (a.score * scoreWeight) + (a.random * 100 * randomWeight);
    const bValue = (b.score * scoreWeight) + (b.random * 100 * randomWeight);
    
    return bValue - aValue;
  });
  
  // Extract events while ensuring variety
  const result: EventItem[] = [];
  const used = new Set<string>();
  const recentCategories: string[] = [];
  const recentLocations: string[] = [];
  
  // First pass: pick events ensuring variety
  for (const item of eventsWithScores) {
    const { event } = item;
    
    if (used.has(event.id)) continue;
    
    // Check if we recently used this category or location
    const categoryRecent = recentCategories.slice(-2).includes(event.category);
    const locationRecent = recentLocations.slice(-2).includes(event.location);
    
    // If both are recent, skip for now unless we're running out of options
    if (categoryRecent && locationRecent && result.length < events.length - 5) {
      continue;
    }
    
    result.push(event);
    used.add(event.id);
    recentCategories.push(event.category);
    recentLocations.push(event.location);
    
    // Keep only last 3 categories and locations in memory
    if (recentCategories.length > 3) recentCategories.shift();
    if (recentLocations.length > 3) recentLocations.shift();
  }
  
  // Second pass: add any remaining events
  for (const item of eventsWithScores) {
    if (!used.has(item.event.id)) {
      result.push(item.event);
    }
  }
  
  return result;
}

/**
 * Fetch registration counts for events
 */
export async function fetchRegistrationCounts(
  supabase: any,
  eventIds: string[]
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};
  
  try {
    const { data, error } = await supabase
      .from('event_guests')
      .select('event_id')
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'pending']);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    data?.forEach((guest: any) => {
      counts[guest.event_id] = (counts[guest.event_id] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return {};
  }
}
