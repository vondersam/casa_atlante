import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import Stripe from "stripe";
import {
  renderBookingPdf,
  validateDocumentFields,
} from "../src/lib/booking/pdf";
import { mailContent } from "../src/lib/booking/mail";
import { rentalTerms } from "../src/lib/booking/terms";
import { sampleReservation } from "./fixtures";
import type { OutboxMessage } from "../src/lib/booking/types";
const message = (
  kind: string,
  audience: "owner" | "guest" = "guest",
): OutboxMessage => ({
  id: "test",
  booking_id: "test",
  kind,
  audience,
  attempts: 1,
  payload: {},
  claim_token: "test",
});
test("invoice, accepted agreement and credit note render as readable PDFs", async () => {
  const r = sampleReservation();
  for (const kind of ["invoice", "agreement", "credit"] as const) {
    const bytes = await renderBookingPdf(r, kind);
    const pdf = await PDFDocument.load(bytes);
    assert.ok(pdf.getPageCount() >= 1);
    assert.ok(pdf.getPageCount() < 6);
    assert.match(pdf.getTitle() || "", /Casa Atlante/);
  }
  const spanish = await renderBookingPdf(
    sampleReservation({ locale: "es", terms_snapshot: rentalTerms("es") }),
    "agreement",
  );
  assert.ok((await PDFDocument.load(spanish)).getPageCount() >= 2);
});
test("confirmation explicitly tells the owner to update external calendars and attaches PDFs", () => {
  process.env.SITE_URL = "https://www.casa-atlante.com";
  const content = mailContent(
    sampleReservation(),
    message("confirmed", "owner"),
  );
  assert.ok(content);
  assert.match(content.text, /manually block.*Airbnb.*Booking.com/);
  assert.deepEqual(content.documents, ["invoice", "agreement"]);
});
test("stale payment instructions are not sent after a booking is confirmed or deadline changed", () => {
  assert.equal(mailContent(sampleReservation(), message("approved")), null);
  const r = sampleReservation({
    status: "awaiting_transfer",
    expires_at: "2099-01-01T12:00:00Z",
  });
  assert.equal(
    mailContent(r, {
      ...message("approved"),
      payload: { expires_at: "2099-01-01T10:00:00Z" },
    }),
    null,
  );
});
test("bank request acknowledgement cannot be mistaken for confirmation", () => {
  const content = mailContent(
    sampleReservation({ status: "request", paid_at: null }),
    message("request"),
  );
  assert.ok(content);
  assert.match(content.text, /not reserved yet/);
  assert.deepEqual(content.documents, []);
});
test("Stripe rejects invalid signatures and accepts correctly signed events", () => {
  const stripe = new Stripe("sk_test_not_a_real_key");
  const payload = JSON.stringify({
    id: "evt_test",
    object: "event",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test", object: "checkout.session" } },
  });
  const secret = "whsec_test_fixture";
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_test",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
});

test("document fields preserve accented names and reject unrenderable characters before payment", async () => {
  await validateDocumentFields(["María García López", "Straße", "Łódź"]);
  await assert.rejects(
    validateDocumentFields(["旅客"]),
    /unsupported_document_text/,
  );
});
