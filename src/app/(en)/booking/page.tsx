import { after } from "next/server";
import { processOutbox } from "@/lib/booking/mail";
import { getAvailability } from "@/lib/availability";
import { refreshCalendarForDisplay } from "@/lib/availability-sync";
import BookingClient from "./booking-client";
export const dynamic = "force-dynamic";
export default function BookingPage() {
  const availabilityPromise = (async () => {
    let refreshFailed = false;
    try {
      await refreshCalendarForDisplay();
    } catch {
      refreshFailed = true;
    }
    try {
      const availability = await getAvailability();
      after(async () => {
        try {
          await processOutbox(4);
        } catch {
          console.error("Calendar notifications need retry");
        }
      });
      return {
        ...availability,
        error: refreshFailed ? "refresh_failed" : null,
        instantAvailable:
          !refreshFailed && process.env.STRIPE_ENABLED === "true",
      };
    } catch {
      return {
        bookings: [],
        updatedAt: null,
        error: "refresh_failed",
        instantAvailable: false,
      };
    }
  })();
  return <BookingClient availabilityPromise={availabilityPromise} />;
}
