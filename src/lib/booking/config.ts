import type { Issuer } from "./types";
export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
export function siteOrigin(): string {
  const url = new URL(requiredEnv("SITE_URL"));
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && url.hostname === "localhost"))
  )
    throw new Error("Invalid SITE_URL");
  return url.origin;
}
export function issuer(): Issuer {
  return {
    name: process.env.INVOICE_ISSUER_NAME?.trim() || "Samuel Rodriguez Medina",
    taxId: requiredEnv("NIF"),
    address:
      process.env.INVOICE_ISSUER_ADDRESS?.trim() ||
      "Carretera General Jedey 42, 38759 El Paso, La Palma, España",
    iban: requiredEnv("IBAN"),
    swift: requiredEnv("SWIFT"),
  };
}
export function assertBookingConfiguration(): void {
  issuer();
  siteOrigin();
  for (const key of [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ])
    requiredEnv(key);
}
