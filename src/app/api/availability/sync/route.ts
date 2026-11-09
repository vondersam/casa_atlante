import { after, NextRequest, NextResponse } from "next/server";
import { syncAvailabilityFromSources } from "@/lib/availability-sync";
import { apiError, secretMatches } from "@/lib/booking/http";
import { BookingError } from "@/lib/booking/policy";
import { processOutbox } from "@/lib/booking/mail";
export async function POST(req: NextRequest) {
  try {
    if (
      !secretMatches(
        req.headers.get("x-webhook-secret"),
        process.env.WEBHOOK_SECRET,
      )
    )
      throw new BookingError("unauthorized", 401);
    const result = await syncAvailabilityFromSources();
    after(async () => {
      try {
        await processOutbox();
      } catch {
        console.error("Sync mail worker needs retry");
      }
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
