export const TERMS_VERSION = "2026-10-03";
export const OWNER_EMAIL = "casa.atlante.lapalma@gmail.com";
export const NIGHTLY_BASE_CENTS = 8900;
export const EXTRA_GUEST_CENTS = 2000;
export const MIN_NIGHTS = 4;
export const MAX_NIGHTS = 365;
export const CHECKOUT_MINUTES = 30;
export const BANK_HOLD_HOURS = 48;
export type Locale = "en" | "es";
export type PaymentMethod = "stripe" | "bank";
export type Billing = {
  kind: "individual" | "company";
  name: string;
  address: string;
  country: string;
  taxId: string;
};
export type BookingInput = {
  requestId: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  guests: number;
  start: string;
  end: string;
  locale: Locale;
  paymentMethod: PaymentMethod;
  billing: Billing;
  termsVersion: string;
  termsAccepted: true;
  privacyAccepted: true;
};
export type Quote = {
  nights: number;
  nightly: number;
  subtotal: number;
  tax: number;
  total: number;
  extraGuests: number;
};
export class BookingError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function nightsBetween(start: string, end: string): number {
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
      86400000,
  );
}
export function canaryDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Canary",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function quoteStay(start: string, end: string, guests: number): Quote {
  const nights = nightsBetween(start, end);
  if (
    !isDate(start) ||
    !isDate(end) ||
    nights < MIN_NIGHTS ||
    nights > MAX_NIGHTS ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > 4
  )
    throw new BookingError("invalid_stay");
  const extraGuests = Math.max(0, guests - 2);
  const nightly = NIGHTLY_BASE_CENTS + extraGuests * EXTRA_GUEST_CENTS;
  const subtotal = nightly * nights;
  const tax = Math.round((subtotal * 7) / 100);
  return { nights, nightly, subtotal, tax, total: subtotal + tax, extraGuests };
}
export function refundPercent(
  start: string,
  now = new Date(),
  ownerCancellation = false,
): number {
  if (ownerCancellation) return 100;
  // Calendar-date cutoffs include the entire deadline day in Atlantic/Canary (including DST).
  const days = nightsBetween(canaryDate(now), start);
  return days >= 14 ? 100 : days >= 7 ? 50 : 0;
}
export function money(cents: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BookingError("invalid_request");
  return value as Record<string, unknown>;
}
export function field(value: unknown, max: number, required = true): string {
  if (typeof value !== "string") throw new BookingError("invalid_request");
  const normalized = value.trim().normalize("NFC");
  if (
    (required && !normalized) ||
    normalized.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)
  )
    throw new BookingError("invalid_request");
  return normalized;
}
export function parseBookingInput(
  value: unknown,
  now = new Date(),
): BookingInput {
  const b = record(value);
  if (
    typeof b.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      b.requestId,
    )
  )
    throw new BookingError("invalid_request");
  if (b.locale !== "en" && b.locale !== "es")
    throw new BookingError("invalid_request");
  if (b.paymentMethod !== "stripe" && b.paymentMethod !== "bank")
    throw new BookingError("invalid_request");
  if (
    b.termsAccepted !== true ||
    b.privacyAccepted !== true ||
    b.termsVersion !== TERMS_VERSION
  )
    throw new BookingError("terms_required");
  if (!isDate(b.start) || !isDate(b.end) || typeof b.guests !== "number")
    throw new BookingError("invalid_stay");
  quoteStay(b.start, b.end, b.guests);
  if (b.start < addDays(canaryDate(now), 2))
    throw new BookingError("arrival_too_soon");
  const email = field(b.email, 254).toLowerCase();
  if (
    !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
      email,
    ) ||
    email.startsWith(".") ||
    email.includes("..") ||
    email.includes(".@")
  )
    throw new BookingError("invalid_email");
  const billing = record(b.billing);
  if (billing.kind !== "individual" && billing.kind !== "company")
    throw new BookingError("invalid_billing");
  const country = field(billing.country, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new BookingError("invalid_billing");
  return {
    requestId: b.requestId,
    firstName: field(b.firstName, 100),
    lastName: field(b.lastName, 100),
    email,
    message: field(b.message, 2000, false),
    guests: b.guests,
    start: b.start,
    end: b.end,
    locale: b.locale,
    paymentMethod: b.paymentMethod,
    termsVersion: TERMS_VERSION,
    termsAccepted: true,
    privacyAccepted: true,
    billing: {
      kind: billing.kind,
      name: field(billing.name, 200),
      address: field(billing.address, 500),
      country,
      taxId: field(
        billing.taxId,
        60,
        billing.kind === "company" || country === "ES",
      ),
    },
  };
}
