export type GuestStatus =
  | "registered"
  | "approved"
  | "confirmed"
  | "pending"
  | "waitlisted"
  | "cancelled"
  | "rejected"
  | "declined"
  | "invited";

interface GuestStatusMeta {
  label: string;
  badgeClass: string;
  /** Counts against the event's capacity */
  occupiesSpot: boolean;
}

export const GUEST_STATUS_META: Record<string, GuestStatusMeta> = {
  registered: { label: "Registered", badgeClass: "bg-primary/10 text-primary border-primary/20", occupiesSpot: true },
  approved: { label: "Approved", badgeClass: "bg-primary/10 text-primary border-primary/20", occupiesSpot: true },
  confirmed: { label: "Confirmed", badgeClass: "bg-primary/10 text-primary border-primary/20", occupiesSpot: true },
  pending: { label: "Pending", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20", occupiesSpot: false },
  waitlisted: { label: "Waitlisted", badgeClass: "bg-sky-500/10 text-sky-600 border-sky-500/20", occupiesSpot: false },
  cancelled: { label: "Cancelled", badgeClass: "bg-muted text-muted-foreground border-border", occupiesSpot: false },
  rejected: { label: "Rejected", badgeClass: "bg-destructive/10 text-destructive border-destructive/20", occupiesSpot: false },
  declined: { label: "Declined", badgeClass: "bg-destructive/10 text-destructive border-destructive/20", occupiesSpot: false },
  invited: { label: "Invited", badgeClass: "bg-muted text-muted-foreground border-border", occupiesSpot: false },
};

export const getGuestStatusMeta = (status?: string | null): GuestStatusMeta =>
  GUEST_STATUS_META[status || ""] ?? {
    label: status || "Unknown",
    badgeClass: "bg-muted text-muted-foreground border-border",
    occupiesSpot: false,
  };

/** Flags guests that share an email address (case-insensitive) with another row. */
export function findDuplicateEmails<T extends { email?: string | null }>(guests: T[]): Set<string> {
  const seen = new Map<string, number>();
  for (const g of guests) {
    const key = (g.email || "").trim().toLowerCase();
    if (!key) continue;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k));
}