import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSimpleDocx } from "@/lib/docx";
import { getServerT } from "@/lib/server-translations";

type BookingRequestPayload = {
  locale?: "en" | "es";
  firstName?: string;
  lastName?: string;
  email?: string;
  message?: string;
  start?: string;
  end?: string;
  guests?: number;
  quote?: {
    nights: number;
    guests: number;
    nightly: number;
    subtotal: number;
    tax: number;
    total: number;
    extraGuests: number;
  } | null;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_NIGHTS = 4;

function formatCurrency(value: number) {
  return `€${value.toFixed(2)}`;
}

function formatDate(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function paymentDueDate(start: string) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 56);
  return date.toISOString().slice(0, 10);
}

function createAgreementDocx(data: {
  locale: "en" | "es";
  firstName: string;
  lastName: string;
  guests: number;
  start: string;
  end: string;
  nights: number;
  total: number;
}) {
  const guestName = `${data.firstName} ${data.lastName}`;
  const stay = data.locale === "es"
    ? `${data.guests} huésped${data.guests === 1 ? "" : "es"} - ${formatDate(data.start, data.locale)} a ${formatDate(data.end, data.locale)}`
    : `${data.guests} guest${data.guests === 1 ? "" : "s"} - ${formatDate(data.start, data.locale)} to ${formatDate(data.end, data.locale)}`;
  const due = formatDate(paymentDueDate(data.start), data.locale);

  if (data.locale === "es") {
    return createSimpleDocx([
      { text: "Casa Atlante", alignment: "center" },
      { text: "Contrato de alquiler vacacional", alignment: "center", bold: true },
      { text: "Información de la reserva", bold: true },
      { text: "• Dirección de la propiedad: Carretera General Jedey, 42, 38759 El Paso, La Palma, España." },
      { text: "• Teléfono en Casa Atlante: +34 675103382" },
      { text: `• Nombre del huésped: ${guestName}` },
      { text: `• Número de huéspedes y fechas reservadas: ${stay}` },
      { text: `• Coste de alquiler: ${formatCurrency(data.total)}` },
      { text: `Reserva: Para confirmar la reserva, el huésped debe pagar el coste total del alquiler antes del ${due}.`, bold: true },
      { text: "Una vez confirmada la reserva mediante el pago, enviaremos las instrucciones completas de llegada a la casa y estaremos disponibles para cualquier pregunta. Los huéspedes harán el check-in de forma autónoma." },
      { text: "Detalles de pago", bold: true },
      { text: "Factura PayPal enviada por correo electrónico." },
      { text: "Reembolsos y cancelaciones", bold: true },
      { text: "• 100% de reembolso si los huéspedes cancelan al menos 30 días antes de la entrada." },
      { text: "• 50% de reembolso si los huéspedes cancelan al menos 14 días antes de la entrada." },
      { text: "• Sin reembolso si los huéspedes cancelan menos de 14 días antes de la entrada." },
      { text: "Tarifas: Las tarifas se calculan según el número de huéspedes y la duración de la estancia. La ocupación no puede superar el número de huéspedes acordado." },
      { text: "Limpieza y daños: La limpieza final, el cambio de ropa de cama, sábanas y toallas está incluido. Los huéspedes son responsables de los daños ocurridos durante su estancia." },
      { text: "Disposiciones generales: El alojamiento dispone de jabón, papel higiénico, especias, sal y pimienta, aceite y vinagre, café y té. La casa se entrega con ropa de cama, toallas y equipamiento de cocina." },
    ]);
  }

  return createSimpleDocx([
    { text: "Casa Atlante", alignment: "center" },
    { text: "Vacation Rental Agreement", alignment: "center", bold: true },
    { text: "Booking information", bold: true },
    { text: "• Property address: Carretera General Jedey, 42, 38759 El Paso, La Palma, Spain." },
    { text: "• Phone number at Casa Atlante: +34 675103382" },
    { text: `• Name of guest: ${guestName}` },
    { text: `• Number of guests and dates booked: ${stay}` },
    { text: `• Rental cost: ${formatCurrency(data.total)}` },
    { text: `Reservation: In order to confirm the reservation the guest needs to pay the total rental cost by the ${due}.`, bold: true },
    { text: "Once the booking is confirmed through payment, we will send complete directions to the house and we will be available for any questions the guests might have. The guests will do self check-in." },
    { text: "Payment details", bold: true },
    { text: "PayPal invoice sent through email." },
    { text: "Refund and Cancellations:", bold: true },
    { text: "• 100% refund if guests cancel at least 30 days before check-in." },
    { text: "• 50% refund if guests cancel at least 14 days before check-in." },
    { text: "• No refund if guests cancel less than 14 days before check-in." },
    { text: "Rates: The rates are calculated based on the number of guests and the length of stay. The occupancy may not exceed the guest count agreed upon." },
    { text: "Cleaning & Damages: The final cleaning, change of bedding, linens and towels is free of charge and will be done during the mid stay for stays longer than 3 weeks. Guests are responsible for damage that occurs during their stay." },
    { text: "General provisions: The accommodation is equipped with soap, toilet paper, spices, salt and pepper, oil and vinegar, coffee, tea, linens, towels and kitchen equipment." },
  ]);
}

function createInvoiceDocx(data: {
  locale: "en" | "es";
  firstName: string;
  lastName: string;
  email: string;
  guests: number;
  start: string;
  end: string;
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
}) {
  const guestName = `${data.firstName} ${data.lastName}`;
  const issued = formatDate(new Date().toISOString().slice(0, 10), data.locale);
  const due = formatDate(paymentDueDate(data.start), data.locale);
  const stayLine = data.locale === "es"
    ? `Estancia ${data.guests} persona${data.guests === 1 ? "" : "s"}, ${data.nights} noche${data.nights === 1 ? "" : "s"}, ${formatDate(data.start, data.locale)} a ${formatDate(data.end, data.locale)}`
    : `Stay for ${data.guests} people, ${data.nights} night${data.nights === 1 ? "" : "s"}, ${formatDate(data.start, data.locale)} to ${formatDate(data.end, data.locale)}`;

  return createSimpleDocx([
    { text: data.locale === "es" ? "Factura" : "Invoice", bold: true },
    { text: "Samuel Rodriguez Medina", alignment: "right", bold: true },
    { text: "NIF: 42417352Q", alignment: "right" },
    { text: "Carretera General Jedey 42", alignment: "right" },
    { text: "38759 El Paso", alignment: "right" },
    { text: data.locale === "es" ? `Factura emitida: ${issued}` : `Invoice issued: ${issued}`, alignment: "right" },
    { text: guestName },
    { text: data.email },
    { text: data.locale === "es" ? "Concepto" : "Description", spacingAfter: 80 },
    { text: stayLine },
    { text: data.locale === "es" ? `Importe sin IGIC: ${formatCurrency(data.subtotal)}` : `Amount excluding IGIC: ${formatCurrency(data.subtotal)}`, alignment: "right" },
    { text: `IGIC (7%): ${formatCurrency(data.tax)}`, alignment: "right" },
    { text: data.locale === "es" ? `Importe a pagar: ${formatCurrency(data.total)}` : `Amount due: ${formatCurrency(data.total)}`, alignment: "right", bold: true },
    { text: data.locale === "es" ? `Confirmación con pago por transferencia bancaria antes del ${due}:` : `Confirmation with payment via bank transfer before ${due}:` },
    { text: "IBAN: ES35 2100 7102 1107 0051 1115", bold: true },
    { text: "SWIFT: CAIXESBBXXX", bold: true },
  ]);
}

function normalizeDate(value?: string | null) {
  if (!value || !ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : value;
}

export async function POST(req: NextRequest) {
  const body = (await req
    .json()
    .catch(() => null)) as BookingRequestPayload | null;
  const locale = body?.locale === "es" ? "es" : "en";
  const t = await getServerT(locale, "apiBooking");

  if (!body)
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const fromEmail = body.email?.trim();
  const message = body.message?.trim() ?? "";
  const start = normalizeDate(body.start);
  const end = normalizeDate(body.end);
  const guests = Number.isFinite(body.guests) ? Number(body.guests) : null;
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: t("nameRequired") },
      { status: 400 }
    );
  }

  if (!fromEmail) {
    return NextResponse.json({ error: t("emailRequired") }, { status: 400 });
  }

  if (!start || !end) {
    return NextResponse.json(
      { error: t("datesRequired") },
      { status: 400 }
    );
  }

  if (
    new Date(`${end}T00:00:00Z`).getTime() <=
    new Date(`${start}T00:00:00Z`).getTime()
  ) {
    return NextResponse.json(
      { error: t("checkoutAfter") },
      { status: 400 }
    );
  }

  if (!guests || guests < 1 || guests > 4) {
    return NextResponse.json(
      { error: t("guestRange") },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: t("messageRequired") },
      { status: 400 }
    );
  }

  const stayNights = Math.round(
    (new Date(`${end}T00:00:00Z`).getTime() -
      new Date(`${start}T00:00:00Z`).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (stayNights < MIN_NIGHTS) {
    return NextResponse.json(
      { error: t("minStay") },
      { status: 400 }
    );
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const toEmail = process.env.BOOKING_REQUEST_TO || "booking@casa-atlante.com";

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    return NextResponse.json(
      {
        error:
          t("emailNotConfigured"),
      },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465 || process.env.SMTP_SECURE === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject = t("subjectOwner", { start, end, firstName, lastName });
  const nights = stayNights;
  const extraGuests = Math.max(0, Math.min(guests - 2, 2));
  const nightly = 90 + extraGuests * 20;
  const subtotal = nights * nightly;
  const tax = subtotal * 0.07;
  const total = subtotal + tax;
  const extraGuestsTotal = extraGuests * 20 * nights;

  const agreementDocx = createAgreementDocx({
    locale,
    firstName,
    lastName,
    guests,
    start,
    end,
    nights,
    total,
  });
  const invoiceDocx = createInvoiceDocx({
    locale,
    firstName,
    lastName,
    email: fromEmail,
    guests,
    start,
    end,
    nights,
    subtotal,
    tax,
    total,
  });

  const text = [
    t("lineName", { firstName, lastName }),
    t("lineEmail", { fromEmail }),
    t("lineGuests", { guests }),
    t("lineCheckin", { start }),
    t("lineCheckout", { end }),
    "",
    t("priceBreakdown"),
    t("lineNights", { nights }),
    t("lineNightlyBase"),
    t("lineExtraGuests", { extraGuests, nights, extraGuestsTotal: extraGuestsTotal.toFixed(2) }),
    t("lineAppliedNightly", { nightly: nightly.toFixed(2) }),
    t("lineSubtotal", { subtotal: subtotal.toFixed(2) }),
    t("lineTax", { tax: tax.toFixed(2) }),
    t("lineTotal", { total: total.toFixed(2) }),
    "",
    message ? `Message:\n${message}` : "Message: (none provided)",
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `${firstName} ${lastName} <${fromEmail}>`,
      to: toEmail,
      subject,
      text,
      replyTo: fromEmail,
      envelope: {
        from: fromEmail,
        to: toEmail,
      },
      attachments: [
        {
          filename: locale === "es" ? "contrato-alquiler-vacacional.docx" : "vacation-rental-agreement.docx",
          content: agreementDocx,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        {
          filename: locale === "es" ? "factura.docx" : "invoice.docx",
          content: invoiceDocx,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    });

    // Send a copy to the sender for their records.
    await transporter.sendMail({
      from: toEmail,
      to: fromEmail,
      subject: t("subjectGuest", { start, end }),
      text: [
        t("guestIntro"),
        "",
        text,
      ].join("\n"),
      replyTo: toEmail,
    });
  } catch (err) {
    return NextResponse.json(
      { error: t("sendFailed", { message: (err as Error).message }) },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
