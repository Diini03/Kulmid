export type RegistrationStatus = "upcoming" | "open" | "closed" | "full" | "cancelled";

export interface RegistrationWindowEvent {
  date?: string | null;
  end_date?: string | null;
  max_attendees?: number | null;
  registration_open_at?: string | null;
  registration_close_at?: string | null;
  registration_deadline?: string | null;
  registration_override?: string | null;
  allow_waitlist?: boolean | null;
}

export const REGISTRATION_STATUS_META: Record<
  RegistrationStatus,
  { label: string; badgeClass: string; message: string }
> = {
  upcoming: {
    label: "Upcoming",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    message: "Registration has not opened yet.",
  },
  open: {
    label: "Open",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    message: "Registration is open.",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-muted text-muted-foreground border-border",
    message: "Registration is closed.",
  },
  full: {
    label: "Full",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    message: "This event has reached capacity.",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    message: "Registration has been cancelled by the organizer.",
  },
};

const toDate = (v?: string | null) => (v ? new Date(v) : null);

/**
 * Derives the registration state. Mirrors the `get_event_registration_status`
 * Postgres function so client and server always agree.
 */
export function getRegistrationStatus(
  event: RegistrationWindowEvent | null | undefined,
  registrationCount = 0,
  now: Date = new Date()
): RegistrationStatus {
  if (!event) return "closed";

  const override = event.registration_override;
  if (override === "cancelled") return "cancelled";
  if (override === "closed") return "closed";
  if (override === "open") return "open";

  const openAt = toDate(event.registration_open_at);
  if (openAt && now < openAt) return "upcoming";

  const closeAt = toDate(event.registration_close_at) ?? toDate(event.registration_deadline);
  if (closeAt && now > closeAt) return "closed";

  const eventEnd = toDate(event.end_date) ?? toDate(event.date);
  if (eventEnd && eventEnd < now) return "closed";

  const cap = event.max_attendees;
  if (cap != null && registrationCount >= cap) return "full";

  return "open";
}

export function getRegistrationCloseDate(event: RegistrationWindowEvent | null | undefined) {
  if (!event) return null;
  return toDate(event.registration_close_at) ?? toDate(event.registration_deadline);
}

/** Whole days remaining until a date (0 when today, null when no date / past). */
export function daysRemaining(date: Date | null, now: Date = new Date()): number | null {
  if (!date) return null;
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatRegistrationDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
