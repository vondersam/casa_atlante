import { getSupabaseAdmin } from "../supabase";
import { BookingError } from "./policy";
import type { Reservation } from "./types";
const expectedErrors = new Set([
  "not_found",
  "dates_unavailable",
  "calendar_unavailable",
  "idempotency_conflict",
  "invalid_transition",
  "arrival_too_soon",
  "invalid_deadline",
  "invalid_request",
  "refund_quote_changed",
  "payment_mismatch",
]);
export async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await getSupabaseAdmin().rpc(name, args).returns<T>();
  if (error) {
    if (expectedErrors.has(error.message))
      throw new BookingError(
        error.message,
        error.message === "not_found"
          ? 404
          : error.message === "calendar_unavailable"
            ? 503
            : 409,
      );
    throw new Error(`Database operation failed: ${name} (${error.code})`);
  }
  if (data === null)
    throw new Error(`Database operation returned no result: ${name}`);
  // The result contract is owned by our versioned SQL migration, not browser input.
  return data as T;
}
export async function reservation(id: string): Promise<Reservation> {
  const { data, error } = await getSupabaseAdmin()
    .from("reservations")
    .select("*")
    .eq("id", id)
    .returns<Reservation[]>()
    .single();
  if (error || !data) throw new BookingError("not_found", 404);
  return data;
}
export async function reservationByRequest(
  id: string,
): Promise<Reservation | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("reservations")
    .select("*")
    .eq("request_id", id)
    .returns<Reservation[]>()
    .maybeSingle();
  if (error) throw new Error("Failed to find request");
  return data;
}
export function transition(
  id: string,
  action: string,
  data: Record<string, unknown> = {},
  actor = "system",
): Promise<Reservation> {
  return rpc<Reservation>("ca_transition", {
    p_id: id,
    p_action: action,
    p_data: data,
    p_actor: actor,
  });
}
