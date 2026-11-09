import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { BookingError, type Locale } from "./policy";
import { siteOrigin } from "./config";
import { rpc } from "./repository";
export function secretMatches(
  actual: string | null,
  expected: string | undefined,
): boolean {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function requireSameOrigin(req: NextRequest): void {
  if (req.headers.get("origin") !== siteOrigin())
    throw new BookingError("unauthorized", 403);
}
export async function readJson(req: NextRequest): Promise<unknown> {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new BookingError("invalid_request");
  if (Number(req.headers.get("content-length") || 0) > 16384)
    throw new BookingError("invalid_request", 413);
  const body = await req.text();
  if (Buffer.byteLength(body) > 16384)
    throw new BookingError("invalid_request", 413);
  try {
    return JSON.parse(body);
  } catch {
    throw new BookingError("invalid_request");
  }
}
export async function rateLimit(
  req: NextRequest,
  scope: string,
  limit = 10,
  seconds = 300,
): Promise<void> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${createHash("sha256").update(ip).digest("hex")}`;
  if (
    !(await rpc<boolean>("ca_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_seconds: seconds,
    }))
  )
    throw new BookingError("rate_limited", 429);
}
const errors: Record<string, [string, string]> = {
  invalid_request: [
    "Please check the information provided.",
    "Revisa los datos introducidos.",
  ],
  invalid_stay: [
    "Choose a stay of 4–365 nights and 1–4 guests.",
    "Elige una estancia de 4–365 noches y 1–4 huéspedes.",
  ],
  invalid_email: [
    "Enter a valid email address.",
    "Introduce un correo electrónico válido.",
  ],
  unsupported_document_text: [
    "Some characters cannot be printed on the invoice. Please use a Latin-script spelling for names and billing details.",
    "Algunos caracteres no se pueden imprimir en la factura. Utiliza una transcripción en alfabeto latino para los nombres y datos de facturación.",
  ],
  invalid_billing: [
    "Check the billing details and country code.",
    "Revisa los datos de facturación y el código de país.",
  ],
  terms_required: [
    "Please review and accept the current agreement and privacy notice.",
    "Revisa y acepta el contrato vigente y el aviso de privacidad.",
  ],
  arrival_too_soon: [
    "Check-in must be at least two days away.",
    "La entrada debe ser al menos dentro de dos días.",
  ],
  dates_unavailable: [
    "These dates are no longer available. Please choose another stay.",
    "Estas fechas ya no están disponibles. Elige otra estancia.",
  ],
  calendar_unavailable: [
    "We cannot verify the calendars right now. You can send a bank-transfer request instead.",
    "No podemos verificar los calendarios ahora. Puedes enviar una solicitud de transferencia.",
  ],
  checkout_unavailable: [
    "Instant payment is temporarily unavailable. You can send a bank-transfer request.",
    "El pago inmediato no está disponible temporalmente. Puedes solicitar una transferencia.",
  ],
  rate_limited: [
    "Too many attempts. Please try again later.",
    "Demasiados intentos. Vuelve a intentarlo más tarde.",
  ],
  unauthorized: ["Please sign in again.", "Vuelve a iniciar sesión."],
  not_found: ["Booking not found.", "Reserva no encontrada."],
  idempotency_conflict: [
    "The previous request has different details. Start a new request.",
    "La solicitud anterior tiene otros datos. Inicia una nueva solicitud.",
  ],
  invalid_transition: [
    "This booking has changed. Refresh before trying again.",
    "La reserva ha cambiado. Actualiza antes de continuar.",
  ],
  invalid_deadline: [
    "Choose a later deadline before arrival.",
    "Elige un plazo posterior y anterior a la llegada.",
  ],
  refund_quote_changed: [
    "The refund amount changed. Review the new amount before confirming.",
    "El reembolso ha cambiado. Revisa el importe antes de confirmar.",
  ],
};
export function apiError(error: unknown, locale: Locale = "en"): NextResponse {
  if (error instanceof BookingError) {
    const message = errors[error.code] || [
      "The action could not be completed.",
      "No se pudo completar la acción.",
    ];
    return NextResponse.json(
      { error: message[locale === "es" ? 1 : 0], code: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  // Never expose provider responses, credentials, guest details or raw exception messages.
  console.error("Booking operation failed", {
    type: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    {
      error:
        locale === "es"
          ? "Servicio no disponible temporalmente. Inténtalo de nuevo."
          : "Service temporarily unavailable. Please try again.",
      code: "service_unavailable",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
