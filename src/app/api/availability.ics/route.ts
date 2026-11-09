import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { exportICal } from "@/lib/booking/ical";
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("reservations")
    .select("id,start_date,end_date,status,expires_at,updated_at")
    .in("status", ["confirmed", "awaiting_transfer"]);
  if (error)
    return new NextResponse("Calendar temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  const events = (data || []).filter(
    (r) =>
      r.status === "confirmed" ||
      (r.expires_at && Date.parse(r.expires_at) > Date.now()),
  );
  return new NextResponse(exportICal(events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
