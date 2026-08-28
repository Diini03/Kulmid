/**
 * Canonical public URL helpers for events.
 * Slugs are generated in the database (`events.slug`); the UUID/text id stays
 * valid forever so old links never break.
 */

type EventLike = { id: string; slug?: string | null };

/** Path used for the public event page — prefers the readable slug. */
export const eventPath = (event: EventLike) => `/event/${event.slug || event.id}`;

/** Absolute shareable URL for the public event page. */
export const eventUrl = (event: EventLike, origin?: string) =>
  `${origin || (typeof window !== "undefined" ? window.location.origin : "")}${eventPath(event)}`;

/** Escape a value for use inside a PostgREST `.or()` filter. */
const safe = (value: string) => value.replace(/[(),"']/g, "");

/** PostgREST filter matching either the event id or its slug. */
export const eventIdOrSlugFilter = (idOrSlug: string) =>
  `id.eq.${safe(idOrSlug)},slug.eq.${safe(idOrSlug)}`;
