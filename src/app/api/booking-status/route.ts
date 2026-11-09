import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { apiError, rateLimit } from "@/lib/booking/http";
import { BookingError } from "@/lib/booking/policy";
import type { Reservation } from "@/lib/booking/types";
export async function GET(req: NextRequest) {
  try {
    await rateLimit(req, "status", 90, 300);
    const token = req.nextUrl.searchParams.get("token");
    if (!token || !/^[a-f0-9-]{36}$/i.test(token))
      throw new BookingError("not_found", 404);
    const { data: r, error } = await getSupabaseAdmin()
      .from("reservations")
      .select("*")
      .eq("status_token", token)
      .returns<Reservation[]>()
      .maybeSingle();
    if (error) throw new Error("Status lookup failed");
    if (!r) throw new BookingError("not_found", 404);
    return NextResponse.json(
      {
        status:
          r.status === "awaiting_transfer" &&
          r.expires_at &&
          Date.parse(r.expires_at) <= Date.now()
            ? "expired"
            : r.status,
        reference: r.id,
        start: r.start_date,
        end: r.end_date,
        total: r.total_cents,
        expiresAt: r.expires_at,
        refundState: r.refund_state,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
