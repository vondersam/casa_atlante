import { createHash } from "node:crypto";
import { syncAvailabilityFromSources } from "../availability-sync";
import { assertBookingConfiguration, issuer, siteOrigin } from "./config";
import { BookingError, parseBookingInput, type BookingInput } from "./policy";
import { rentalTerms } from "./terms";
import { reservationByRequest, rpc } from "./repository";
import { createCheckout } from "./stripe";
import { validateDocumentFields } from "./pdf";
import type { Reservation } from "./types";
export async function submitBooking(
  body: unknown,
): Promise<{ ok: true; url: string }> {
  const input = parseBookingInput(body);
  assertBookingConfiguration();
  const digest = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  let r = await reservationByRequest(input.requestId);
  if (r && r.request_digest !== digest)
    throw new BookingError("idempotency_conflict", 409);
  if (input.paymentMethod === "stripe" && (!r || r.status === "checkout")) {
    if (
      process.env.STRIPE_ENABLED !== "true" ||
      !process.env.STRIPE_SECRET_KEY ||
      !process.env.STRIPE_WEBHOOK_SECRET
    )
      throw new BookingError("checkout_unavailable", 503);
  }
  if (!r) {
    await validateDocumentFields([
      input.firstName,
      input.lastName,
      ...Object.values(input.billing),
      ...Object.values(issuer()),
    ]);
    if (input.paymentMethod === "stripe") await syncAvailabilityFromSources();
    r = await createReservation(input, digest);
  }
  const url =
    input.paymentMethod === "stripe" && r.status === "checkout"
      ? await createCheckout(r)
      : `${siteOrigin()}${r.locale === "es" ? "/es" : ""}/booking/status?token=${r.status_token}`;
  return { ok: true, url };
}
function createReservation(
  input: BookingInput,
  digest: string,
): Promise<Reservation> {
  return rpc<Reservation>("ca_create_reservation", {
    p: {
      request_id: input.requestId,
      request_digest: digest,
      payment_method: input.paymentMethod,
      start_date: input.start,
      end_date: input.end,
      guests: input.guests,
      locale: input.locale,
      guest: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        message: input.message,
      },
      billing: input.billing,
      issuer: issuer(),
      terms_version: input.termsVersion,
      terms_snapshot: rentalTerms(input.locale),
    },
  });
}
