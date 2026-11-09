import { NextRequest, NextResponse } from "next/server";
import { syncAvailabilityFromSources } from "@/lib/availability-sync";
import { secretMatches } from "@/lib/booking/http";
import { reconcilePayments } from "@/lib/booking/stripe";
import { processOutbox } from "@/lib/booking/mail";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  if (
    !secretMatches(
      req.headers.get("authorization"),
      process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined,
    )
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const failures: string[] = [];
  const results = await Promise.allSettled([
    reconcilePayments(),
    syncAvailabilityFromSources(),
  ]);
  results.forEach((result, index) => {
    if (result.status === "rejected")
      failures.push(index === 0 ? "payments" : "calendars");
  });
  try {
    await processOutbox(20);
  } catch {
    failures.push("mail");
  }
  return NextResponse.json(
    { ok: failures.length === 0, failed: failures },
    {
      status: failures.length ? 502 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
