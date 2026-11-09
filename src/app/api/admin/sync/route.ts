import { after, NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/booking/auth";
import { apiError, requireSameOrigin } from "@/lib/booking/http";
import { syncAvailabilityFromSources } from "@/lib/availability-sync";
import { reconcilePayments } from "@/lib/booking/stripe";
import { processOutbox } from "@/lib/booking/mail";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  try {
    requireSameOrigin(req);
    await requireOwner();
    await reconcilePayments();
    await syncAvailabilityFromSources();
    after(async () => {
      try {
        await processOutbox(20);
      } catch {
        console.error("Mail worker needs retry");
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
