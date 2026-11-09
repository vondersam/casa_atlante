import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { OWNER_EMAIL, BookingError } from "./policy";
import { requiredEnv } from "./config";
export const AUTH_COOKIE = "ca_owner_session";
export function authClient() {
  // Isolated per request: signing in must never mutate the shared privileged database client.
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function requireOwner(): Promise<string> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) throw new BookingError("unauthorized", 401);
  const { data, error } = await authClient().auth.getUser(token);
  if (
    error ||
    !data.user ||
    data.user.email?.toLowerCase() !== OWNER_EMAIL ||
    !data.user.email_confirmed_at
  )
    throw new BookingError("unauthorized", 401);
  return data.user.id;
}
