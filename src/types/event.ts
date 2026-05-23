export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  price: number;
  image_url: string | null;
  status?: string;
  description?: string | null;
  score?: number;
}

/** Columns to select for event list views (not full detail) */
export const EVENT_LIST_COLUMNS = 'id, title, date, location, category, price, image_url, status, description' as const;

/**
 * Safe columns for fetching a full event row from anonymous (logged-out) context.
 * Excludes sensitive host PII (host_email, host_phone, payout_phone, host_description)
 * which anon does not have column-level SELECT permission for.
 */
export const EVENT_PUBLIC_COLUMNS = `
  id, title, date, end_date, location, category, price, image_url,
  description, status, event_type, meeting_link, host_name,
  max_attendees, registration_deadline,
  facebook_url, twitter_url, instagram_url, linkedin_url, website_url,
  created_at, updated_at, created_by, rejection_reason,
  auto_approve_registrations
`.replace(/\s+/g, ' ').trim();
