"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/i18n/context";
import { localizePath } from "@/i18n/path";
import { money } from "@/lib/booking/policy";
type Status = {
  status: string;
  reference: string;
  start: string;
  end: string;
  total: number;
  expiresAt: string | null;
};
export default function BookingStatus() {
  const token = useSearchParams().get("token"),
    locale = useLocale(),
    es = locale === "es";
  const [data, setData] = useState<Status | null>(null),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function poll() {
      try {
        const response = await fetch(
          `/api/booking-status?token=${encodeURIComponent(token || "")}`,
          { cache: "no-store" },
        );
        const result = await response.json();
        if (cancelled) return;
        if (!response.ok)
          throw new Error(result.error || "Unable to load booking");
        setData(result);
        setError("");
        if (result.status === "checkout" && ++attempts < 20)
          timer = setTimeout(poll, 3000);
      } catch {
        if (!cancelled)
          setError(
            es
              ? "No se pudo actualizar el estado. Vuelve a intentarlo."
              : "Could not refresh the status. Please try again.",
          );
      }
    }
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token, es, refresh]);
  const text: Record<string, [string, string]> = {
    request: [
      "Request received. These dates are not reserved yet. We will email you when the request is reviewed.",
      "Solicitud recibida. Las fechas todavía no están reservadas. Te avisaremos por correo cuando se revise.",
    ],
    checkout: [
      "Payment is not confirmed yet. If you paid, confirmation will appear after verification. You will also receive an email. Unpaid checkout holds expire automatically.",
      "El pago aún no está confirmado. Si has pagado, la confirmación aparecerá tras verificarlo. También recibirás un correo. Las reservas temporales sin pagar caducan automáticamente.",
    ],
    confirmed: [
      "Your booking is confirmed. Your welcome email, paid invoice and agreement are being delivered. Access instructions will follow separately.",
      "Tu reserva está confirmada. Te enviaremos el correo de bienvenida, la factura pagada y el contrato. Las instrucciones de acceso se enviarán por separado.",
    ],
    awaiting_transfer: [
      "Your request is approved. Check your email for bank-transfer instructions and the payment deadline.",
      "Tu solicitud está aprobada. Revisa tu correo para ver las instrucciones de transferencia y el plazo.",
    ],
    expired: [
      "The temporary reservation expired. If you already sent payment, contact us before making another payment.",
      "La reserva temporal ha caducado. Si ya has enviado el pago, contacta con nosotros antes de pagar de nuevo.",
    ],
    rejected: [
      "The request could not be approved. Please contact us for alternatives.",
      "La solicitud no se ha aprobado. Contacta con nosotros para consultar alternativas.",
    ],
    cancelled: [
      "This booking has been cancelled. Check your email for refund details.",
      "Esta reserva está cancelada. Revisa tu correo para consultar el reembolso.",
    ],
  };
  return (
    <section className="section">
      <div className="content-width booking-card">
        <h1>{es ? "Estado de la reserva" : "Booking status"}</h1>
        <div role="status" aria-live="polite">
          <p>
            {data
              ? text[data.status]?.[es ? 1 : 0]
              : es
                ? "Comprobando…"
                : "Checking…"}
          </p>
        </div>
        {data && (
          <>
            <p>
              {data.start} → {data.end} · {money(data.total, locale)}
            </p>
            <p className="small">
              {es ? "Referencia" : "Reference"}: {data.reference}
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="hero-actions">
          <button className="btn" onClick={() => setRefresh((n) => n + 1)}>
            {es ? "Actualizar estado" : "Refresh status"}
          </button>
          <a className="btn secondary" href={localizePath("/booking", locale)}>
            {es ? "Volver a reservas" : "Back to booking"}
          </a>
        </div>
      </div>
    </section>
  );
}
