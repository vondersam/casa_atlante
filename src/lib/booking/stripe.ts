import Stripe from "stripe";
import { requiredEnv, siteOrigin } from "./config";
import { BookingError } from "./policy";
import { reservation, transition } from "./repository";
import type { Reservation } from "./types";
import { getSupabaseAdmin } from "../supabase";
let client: Stripe | undefined;
export function stripeClient(): Stripe {
  return (client ??= new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
    timeout: 8000,
    maxNetworkRetries: 0,
    apiVersion: "2026-09-30.endive",
  }));
}
function statusUrl(r: Reservation): string {
  return `${siteOrigin()}${r.locale === "es" ? "/es" : ""}/booking/status?token=${r.status_token}`;
}
export async function createCheckout(
  r: Reservation,
  retry = false,
): Promise<string> {
  const stripe = stripeClient();
  if (r.status !== "checkout")
    throw new BookingError("invalid_transition", 409);
  let session: Stripe.Checkout.Session;
  if (r.stripe_session_id)
    session = await stripe.checkout.sessions.retrieve(r.stripe_session_id);
  else {
    // All parameters are frozen on the reservation: an uncertain retry uses exactly the same key/body.
    if (!r.expires_at || Date.parse(r.expires_at) < Date.now())
      throw new BookingError("invalid_transition", 409);
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          allowed_payment_method_types: ["card"],
          customer_email: r.guest.email,
          locale: r.locale,
          client_reference_id: r.id,
          expires_at: Math.ceil(Date.parse(r.expires_at) / 1000),
          metadata: { reservation_id: r.id, request_digest: r.request_digest },
          payment_intent_data: { metadata: { reservation_id: r.id } },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "eur",
                unit_amount: r.total_cents,
                product_data: {
                  name: `Casa Atlante · ${r.start_date} – ${r.end_date}`,
                  description:
                    r.locale === "es"
                      ? "Estancia completa, IGIC incluido"
                      : "Full stay, including IGIC",
                },
              },
            },
          ],
          success_url: statusUrl(r),
          cancel_url: statusUrl(r),
        },
        { idempotencyKey: `booking:${r.id}` },
      );
    } catch (error) {
      // Stripe does not retain idempotency results for validation failures. Renew only
      // an uncreated, recent session after a transport delay made its expiry too short.
      if (
        !retry &&
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.param === "expires_at"
      ) {
        const renewed = await transition(r.id, "renew_checkout_creation", {
          expected_expiry: r.expires_at,
        });
        return createCheckout(renewed, true);
      }
      throw error;
    }
    await transition(r.id, "attach_session", {
      session_id: session.id,
      expires_at: new Date(session.expires_at * 1000).toISOString(),
    });
  }
  if (session.status !== "open" || !session.url) return statusUrl(r);
  return session.url;
}
export async function settleSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const id = session.metadata?.reservation_id;
  if (!id) return;
  const r = await reservation(id);
  if (
    session.metadata?.request_digest !== r.request_digest ||
    session.client_reference_id !== r.id ||
    session.mode !== "payment"
  )
    throw new Error("Session mismatch");
  if (session.payment_status === "paid") {
    const paymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (
      !paymentId ||
      session.amount_total !== r.total_cents ||
      session.currency !== "eur"
    )
      throw new Error("Payment mismatch");
    await transition(r.id, "confirm_stripe", {
      session_id: session.id,
      payment_id: paymentId,
      total: session.amount_total,
      currency: session.currency,
    });
  } else if (session.status === "expired")
    await transition(r.id, "expire_checkout", { session_id: session.id });
}
export async function reconcileCheckout(r: Reservation): Promise<void> {
  if (r.status !== "checkout") return;
  const stripe = stripeClient();
  let session: Stripe.Checkout.Session | undefined;
  if (r.stripe_session_id)
    session = await stripe.checkout.sessions.retrieve(r.stripe_session_id);
  else {
    // Recover a successful create whose response/DB write was lost. Never blindly recreate after key expiry.
    const sessions = stripe.checkout.sessions.list({
      created: {
        gte: Math.floor(Date.parse(r.created_at) / 1000) - 5,
        lte: Math.ceil(Date.parse(r.expires_at || r.created_at) / 1000) + 60,
      },
      limit: 100,
    });
    let scanned = 0;
    for await (const candidate of sessions) {
      if (++scanned > 1000)
        throw new Error("Checkout recovery requires owner review");
      if (candidate.metadata?.reservation_id === r.id) {
        session = candidate;
        break;
      }
    }
    if (!session) {
      // Allow all bounded in-flight create attempts to finish before declaring that none was created.
      if (r.expires_at && Date.parse(r.expires_at) + 10 * 60000 < Date.now())
        await transition(r.id, "expire_checkout");
      return;
    }
    await transition(r.id, "attach_session", {
      session_id: session.id,
      expires_at: new Date(session.expires_at * 1000).toISOString(),
    });
  }
  if (
    session.status === "open" &&
    r.expires_at &&
    Date.parse(r.expires_at) <= Date.now()
  ) {
    try {
      session = await stripe.checkout.sessions.expire(session.id);
    } catch {
      session = await stripe.checkout.sessions.retrieve(session.id);
    }
  }
  await settleSession(session);
}
export async function reconcileRefund(r: Reservation): Promise<void> {
  if (
    r.payment_method !== "stripe" ||
    r.refund_state !== "pending" ||
    !r.stripe_payment_id
  )
    return;
  const stripe = stripeClient();
  let refund: Stripe.Refund | undefined;
  if (r.stripe_refund_id)
    refund = await stripe.refunds.retrieve(r.stripe_refund_id);
  else {
    // Durable recovery beyond Stripe's idempotency retention window.
    for await (const existing of stripe.refunds.list({
      payment_intent: r.stripe_payment_id,
      limit: 100,
    })) {
      if (existing.metadata?.reservation_id === r.id) {
        refund = existing;
        break;
      }
    }
    if (!refund)
      refund = await stripe.refunds.create(
        {
          payment_intent: r.stripe_payment_id,
          amount: r.refund_cents,
          metadata: { reservation_id: r.id },
        },
        { idempotencyKey: `refund:${r.id}` },
      );
  }
  if (refund.amount !== r.refund_cents)
    throw new Error("Refund amount mismatch");
  await transition(r.id, "refund_result", {
    refund_id: refund.id,
    state:
      refund.status === "succeeded"
        ? "succeeded"
        : refund.status === "failed" || refund.status === "canceled"
          ? "failed"
          : "pending",
  });
}
export async function reconcilePayments(): Promise<void> {
  const startedAt = Date.now();
  const { data, error } = await getSupabaseAdmin()
    .from("reservations")
    .select("*")
    .or(
      "status.eq.checkout,refund_state.eq.pending,status.eq.awaiting_transfer",
    )
    .order("updated_at")
    .limit(20)
    .returns<Reservation[]>();
  if (error) throw new Error("Failed to load pending bookings");
  for (const r of data || []) {
    if (Date.now() - startedAt > 15000) break;
    try {
      if (r.status === "checkout") await reconcileCheckout(r);
      if (r.status === "awaiting_transfer")
        await transition(r.id, "expire_bank");
      if (r.refund_state === "pending") await reconcileRefund(r);
    } catch {
      await getSupabaseAdmin().rpc("ca_enqueue", {
        p_id: r.id,
        p_kind: "operations",
        p_key: `${r.id}:operations`,
        p_payload: {},
        p_owner_only: true,
      });
      console.error("Booking reconciliation needs retry", { bookingId: r.id });
    } finally {
      // Rotate pending work so one failing provider request cannot starve later bookings.
      await getSupabaseAdmin()
        .from("reservations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", r.id);
    }
  }
}
