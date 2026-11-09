import nodemailer from "nodemailer";
import { getSupabaseAdmin } from "../supabase";
import { requiredEnv, siteOrigin } from "./config";
import { money, OWNER_EMAIL } from "./policy";
import { reservation, rpc } from "./repository";
import { formatDeadline, retainedDocument, type DocumentKind } from "./pdf";
import type { OutboxMessage, Reservation } from "./types";
export function mailContent(
  r: Reservation,
  m: OutboxMessage,
): { subject: string; text: string; documents: DocumentKind[] } | null {
  const es = r.locale === "es",
    owner = m.audience === "owner";
  const base = [
    `Casa Atlante · ${r.start_date} → ${r.end_date}`,
    `${es ? "Reserva" : "Booking"}: ${r.id}`,
    `${r.guest.firstName} ${r.guest.lastName} · ${r.guests} ${es ? "huéspedes" : "guests"}`,
    `${es ? "Total (IGIC incluido)" : "Total (including IGIC)"}: ${money(r.total_cents, r.locale)}`,
  ];
  let subject = "",
    intro = "";
  const extra: string[] = [];
  const documents: DocumentKind[] = [];
  switch (m.kind) {
    case "request":
      subject = es
        ? "Solicitud de reserva recibida"
        : "Booking request received";
      intro = es
        ? "Hemos recibido la solicitud. Las fechas todavía no están reservadas. Te enviaremos instrucciones de pago si se aprueba."
        : "We received your request. These dates are not reserved yet. We will send payment instructions if it is approved.";
      break;
    case "approved":
      if (
        r.status !== "awaiting_transfer" ||
        !r.expires_at ||
        Date.parse(r.expires_at) <= Date.now() ||
        m.payload.expires_at !== r.expires_at
      )
        return null;
      subject = es
        ? "Reserva aprobada: instrucciones de transferencia"
        : "Booking approved: bank-transfer instructions";
      intro = es
        ? "Las fechas están reservadas temporalmente. Transfiere el importe íntegro antes del plazo indicado."
        : "Your dates are temporarily reserved. Transfer the full amount before the deadline below.";
      extra.push(
        `${es ? "Plazo" : "Deadline"}: ${formatDeadline(r.expires_at, r.locale)}`,
        `IBAN: ${r.issuer.iban}`,
        `SWIFT: ${r.issuer.swift}`,
        `${es ? "Referencia" : "Reference"}: ${r.id}`,
        es
          ? "Contacta con nosotros si necesitas una prórroga."
          : "Contact us if you need an extension.",
      );
      break;
    case "confirmed":
      if (r.status !== "confirmed") return null;
      subject = es
        ? "Reserva confirmada - ¡Bienvenido a Casa Atlante!"
        : "Booking confirmed - Welcome to Casa Atlante!";
      intro = es
        ? "Hemos recibido el pago completo y tu reserva está confirmada. Adjuntamos la factura pagada y el contrato aceptado. Las instrucciones de acceso se enviarán por separado."
        : "We have received full payment and your booking is confirmed. Your paid invoice and accepted agreement are attached. Access instructions will follow separately.";
      extra.push(
        `${es ? "Método" : "Method"}: ${r.payment_method === "stripe" ? "Stripe" : es ? "Transferencia bancaria" : "Bank transfer"}`,
      );
      documents.push("invoice", "agreement");
      if (owner)
        extra.push(
          "ACTION: manually block these dates on Airbnb and Booking.com. iCal is a delayed backup.",
        );
      break;
    case "conflict":
      if (!r.conflict) return null;
      subject = "ACTION REQUIRED: overlapping Casa Atlante booking";
      intro =
        "A calendar import/payment revealed an overlap. Review the dashboard and Airbnb/Booking.com now. No booking has been cancelled or refunded automatically.";
      break;
    case "operations":
      subject = "ACTION REQUIRED: booking processing needs attention";
      intro =
        "A payment or refund could not be reconciled automatically. Review this booking in the dashboard and Stripe. Automatic retries remain scheduled.";
      break;
    case "expired":
      if (r.status !== "expired") return null;
      subject = es ? "Ha vencido el plazo de pago" : "Payment deadline expired";
      intro = es
        ? "La reserva temporal ha vencido. Si ya has transferido el importe, contacta con nosotros; debemos verificar de nuevo las fechas."
        : "The temporary reservation has expired. If you already transferred payment, contact us; we must check availability again.";
      break;
    case "released":
      subject = es
        ? "Actualización de tu solicitud"
        : "Your booking request has been updated";
      intro = es
        ? "La solicitud se ha rechazado o se han liberado las fechas. No hay una reserva confirmada."
        : "The request was declined or the held dates were released. There is no confirmed reservation.";
      break;
    case "cancelled":
      subject = es ? "Reserva cancelada" : "Booking cancelled";
      intro = es
        ? "La reserva se ha cancelado."
        : "Your booking has been cancelled.";
      extra.push(
        `${es ? "Reembolso" : "Refund"}: ${money(r.refund_cents, r.locale)}`,
        `${es ? "Estado" : "Status"}: ${refundLabel(r, es)}`,
      );
      documents.push("invoice", "agreement");
      if (r.credit_number) documents.push("credit");
      break;
    case "refund_succeeded":
      subject = es ? "Reembolso emitido" : "Refund issued";
      intro = es
        ? "El reembolso se ha emitido. El banco puede tardar varios días en reflejarlo."
        : "Your refund has been issued. Your bank may take several days to display it.";
      extra.push(money(r.refund_cents, r.locale));
      if (r.credit_number) documents.push("credit");
      break;
    case "refund_failed":
      subject = "ACTION REQUIRED: refund failed";
      intro =
        "Stripe reported that the refund failed. Review it in Stripe and arrange the refund with the guest.";
      break;
    default:
      throw new Error("Unknown notification kind");
  }
  if (owner)
    extra.push(
      `Guest email: ${r.guest.email}`,
      `Message: ${r.guest.message}`,
      `Dashboard: ${siteOrigin()}/admin`,
    );
  else
    extra.push(
      es
        ? "Para cualquier consulta, responde a este correo."
        : "For any questions, reply to this email.",
    );
  return {
    subject,
    text: [intro, "", ...base, "", ...extra].join("\n"),
    documents,
  };
}
function refundLabel(r: Reservation, es: boolean): string {
  if (r.refund_state === "succeeded") return es ? "Emitido" : "Issued";
  if (r.refund_state === "none")
    return es ? "No corresponde" : "Not applicable";
  if (r.refund_state === "manual")
    return es
      ? "Pendiente de transferencia por el propietario"
      : "Awaiting owner bank transfer";
  return es ? "En tramitación" : "Being processed";
}
export async function processOutbox(limit = 10): Promise<void> {
  const startedAt = Date.now();
  const db = getSupabaseAdmin();

  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid SMTP port");
  const transport = nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST"),
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: requiredEnv("SMTP_USER"), pass: requiredEnv("SMTP_PASS") },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  for (
    let processed = 0;
    processed < limit && Date.now() - startedAt < 15000;
    processed++
  ) {
    // Claim only the next message: deployment timeouts never strand a whole batch.
    const [m] = await rpc<OutboxMessage[]>("ca_claim_mail", { p_limit: 1 });
    if (!m) break;
    try {
      const r = await reservation(m.booking_id);
      const content = mailContent(r, m);
      if (content) {
        const attachments = await Promise.all(
          content.documents.map(async (kind) => ({
            filename: `${kind}-${r.invoice_number}.pdf`,
            content: await retainedDocument(r, kind),
            contentType: "application/pdf",
          })),
        );
        await transport.sendMail({
          from: process.env.MAIL_FROM || requiredEnv("SMTP_USER"),
          to: m.audience === "owner" ? OWNER_EMAIL : r.guest.email,
          replyTo: m.audience === "owner" ? r.guest.email : OWNER_EMAIL,
          subject: content.subject,
          text: content.text,
          attachments,
          messageId: `<${m.id}@casa-atlante.com>`,
        });
      }
      const { error } = await db
        .from("booking_outbox")
        .update({
          sent_at: new Date().toISOString(),
          locked_until: null,
          last_error: null,
        })
        .eq("id", m.id)
        .eq("claim_token", m.claim_token);
      if (error) throw new Error("Mail acknowledgement failed");
    } catch {
      const delay = Math.min(3600, 30 * 2 ** Math.min(m.attempts, 7));
      await db
        .from("booking_outbox")
        .update({
          locked_until: null,
          last_error: "Delivery failed; retry scheduled",
          available_at: new Date(Date.now() + delay * 1000).toISOString(),
        })
        .eq("id", m.id)
        .eq("claim_token", m.claim_token);
      console.error("Booking email needs retry", { messageId: m.id });
    }
  }
  transport.close();
}
