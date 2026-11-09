import { after, NextRequest, NextResponse } from "next/server";
import {
  stripeClient,
  settleSession,
  reconcileRefund,
} from "@/lib/booking/stripe";
import { requiredEnv } from "@/lib/booking/config";
import { reservation } from "@/lib/booking/repository";
import { processOutbox } from "@/lib/booking/mail";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || Number(req.headers.get("content-length") || 0) > 262144)
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  const body = await req.text();
  if (Buffer.byteLength(body) > 262144)
    return NextResponse.json({ error: "Invalid webhook" }, { status: 413 });
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      body,
      signature,
      requiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    if (
      [
        "checkout.session.completed",
        "checkout.session.expired",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    ) {
      const object = event.data.object;
      if (object.object === "checkout.session")
        await settleSession(
          await stripeClient().checkout.sessions.retrieve(object.id),
        );
    } else if (
      event.type === "refund.updated" ||
      event.type === "refund.created" ||
      event.type === "refund.failed"
    ) {
      const object = event.data.object;
      if (object.object === "refund" && object.metadata?.reservation_id)
        await reconcileRefund(
          await reservation(object.metadata.reservation_id),
        );
    }
    after(async () => {
      try {
        await processOutbox();
      } catch {
        console.error("Webhook mail worker needs retry");
      }
    });
    return NextResponse.json({ received: true });
  } catch {
    console.error("Stripe webhook processing needs retry", {
      eventId: event.id,
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
