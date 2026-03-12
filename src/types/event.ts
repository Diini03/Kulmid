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
