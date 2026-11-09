import { getSupabaseAdmin } from "./supabase";
import { isDate } from "./booking/policy";
import { rpc } from "./booking/repository";
export type Booking = {
  start: string;
  end: string;
  source?: string;
  note?: string;
};
export function sanitizeBooking(value: unknown): Booking | null {
  if (!value || typeof value !== "object") return null;
  const b = value as Record<string, unknown>;
  if (!isDate(b.start) || !isDate(b.end) || b.end <= b.start) return null;
  return { start: b.start, end: b.end, source: "webhook" };
}
export async function getAvailability() {
  const db = getSupabaseAdmin();
  const [external, direct, state] = await Promise.all([
    db.from("external_calendar_events").select("start_date,end_date"),
    db
      .from("reservations")
      .select("start_date,end_date,status,expires_at")
      .in("status", ["checkout", "confirmed", "awaiting_transfer"]),
    db
      .from("calendar_sync_state")
      .select("completed_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  if (external.error || direct.error || state.error)
    throw new Error("Availability unavailable");
  const rows = [
    ...(external.data || []),
    ...(direct.data || []).filter(
      (r) =>
        r.status !== "awaiting_transfer" ||
        (r.expires_at && Date.parse(r.expires_at) > Date.now()),
    ),
  ];
  return {
    bookings: rows.map((r) => ({ start: r.start_date, end: r.end_date })),
    updatedAt: state.data?.completed_at ?? null,
  };
}
// Legacy authenticated webhook updates manual blocks only, never imported/direct reservations.
export async function setAvailability(bookings: Booking[]) {
  await rpc<boolean>("ca_replace_manual", {
    p_events: bookings.map((b, i) => ({
      uid: `manual-${i}`,
      start_date: b.start,
      end_date: b.end,
    })),
  });
  return new Date().toISOString();
}
