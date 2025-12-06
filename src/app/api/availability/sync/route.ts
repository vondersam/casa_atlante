import { NextRequest, NextResponse } from 'next/server';
import { Booking, sanitizeBooking, setAvailability } from '@/lib/availability';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function normalizeICalDate(line: string): string | null {
  const parts = line.split(':');
  if (parts.length < 2) return null;
  const rawValue = parts.slice(1).join(':').trim();

  // DATE format: YYYYMMDD
  if (/^\d{8}$/.test(rawValue)) {
    const year = rawValue.slice(0, 4);
    const month = rawValue.slice(4, 6);
    const day = rawValue.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  // DATETIME formats (assume UTC if zone missing)
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

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return unauthorized();
  }

  const sources = [
    { name: 'airbnb', url: process.env.AIRBNB_ICAL_URL },
    { name: 'booking.com', url: process.env.BOOKING_ICAL_URL }
  ].filter((entry) => Boolean(entry.url));

  if (!sources.length) {
    return NextResponse.json(
      { error: 'No iCal URLs configured. Add AIRBNB_ICAL_URL and/or BOOKING_ICAL_URL.' },
      { status: 400 }
    );
  }

  try {
    const calendars = await Promise.all(
      sources.map(async (source) => {
        const ical = await fetchICal(source.url as string);
        return parseICal(ical, source.name);
      })
    );

    const combined = calendars.flat();

    const sanitized = combined
      .map((booking) => sanitizeBooking(booking))
      .filter((booking): booking is Booking => Boolean(booking));

    if (!sanitized.length) {
      return NextResponse.json({ error: 'No valid events found in iCal feeds' }, { status: 400 });
    }

    const updatedAt = await setAvailability(sanitized);

    return NextResponse.json({
      ok: true,
      sources: sources.map((s) => s.name),
      imported: combined.length,
      stored: sanitized.length,
      updatedAt
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
