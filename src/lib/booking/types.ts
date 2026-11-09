import type { Billing, Locale, PaymentMethod } from "./policy";
export type Issuer = {
  name: string;
  taxId: string;
  address: string;
  iban: string;
  swift: string;
};
export type Reservation = {
  id: string;
  request_id: string;
  request_digest: string;
  status_token: string;
  status:
    | "request"
    | "checkout"
    | "awaiting_transfer"
    | "confirmed"
    | "expired"
    | "rejected"
    | "cancelled";
  payment_method: PaymentMethod;
  start_date: string;
  end_date: string;
  guests: number;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  };
  billing: Billing;
  issuer: Issuer;
  locale: Locale;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  terms_version: string;
  terms_snapshot: string[];
  accepted_at: string;
  privacy_accepted_at: string;
  expires_at: string | null;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  refund_cents: number;
  refund_state: "none" | "pending" | "manual" | "succeeded" | "failed";
  stripe_refund_id: string | null;
  credit_number: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  conflict: boolean;
  conflict_key: string | null;
  acknowledged_conflict_key: string | null;
  created_at: string;
  updated_at: string;
};
export type OutboxMessage = {
  id: string;
  booking_id: string;
  kind: string;
  audience: "owner" | "guest";
  attempts: number;
  payload: { expires_at?: string };
  claim_token: string;
};
