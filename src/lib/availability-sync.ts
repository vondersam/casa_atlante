import { Booking, sanitizeBooking, setAvailability } from '@/lib/availability';

type ICalSource = {
  name: string;
  url: string;
};

function normalizeICalDate(line: string): string | null {
  const parts = line.split(':');
  if (parts.length < 2) return null;
  const rawValue = parts.slice(1).join(':').trim();

  if (/^\d{8}$/.test(rawValue)) {
    const year = rawValue.slice(0, 4);
    const month = rawValue.slice(4, 6);
    const day = rawValue.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  const candidate = rawValue.endsWith('Z') ? rawValue : `${rawValue}Z`;
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parseICal(ical: string, source: string): Booking[] {
  const lines = ical.split(/\r?\n/);
  const bookings: Booking[] = [];

  let start: string | null = null;
  let end: string | null = null;
  let summary: string | null = null;
  let isCancelled = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') {
      start = null;
      end = null;
      summary = null;
      isCancelled = false;
      continue;
    }

    if (line.startsWith('DTSTART')) {
      start = normalizeICalDate(line);
      continue;
    }

    if (line.startsWith('DTEND')) {
      end = normalizeICalDate(line);
      continue;
    }

    if (line.startsWith('SUMMARY')) {
      const parts = line.split(':');
      summary = parts.length > 1 ? parts.slice(1).join(':').trim() : null;
      continue;
    }

    if (line.startsWith('STATUS:CANCELLED')) {
      isCancelled = true;
      continue;
    }

    if (line === 'END:VEVENT') {
      if (!isCancelled && start && end) {
        bookings.push({
          start,
          end,
          source,
          note: summary ?? undefined
        });
      }
    }
  }

  return bookings;
}

async function fetchICal(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch iCal: ${res.status}`);
  return res.text();
}

function getSources() {
  return [
    { name: 'airbnb', url: process.env.AIRBNB_ICAL_URL },
    { name: 'booking.com', url: process.env.BOOKING_ICAL_URL }
  ].filter((entry): entry is ICalSource => Boolean(entry.url));
}

export type SyncResult = {
  ok: true;
  sources: string[];
  imported: number;
  stored: number;
  updatedAt: string;
};

export async function syncAvailabilityFromSources(): Promise<SyncResult> {
  const sources = getSources();
  if (!sources.length) {
    throw new Error('No iCal URLs configured. Add AIRBNB_ICAL_URL and/or BOOKING_ICAL_URL.');
  }

  const calendars = await Promise.all(
    sources.map(async (source) => {
      const ical = await fetchICal(source.url);
      return parseICal(ical, source.name);
    })
  );

  const combined = calendars.flat();

  const sanitized = combined
    .map((booking) => sanitizeBooking(booking))
    .filter((booking): booking is Booking => Boolean(booking));

  if (!sanitized.length) {
    throw new Error('No valid events found in iCal feeds');
  }

  const updatedAt = await setAvailability(sanitized);

  return {
    ok: true,
    sources: sources.map((s) => s.name),
    imported: combined.length,
    stored: sanitized.length,
    updatedAt
  };
}

