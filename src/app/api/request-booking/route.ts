import { after, NextRequest, NextResponse } from "next/server";
import { submitBooking } from "@/lib/booking/service";
import {
  apiError,
  rateLimit,
  readJson,
  requireSameOrigin,
} from "@/lib/booking/http";
import { processOutbox } from "@/lib/booking/mail";
import type { Locale } from "@/lib/booking/policy";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  let locale: Locale = "en";
  try {
    requireSameOrigin(req);
    await rateLimit(req, "booking", 10, 300);
    const body = await readJson(req);
    if (
      body &&
      typeof body === "object" &&
      "locale" in body &&
      body.locale === "es"
    )
      locale = "es";
    after(async () => {
      try {
        await processOutbox();
      } catch {
        console.error("Booking mail worker needs retry");
      }
    });
    const result = await submitBooking(body);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error, locale);
  }
}
