import { unstable_noStore as noStore } from "next/cache";
import { getAvailability } from "@/lib/availability";
import BookingClient from "./booking-client";

export const dynamic = "force-dynamic";

export default function BookingPage() {
  noStore();

  const availabilityPromise = getAvailability()
    .then((availability) => ({
      bookings: availability.bookings ?? [],
      updatedAt: availability.updatedAt ?? null,
      error: null as string | null,
    }))
    .catch((error) => ({
      bookings: [],
      updatedAt: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load availability",
    }));

  return <BookingClient availabilityPromise={availabilityPromise} />;
}
