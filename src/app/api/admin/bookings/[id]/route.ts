import { after, NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/booking/auth";
import { apiError, readJson, requireSameOrigin } from "@/lib/booking/http";
import { BookingError, record } from "@/lib/booking/policy";
import { transition } from "@/lib/booking/repository";
import { syncAvailabilityFromSources } from "@/lib/availability-sync";
import { processOutbox } from "@/lib/booking/mail";
import { reconcileRefund } from "@/lib/booking/stripe";
const actions = new Set([
  "approve",
  "extend",
  "mark_paid",
  "reject",
  "release",
  "cancel",
  "bank_refunded",
  "acknowledge_conflict",
  "resend",
]);
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(req);
    const owner = await requireOwner();
    const { id } = await ctx.params;
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new BookingError("not_found", 404);
    const body = record(await readJson(req));
    if (typeof body.action !== "string" || !actions.has(body.action))
      throw new BookingError("invalid_request");
    const data: Record<string, unknown> = {};
    if (body.action === "extend") {
      if (
        typeof body.expiresAt !== "string" ||
        !Number.isFinite(Date.parse(body.expiresAt))
      )
        throw new BookingError("invalid_deadline");
      data.expires_at = new Date(body.expiresAt).toISOString();
    }
    if (body.action === "cancel") {
      if (
        !["guest", "owner"].includes(String(body.reason)) ||
        !Number.isInteger(body.expectedRefundCents)
      )
        throw new BookingError("invalid_request");
      data.reason = body.reason;
      data.expected_refund_cents = body.expectedRefundCents;
    }
    // Imports can queue a conflict alert even when the requested action is refused.
    after(async () => {
      try { await processOutbox(); } catch { console.error("Owner notifications need retry"); }
    });
    if (["approve", "extend", "mark_paid"].includes(body.action))
      await syncAvailabilityFromSources();
    const r = await transition(id, body.action, data, owner);
    after(async () => {
      try {
        if (r.refund_state === "pending") await reconcileRefund(r);
      } catch {
        console.error("Refund needs retry", { bookingId: id });
      }
      try {
        await processOutbox();
      } catch {
        console.error("Owner action mail needs retry");
      }
    });
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
