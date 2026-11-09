import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/booking/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { apiError } from "@/lib/booking/http";
import { refundPercent } from "@/lib/booking/policy";
import type { Reservation } from "@/lib/booking/types";
export async function GET(req: NextRequest) {
  try {
    await requireOwner();
    const page = Math.max(
      0,
      Math.min(10000, Number(req.nextUrl.searchParams.get("page")) || 0),
    );
    const db = getSupabaseAdmin();
    const [rows, mail, sync] = await Promise.all([
      db
        .from("reservations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * 30, page * 30 + 29)
        .returns<Reservation[]>(),
      db
        .from("booking_outbox")
        .select("id,booking_id,kind,attempts,last_error")
        .is("sent_at", null)
        .order("created_at")
        .limit(50),
      db
        .from("calendar_sync_state")
        .select("completed_at")
        .eq("id", 1)
        .maybeSingle(),
    ]);
    if (rows.error || mail.error || sync.error)
      throw new Error("Dashboard unavailable");
    return NextResponse.json(
      {
        bookings: (rows.data || []).map((r) => ({
          ...r,
          status_token: undefined,
          request_digest: undefined,
          terms_snapshot: undefined,
          refundQuote: Math.round(
            (r.total_cents * refundPercent(r.start_date)) / 100,
          ),
        })),
        total: rows.count,
        pendingMail: mail.data,
        lastSync: sync.data?.completed_at || null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
