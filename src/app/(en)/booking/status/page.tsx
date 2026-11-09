import { Suspense } from "react";
import BookingStatus from "./status-client";
export const metadata = {
  title: "Booking status | Casa Atlante",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return (
    <Suspense fallback={<p role="status">…</p>}>
      <BookingStatus />
    </Suspense>
  );
}
