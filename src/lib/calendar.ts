interface CalendarEvent {
  id: string;
  slug?: string | null;
  title: string;
  date: string;
  end_date?: string | null;
  location?: string | null;
  description?: string | null;
  meeting_link?: string | null;
}

const toIcsDate = (value: string | Date) => {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const escapeIcs = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Folds long lines to 75 octets as required by RFC 5545. */
const fold = (line: string) => {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
};

export function buildIcs(event: CalendarEvent, appUrl = window.location.origin) {
  const start = new Date(event.date);
  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const location = event.meeting_link || event.location || "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kulmid//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@kulmid`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs((event.description || "").slice(0, 800))}`,
    `URL:${appUrl}/event/${event.slug || event.id}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n");
}

export function downloadIcs(event: CalendarEvent) {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(event: CalendarEvent) {
  const start = new Date(event.date);
  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
    details: (event.description || "").slice(0, 800),
    location: event.meeting_link || event.location || "",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}