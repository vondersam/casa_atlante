import { processOutbox } from "@/lib/booking/mail";
import { after, NextRequest, NextResponse } from "next/server";
import {
  getAvailability,
  sanitizeBooking,
  setAvailability,
  type Booking,
} from "@/lib/availability";
import { refreshCalendarForDisplay } from "@/lib/availability-sync";
import { apiError, readJson, secretMatches } from "@/lib/booking/http";
import { BookingError, record } from "@/lib/booking/policy";
export async function GET() {
  try {
    let refreshFailed = false;
    try {
      await refreshCalendarForDisplay();
    } catch {
      refreshFailed = true;
    }
    const availability = await getAvailability();
    after(async () => {
      try {
        await processOutbox(4);
      } catch {
        console.error("Calendar notifications need retry");
      }
    });
    return NextResponse.json(
      {
        ...availability,
        instantAvailable:
          !refreshFailed && process.env.STRIPE_ENABLED === "true",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    if (
      !secretMatches(
        req.headers.get("x-webhook-secret"),
        process.env.WEBHOOK_SECRET,
      )
    )
      throw new BookingError("unauthorized", 401);
    const payload = record(await readJson(req));
    if (!Array.isArray(payload.bookings) || payload.bookings.length > 1000)
      throw new BookingError("invalid_request");
    const sanitized = payload.bookings.map(sanitizeBooking);
    if (sanitized.some((b) => !b)) throw new BookingError("invalid_request");
    const bookings = sanitized.filter((b): b is Booking => b !== null);
    const updatedAt = await setAvailability(bookings);
    after(async () => {
      try { await processOutbox(); } catch { console.error("Manual calendar notifications need retry"); }
    });
    return NextResponse.json({ok:true,count:bookings.length,updatedAt});
  } catch (error) {
    return apiError(error);
  }
}
