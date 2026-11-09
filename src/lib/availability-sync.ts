import { rpc } from "./booking/repository";
import { BookingError } from "./booking/policy";
import { parseICal } from "./booking/ical";
import { getSupabaseAdmin } from "./supabase";
export type SyncResult = {
  ok: true;
  sources: string[];
  imported: number;
  stored: number;
  updatedAt: string;
};
async function fetchCalendar(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:")
    throw new Error("Calendar URL must use HTTPS");
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (
    !res.ok ||
    !res.body ||
    Number(res.headers.get("content-length") || 0) > 2_000_000
  )
    throw new Error("Calendar fetch failed");
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2_000_000) throw new Error("Calendar too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function syncAvailabilityFromSources(): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const sources = [
    { name: "airbnb", url: process.env.AIRBNB_ICAL_URL },
    { name: "booking.com", url: process.env.BOOKING_ICAL_URL },
  ];
  try {
    const calendars = await Promise.all(
      sources.map(async (s) => {
        if (!s.url) throw new Error("Both calendars are required");
        return parseICal(await fetchCalendar(s.url), s.name);
      }),
    );
    const events = calendars.flat();
    await rpc<boolean>("ca_sync_calendars", {
      p_events: events,
      p_started_at: startedAt,
    });
    return {
      ok: true,
      sources: sources.map((s) => s.name),
      imported: events.length,
      stored: events.length,
      updatedAt: startedAt,
    };
  } catch {
    throw new BookingError("calendar_unavailable", 503);
  }
}
export async function refreshCalendarForDisplay(): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("calendar_sync_state")
    .select("completed_at")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data || Date.parse(data.completed_at) < Date.now() - 30000)
    await syncAvailabilityFromSources();
}
