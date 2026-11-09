import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  isDate,
  quoteStay,
  refundPercent,
  parseBookingInput,
  TERMS_VERSION,
} from "../src/lib/booking/policy";
import { parseICal, exportICal } from "../src/lib/booking/ical";
import { rentalTerms } from "../src/lib/booking/terms";
const valid = () => ({
  requestId: randomUUID(),
  firstName: "María",
  lastName: "García",
  email: " TEST@example.com ",
  message: "",
  start: "2027-06-01",
  end: "2027-06-05",
  guests: 2,
  locale: "es",
  paymentMethod: "stripe",
  billing: {
    kind: "individual",
    name: "María García",
    address: "Calle 1, 38759 El Paso",
    country: "es",
    taxId: "TEST",
  },
  termsVersion: TERMS_VERSION,
  termsAccepted: true,
  privacyAccepted: true,
});
test("quote uses €89, integer cents, extra guests and rounded IGIC", () => {
  assert.deepEqual(quoteStay("2027-06-01", "2027-06-05", 2), {
    nights: 4,
    nightly: 8900,
    subtotal: 35600,
    tax: 2492,
    total: 38092,
    extraGuests: 0,
  });
  assert.equal(quoteStay("2027-06-01", "2027-06-05", 4).total, 55212);
  assert.throws(() => quoteStay("2027-06-01", "2027-06-05", 2.5));
  assert.throws(() => quoteStay("2027-06-01", "2027-06-04", 2));
});
test("external input is normalized and invalid dates/consents/billing are rejected", () => {
  const now = new Date("2026-10-03T12:00:00Z");
  assert.equal(parseBookingInput(valid(), now).email, "test@example.com");
  assert.equal(parseBookingInput(valid(), now).billing.country, "ES");
  assert.equal(isDate("2027-02-29"), false);
  assert.equal(isDate("2028-02-29"), true);
  for (const patch of [
    { guests: 2.5 },
    { start: "2027-02-30" },
    { email: "bad\n@example.com" },
    { termsAccepted: false },
    { privacyAccepted: false },
    { termsVersion: "old" },
    { firstName: { x: 1 } },
    { billing: { ...valid().billing, taxId: "" } },
    { start: "2026-10-04", end: "2026-10-08" },
  ])
    assert.throws(() => parseBookingInput({ ...valid(), ...patch }, now));
});
test("cancellation cutoffs include 23:59 in Canary time across DST", () => {
  const checkin = "2026-10-30";
  assert.equal(refundPercent(checkin, new Date("2026-10-16T22:59:59Z")), 100);
  assert.equal(refundPercent(checkin, new Date("2026-10-16T23:00:00Z")), 50);
  assert.equal(refundPercent(checkin, new Date("2026-10-23T22:59:59Z")), 50);
  assert.equal(refundPercent(checkin, new Date("2026-10-23T23:00:00Z")), 0);
  assert.equal(
    refundPercent(checkin, new Date("2026-10-29T23:00:00Z"), true),
    100,
  );
  assert.equal(
    refundPercent("2026-04-12", new Date("2026-03-29T22:59:59Z")),
    100,
  );
  assert.equal(
    refundPercent("2026-04-12", new Date("2026-03-29T23:00:00Z")),
    50,
  );
});
const calendar = (event: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${event}END:VCALENDAR\r\n`;
const event = (extra = "") =>
  `BEGIN:VEVENT\r\nUID:test-1\r\nDTSTART;VALUE=DATE:20270601\r\nDTEND;VALUE=DATE:20270605\r\n${extra}END:VEVENT\r\n`;
test("iCal accepts valid empty feeds, unfolding and cancellations; rejects malformed/recurring feeds", () => {
  assert.deepEqual(parseICal(calendar(""), "airbnb"), []);
  assert.equal(parseICal(calendar(event()), "airbnb").length, 1);
  assert.equal(
    parseICal(calendar(event("STATUS:CANCELLED\r\n")), "airbnb").length,
    0,
  );
  assert.equal(
    parseICal(calendar(event().replace("test-1", "test-\r\n 1")), "airbnb")
      .length,
    1,
  );
  assert.throws(() => parseICal("<html>error</html>", "airbnb"));
  assert.throws(() =>
    parseICal(calendar(event("RRULE:FREQ=DAILY\r\n")), "airbnb"),
  );
  assert.throws(() =>
    parseICal(calendar(event().replace("20270601", "20270230")), "airbnb"),
  );
  assert.throws(() =>
    parseICal(calendar(event().replace("UID:test-1\r\n", "")), "airbnb"),
  );
});
test("export has stable UIDs, exclusive checkout dates, no personal data and no reimport loops", () => {
  const exportText = exportICal([
    {
      id: randomUUID(),
      start_date: "2027-06-01",
      end_date: "2027-06-05",
      updated_at: "2026-10-03T12:00:00Z",
    },
  ]);
  assert.match(exportText, /DTEND;VALUE=DATE:20270605/);
  assert.match(exportText, /SUMMARY:Unavailable/);
  assert.deepEqual(parseICal(exportText, "booking.com"), []);
});
test("both accepted agreements preserve house rules and remove obsolete PayPal/service fees", () => {
  for (const locale of ["en", "es"] as const) {
    const text = rentalTerms(locale).join("\n");
    assert.match(text, /Atlantic\/Canary/);
    assert.doesNotMatch(text, /PayPal|less the service fee|menos la comisión/);
    assert.match(text, /23:00|11 p.m./);
  }
});
