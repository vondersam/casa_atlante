import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { BookingError, money, type Locale } from "./policy";
import type { Reservation } from "./types";
import { getSupabaseAdmin } from "../supabase";
export type DocumentKind = "invoice" | "agreement" | "credit";
let fontBytes: Promise<Buffer> | undefined;
let supportedCharacters: Promise<Set<number>> | undefined;
export async function validateDocumentFields(values: string[]): Promise<void> {
  supportedCharacters ??= (async () => {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    fontBytes ??= readFile(
      path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf"),
    );
    return new Set(
      (
        await pdf.embedFont(await fontBytes, { subset: true })
      ).getCharacterSet(),
    );
  })();
  const supported = await supportedCharacters;
  if (
    values.some((value) =>
      [...value].some(
        (char) => !/\s/.test(char) && !supported.has(char.codePointAt(0) || 0),
      ),
    )
  )
    throw new BookingError("unsupported_document_text");
}
export async function renderBookingPdf(
  r: Reservation,
  kind: DocumentKind,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  fontBytes ??= readFile(
    path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf"),
  );
  const font = await pdf.embedFont(await fontBytes, { subset: true });
  const es = r.locale === "es";
  const title =
    kind === "agreement"
      ? es
        ? "Contrato de alquiler vacacional"
        : "Vacation rental agreement"
      : kind === "credit"
        ? "Factura rectificativa / Credit note"
        : "Factura / Invoice";
  const issued = kind === "credit" ? r.cancelled_at : r.paid_at;
  pdf.setTitle(`${title} - Casa Atlante`);
  pdf.setAuthor("Casa Atlante");
  pdf.setCreationDate(new Date(issued || r.created_at));
  pdf.setModificationDate(new Date(issued || r.created_at));
  const format = (date: string | null) =>
    date
      ? new Intl.DateTimeFormat(es ? "es-ES" : "en-GB", {
          dateStyle: "medium",
          timeZone: "Atlantic/Canary",
        }).format(new Date(date))
      : "-";
  const lines: string[] = [];
  if (kind === "agreement") {
    lines.push(
      `${es ? "Reserva" : "Booking"}: ${r.id}`,
      `${r.guest.firstName} ${r.guest.lastName} · ${r.guests} ${es ? "huéspedes" : "guests"}`,
      `${r.start_date} - ${r.end_date}`,
      `${es ? "Total pagado" : "Total paid"}: ${money(r.total_cents, r.locale)}`,
      `${es ? "Aceptado" : "Accepted"}: ${r.accepted_at} · ${es ? "Versión" : "Version"} ${r.terms_version}`,
      "",
      ...r.terms_snapshot,
    );
  } else {
    lines.push(
      r.issuer.name,
      `NIF: ${r.issuer.taxId}`,
      r.issuer.address,
      "",
      `${kind === "credit" ? "Rectificativa / Credit note" : "Factura / Invoice"}: ${kind === "credit" ? r.credit_number : r.invoice_number}`,
      `Fecha de emisión / Issue date: ${format(issued)}`,
      `Fecha de pago / Payment date: ${format(r.paid_at)}`,
      `Reserva / Booking: ${r.id}`,
      "",
      `Cliente / Customer: ${r.billing.name}`,
      r.billing.address,
      r.billing.country,
      r.billing.taxId ? `NIF / Tax ID: ${r.billing.taxId}` : "",
      r.guest.email,
      "",
      `Estancia / Stay: ${r.start_date} - ${r.end_date}`,
      `Huéspedes / Guests: ${r.guests}`,
      "",
    );
    const total = kind === "credit" ? -r.refund_cents : r.total_cents;
    const base =
      kind === "credit"
        ? -Math.round((r.subtotal_cents * r.refund_cents) / r.total_cents)
        : r.subtotal_cents;
    lines.push(
      `Base imponible / Net: ${money(base, r.locale)}`,
      `IGIC 7%: ${money(total - base, r.locale)}`,
      `TOTAL: ${money(total, r.locale)}`,
      "",
    );
    if (kind === "credit")
      lines.push(
        `Rectifica / Corrects: ${r.invoice_number}`,
        es
          ? "Motivo: cancelación de la estancia."
          : "Reason: cancellation of the stay.",
        es
          ? "El estado del reembolso se comunica por separado."
          : "Refund status is communicated separately.",
      );
    else
      lines.push(
        es ? "PAGADA - saldo pendiente: 0,00 €" : "PAID - balance due: €0.00",
        `${es ? "Método de pago" : "Payment method"}: ${r.payment_method === "stripe" ? "Stripe" : es ? "Transferencia bancaria" : "Bank transfer"}`,
      );
  }
  let page = pdf.addPage([595.28, 841.89]);
  let y = 780;
  const supported = new Set(font.getCharacterSet());
  const clean = (text: string) =>
    [...text]
      .map((c) => {
        if (/\s/.test(c)) return " ";
        if (!supported.has(c.codePointAt(0) || 0))
          throw new Error("Unsupported document character");
        return c;
      })
      .join("");
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    y = 785;
  }
  function draw(text: string, size = 10) {
    if (y < 64) newPage();
    page.drawText(clean(text), {
      x: 48,
      y,
      size,
      font,
      color: rgb(0.12, 0.16, 0.13),
    });
    y -= size * 1.5;
  }
  draw("CASA ATLANTE", 20);
  draw(title, 14);
  y -= 18;
  for (const paragraph of lines) {
    if (!paragraph) {
      y -= 10;
      continue;
    }
    const words = clean(paragraph).split(/\s+/);
    let line = "";
    for (const word of words) {
      if (font.widthOfTextAtSize(`${line} ${word}`.trim(), 10) > 495 && line) {
        draw(line);
        line = "";
      }
      // Long unbroken addresses/IDs must wrap, too.
      let rest = word;
      while (font.widthOfTextAtSize(rest, 10) > 495) {
        if (line) {
          draw(line);
          line = "";
        }
        let cut = 1;
        while (
          cut < rest.length &&
          font.widthOfTextAtSize(rest.slice(0, cut + 1), 10) <= 495
        )
          cut++;
        draw(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = line ? `${line} ${rest}` : rest;
    }
    if (line) draw(line);
    y -= 7;
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(`Casa Atlante  |  ${i + 1} / ${pages.length}`, {
      x: 48,
      y: 30,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    }),
  );
  return pdf.save();
}
export async function retainedDocument(
  r: Reservation,
  kind: DocumentKind,
): Promise<Buffer> {
  if (
    !r.paid_at ||
    !r.invoice_number ||
    (kind === "credit" && !r.credit_number)
  )
    throw new Error("Document not ready");
  const db = getSupabaseAdmin();
  const storage = db.storage.from("booking-documents");
  const storagePath = `${r.id}/${kind}.pdf`;
  const { data: existing, error: lookupError } = await db
    .from("booking_documents")
    .select("storage_path")
    .eq("booking_id", r.id)
    .eq("kind", kind)
    .maybeSingle();
  if (lookupError) throw new Error("Document lookup failed");
  if (existing) {
    const { data, error } = await storage.download(existing.storage_path);
    if (error || !data) throw new Error("Document download failed");
    return Buffer.from(await data.arrayBuffer());
  }
  const bytes = await renderBookingPdf(r, kind);
  const { error: uploadError } = await storage.upload(storagePath, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  let buffer = Buffer.from(bytes);
  if (uploadError) {
    // A parallel sender may have retained the same document. Never overwrite an issued PDF.
    const { data, error } = await storage.download(storagePath);
    if (error || !data) throw new Error("Document storage failed");
    buffer = Buffer.from(await data.arrayBuffer());
  }
  const { error } = await db
    .from("booking_documents")
    .upsert(
      { booking_id: r.id, kind, storage_path: storagePath },
      { onConflict: "booking_id,kind", ignoreDuplicates: true },
    );
  if (error) throw new Error("Document record failed");
  return buffer;
}
export function formatDeadline(value: string, locale: Locale): string {
  return (
    new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Atlantic/Canary",
    }).format(new Date(value)) + " (Atlantic/Canary)"
  );
}
