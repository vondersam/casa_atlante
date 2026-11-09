import { createHash } from "node:crypto";
import { isDate } from "./policy";
export type CalendarEvent = {
  source: string;
  uid: string;
  start_date: string;
  end_date: string;
};
export function parseICal(text: string, source: string): CalendarEvent[] {
  const lines = text
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim());
  if (lines[0] !== "BEGIN:VCALENDAR" || !lines.includes("END:VCALENDAR"))
    throw new Error("Invalid calendar");
  const events: CalendarEvent[] = [];
  let event: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      if (event) throw new Error("Nested event");
      event = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (!event) throw new Error("Unexpected event end");
      if (
        event.STATUS !== "CANCELLED" &&
        !event.UID?.endsWith("@casa-atlante.com")
      ) {
        if (event.RRULE || event.RDATE || event.EXDATE)
          throw new Error("Recurring calendar events unsupported");
        const date = (value?: string) => {
          if (!value || !/^\d{8}(T\d{6}Z?)?$/.test(value))
            throw new Error("Invalid event date");
          const result = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
          if (!isDate(result)) throw new Error("Invalid event date");
          return result;
        };
        const start = date(event.DTSTART),
          end = date(event.DTEND);
        if (end <= start || !event.UID)
          throw new Error("Invalid calendar event");
        events.push({
          source,
          uid: createHash("sha256").update(event.UID).digest("hex"),
          start_date: start,
          end_date: end,
        });
      }
      event = null;
      continue;
    }
    if (event) {
      const colon = line.indexOf(":");
      if (colon > 0)
        event[line.slice(0, colon).split(";")[0]] = line.slice(colon + 1);
    }
  }
  if (event) throw new Error("Unterminated calendar event");
  const unique = new Map<string, CalendarEvent>();
  for (const e of events) {
    const old = unique.get(e.uid);
    if (old && (old.start_date !== e.start_date || old.end_date !== e.end_date))
      throw new Error("Conflicting calendar UIDs");
    unique.set(e.uid, e);
  }
  return [...unique.values()];
}
export function exportICal(
  events: {
    id: string;
    start_date: string;
    end_date: string;
    updated_at: string;
  }[],
): string {
  const stamp = (date: string) =>
    new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Casa Atlante//Direct bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Casa Atlante",
  ];
  for (const e of events)
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@casa-atlante.com`,
      `DTSTAMP:${stamp(e.updated_at)}`,
      `LAST-MODIFIED:${stamp(e.updated_at)}`,
      `DTSTART;VALUE=DATE:${e.start_date.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${e.end_date.replaceAll("-", "")}`,
      "SUMMARY:Unavailable",
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  return [...lines, "END:VCALENDAR", ""].join("\r\n");
}
