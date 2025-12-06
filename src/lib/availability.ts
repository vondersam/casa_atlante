import { getSupabaseAdmin } from './supabase';

export type Booking = {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (checkout date, exclusive)
  source?: string;
  note?: string;
};

type DBBookingRow = {
  start: string | null;
  end: string | null;
  source: string | null;
  note: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const BOOKINGS_TABLE = 'bookings';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(value: string) {
  if (!ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : value;
}

export function sanitizeBooking(booking: Booking): Booking | null {
  const start = normalizeDate(booking.start);
  const end = normalizeDate(booking.end);

  if (!start || !end) return null;

  const startDate = new Date(`${start}T00:00:00Z`).getTime();
  const endDate = new Date(`${end}T00:00:00Z`).getTime();

  if (endDate <= startDate) return null;

  return {
    start,
    end,
    source: booking.source ?? 'webhook',
    note: booking.note?.slice(0, 120)
  };
}

export async function getAvailability() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from<DBBookingRow>(BOOKINGS_TABLE)
    .select('start,end,source,note,updated_at,created_at')
    .order('start', { ascending: true });

  if (error) throw new Error(`Failed to load availability: ${error.message}`);

  const sanitized = (data ?? [])
    .map((row) =>
      sanitizeBooking({
        start: row.start ?? '',
        end: row.end ?? '',
        source: row.source ?? undefined,
        note: row.note ?? undefined
      })
    )
    .filter((booking): booking is Booking => Boolean(booking));

  const timestamps = (data ?? [])
    .map((row) => row.updated_at ?? row.created_at)
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => !Number.isNaN(value));

  const updatedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

  return {
    bookings: sanitized,
    updatedAt
  };
}

export async function setAvailability(bookings: Booking[]) {
  const supabase = getSupabaseAdmin();
  const updatedAt = new Date().toISOString();

  // Delete all rows; PostgREST requires a filter, so we filter on id IS NOT NULL.
  const { error: deleteError } = await supabase
    .from(BOOKINGS_TABLE)
    .delete()
    .not('id', 'is', null);

  if (deleteError) {
    throw new Error(`Failed to reset availability: ${deleteError.message}`);
  }

  if (bookings.length) {
    const rows = bookings.map((booking) => ({
      start: booking.start,
      end: booking.end,
      source: booking.source ?? null,
      note: booking.note ?? null,
      updated_at: updatedAt
    }));

    const { error: insertError } = await supabase.from(BOOKINGS_TABLE).insert(rows);
    if (insertError) {
      throw new Error(`Failed to store availability: ${insertError.message}`);
    }
  }

  return updatedAt;
}
