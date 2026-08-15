import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { formatCompactDate } from "@/lib/date-format";
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

function currentCanaryDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Atlantic/Canary",
  }).formatToParts(new Date());
  const values = new Map(parts.map(({ type, value }) => [type, value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");

  if (!year || !month || !day) {
    throw new Error("Unable to determine the invoice creation date.");
  }

  return `${year}-${month}-${day}`;
}

function paymentDueDate(start: string) {
  const today = new Date();
  const currentDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));
  const checkInDate = new Date(`${start}T00:00:00Z`);
  const daysUntilCheckIn = Math.round(
    (checkInDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dueInDays = daysUntilCheckIn >= 15 ? 10 : 1;
  const date = new Date(currentDate);
  date.setUTCDate(date.getUTCDate() + dueInDays);
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
      { text: "• 100% de reembolso si los huéspedes cancelan al menos 14 días antes de la entrada." },
      { text: "• 50% de reembolso, menos la comisión de servicio, si los huéspedes cancelan al menos 7 días antes de la entrada." },
      { text: "• Sin reembolso si los huéspedes cancelan menos de 7 días antes de la entrada." },
      { text: "• Para tener derecho al reembolso correspondiente, los huéspedes pueden cancelar hasta las 23:59 (hora local del alojamiento)." },
      { text: "Tarifas: Las tarifas se calculan según el número de huéspedes y la duración de la estancia. El importe abonado cubre únicamente el alquiler del alojamiento para el número de huéspedes acordado y pagado. La ocupación no puede superar el número de huéspedes acordado. Los huéspedes no pueden invitar a familiares o amigos que no estén incluidos en la reserva." },
      { text: "Limpieza y daños: La limpieza final y el cambio de ropa de cama, sábanas y toallas son gratuitos. Para estancias de más de 3 semanas, también se realizarán a mitad de la estancia. Se recomienda dejar la casa barrida, con los platos lavados y guardados, y retirar toda la basura y los materiales reciclables al hacer el check-out. Los huéspedes son responsables de los daños que se produzcan en el alojamiento durante su estancia. Si algo resulta dañado, el huésped se compromete a informar inmediatamente al propietario por escrito. Lo mismo se aplica a cualquier avería en la casa o en la propiedad." },
      { text: "Disposiciones generales: El alojamiento dispone de jabón, papel higiénico, especias, sal y pimienta, aceite y vinagre, café y té. Estas provisiones no se reponen durante la estancia; los huéspedes deberán reponerlas si se agotan. La casa también dispone de ropa de cama 100% algodón, toallas, paños de cocina, tabla y plancha, secador de pelo y otros artículos. La cocina está totalmente equipada con cafetera, cafetera moka, hervidor de agua, tostadora y los electrodomésticos principales, incluida una lavadora. La casa también dispone de televisión por satélite, Internet wifi y otros elementos para la comodidad de los huéspedes." },
      { text: "Condiciones generales e información", bold: true },
      { text: "• La hora de entrada es a las 15:00 y la hora de salida es a las 10:00." },
      { text: "• No está permitido fumar en el interior." },
      { text: "• Hay aparcamiento gratuito disponible en la propiedad." },
      { text: "• Al salir de la casa, los huéspedes dejarán las llaves en la caja de llaves y cerrarán todas las puertas." },
      { text: "• No se permiten mascotas ni alojarlas dentro de la vivienda vacacional." },
      { text: "• El huésped reconoce haber tenido la oportunidad de revisar este contrato y aceptarlo al realizar la reserva." },
      { text: "• El huésped reconoce que el inventario de la casa puede variar con el tiempo cuando el propietario retire artículos para repararlos o realice cambios decorativos." },
      { text: "• Este contrato se rige por la legislación de las Islas Canarias y sustituye cualquier acuerdo verbal previo." },
      { text: "• Los propietarios no son responsables del robo ni de los daños a los bienes personales de los huéspedes." },
      { text: "• Si algún aparato o electrodoméstico deja de funcionar, el precio no se verá afectado. El propietario intentará solucionar el problema en un plazo razonable. El huésped se compromete a notificar inmediatamente al propietario o a su representante cualquier avería, daño o emergencia." },
      { text: "• El propietario o una persona de reparación o mantenimiento podrá entrar en la propiedad para realizar servicios, reparaciones u otras tareas relacionadas con el alquiler, siempre avisando al huésped con una antelación razonable." },
      { text: "• El huésped se compromete a actuar con prudencia respecto al ruido. La propiedad está sujeta a la normativa de ruido de El Paso y a la intervención de las autoridades. El propietario podrá resolver este contrato y desalojar al huésped si se producen quejas reiteradas de los vecinos o interviene la policía. El horario de silencio es de 23:00 a 08:00. Nunca se permite música alta en las terrazas ni en el jardín." },
      { text: "• No se debe tirar al inodoro papel ni otros residuos, como compresas o pañales. Deben utilizarse las papeleras situadas junto al inodoro." },
      { text: "• El agua del grifo no es potable, aunque puede utilizarse para cocinar. Para beber, recomendamos agua embotellada." },
      { text: "• Si hace viento, y siempre al salir de la casa o por la noche, deben guardarse dentro todos los cojines y sombrillas de las terrazas." },
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
    { text: "• 100% refund if guests cancel at least 14 days before check-in." },
    { text: "• 50% refund, less the service fee, if guests cancel at least 7 days before check-in." },
    { text: "• No refund if guests cancel less than 7 days before check-in." },
    { text: "• Guests can cancel until 11:59 p.m. (local time of the holiday home) in order to be entitled to the applicable refund amount." },
    { text: "Rates: The rates are calculated based on the number of guests and the length of stay. The amount paid by the guest covers the rent of the accommodation only for the number of guests agreed upon and paid for. The occupancy may not exceed the guest count agreed upon. Guests may not invite family members or friends to the premises that are not accounted for via the booking." },
    { text: "Cleaning & Damages: The final cleaning and change of bedding, linens and towels are free of charge. For stays longer than 3 weeks, they will also be done during the mid-stay. It is recommended to leave the home broom clean, with dishes washed and put away and all trash and recyclables removed when checking out. Guests are held responsible for damage that occurs to the holiday home during their stay. If something gets damaged during the stay, the guest agrees to inform the owner immediately in writing. The same applies to any malfunction in the house or on the premises." },
    { text: "General provisions: The accommodation is equipped with a supply of soap, toilet paper, spices, salt and pepper, oil and vinegar, coffee and tea. These supplies are not replenished during occupancy; guests are responsible for replenishing them should they run out. The home is also furnished with 100% cotton linens, towels, kitchen towels, an ironing board and iron, a hair dryer and other items. The kitchen is fully equipped with a coffee maker, mocha machine, hot water maker, toaster and all major appliances, including a washing machine. The home also has satellite TV, Wi-Fi Internet and other items for guests' comfort." },
    { text: "General Terms and Disclosures:", bold: true },
    { text: "• Check-in time is 3 p.m. Check-out time is 10 a.m." },
    { text: "• Smoking is not allowed indoors." },
    { text: "• Parking is available at the property free of charge." },
    { text: "• When leaving the house, guests will leave the keys in the key locker and close all doors." },
    { text: "• No pets are allowed or may be harboured inside the vacation rental accommodation." },
    { text: "• The guest acknowledges that they have had the opportunity to review this agreement and agree to it when making the reservation." },
    { text: "• The guest acknowledges that the inventory of the house may vary and change over time as the owner removes items for repair or makes other decorative changes." },
    { text: "• This agreement is based on Canary Islands law and supersedes all prior oral discussions." },
    { text: "• The owners are not responsible for theft or any damage to guests' personal property." },
    { text: "• Should any of the home's gadgets or appliances become inoperable, the rate will not be affected. The owner will attempt to correct the problem in a timely manner. The guest agrees to immediately notify the owner or their agent of any malfunction, damage or emergency." },
    { text: "• The owner or a repair/service person may enter the property for service, repairs or another reason pertinent to the rental business only with reasonable notice to the guest." },
    { text: "• The guest agrees to use good judgment regarding noise. The property is subject to the El Paso noise ordinance and law-enforcement involvement. The owner may terminate this agreement and evict the guest should repeated complaints from neighbours or police involvement occur. Quiet hours are from 11 p.m. to 8 a.m. Loud outdoor music on the terraces and in the garden is never allowed." },
    { text: "• No paper or other waste, such as sanitary towels or nappies, should be deposited in the toilet. Please use the bins located next to the toilet." },
    { text: "• The tap water is not drinkable, although it can be used for cooking. For drinking, bottled water is recommended." },
    { text: "• Please put all pillows and parasols from the terraces inside if it gets windy, and always when leaving the house or at night." },
  ]);
}

function createInvoiceDocx(data: {
  locale: "en" | "es";
  firstName: string;
  lastName: string;
  email: string;
  nif: string;
  iban: string;
  swift: string;
  guests: number;
  start: string;
  end: string;
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
}) {
  const guestName = `${data.firstName} ${data.lastName}`;
  const today = currentCanaryDate();
  const [invoiceYear, invoiceMonth, invoiceDay] = today.split("-");
  const invoiceNumber = `${invoiceDay}${invoiceMonth}${invoiceYear}`;
  const dueDate = paymentDueDate(data.start);
  const issued = formatDate(today, data.locale);
  const dueEs = formatDate(dueDate, "es");
  const dueEn = formatDate(dueDate, "en");
  const stayLineEs = `Estancia ${data.guests} persona${data.guests === 1 ? "" : "s"}, ${data.nights} noche${data.nights === 1 ? "" : "s"}, ${formatDate(data.start, "es")} a ${formatDate(data.end, "es")}`;
  const stayLineEn = `Stay for ${data.guests} ${data.guests === 1 ? "person" : "people"}, ${data.nights} night${data.nights === 1 ? "" : "s"}, ${formatDate(data.start, "en")} to ${formatDate(data.end, "en")}`;

  return createSimpleDocx([
    { text: "Factura / Invoice", bold: true },
    { text: "Samuel Rodriguez Medina", alignment: "right", bold: true },
    { text: `NIF: ${data.nif}`, alignment: "right" },
    { text: "Carretera General Jedey 42", alignment: "right" },
    { text: "38759 El Paso", alignment: "right" },
    { text: `Fecha / Date: ${issued}`, alignment: "right" },
    { text: `Factura / Invoice: ${invoiceNumber}`, alignment: "right" },
    { text: guestName },
    { text: data.email },
    { text: "Concepto / Concept", spacingAfter: 80 },
    { text: stayLineEs },
    { text: stayLineEn },
    { text: `Importe sin IGIC / Amount excluding IGIC: ${formatCurrency(data.subtotal)}`, alignment: "right" },
    { text: `IGIC (7%): ${formatCurrency(data.tax)}`, alignment: "right" },
    { text: `Importe a pagar / Amount due: ${formatCurrency(data.total)}`, alignment: "right", bold: true },
    { text: `Confirmación con pago por transferencia bancaria antes del ${dueEs}:` },
    { text: `Confirmation with payment via bank transfer before ${dueEn}:` },
    { text: `IBAN: ${data.iban}`, bold: true },
    { text: `SWIFT: ${data.swift}`, bold: true },
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
  const nif = process.env.NIF?.trim();
  const iban = process.env.IBAN?.trim();
  const swift = process.env.SWIFT?.trim();

  if (!smtpHost || !smtpUser || !smtpPass || !nif || !iban || !swift) {
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

  const displayStart = formatCompactDate(start);
  const displayEnd = formatCompactDate(end);
  const subject = t("subjectOwner", {
    start: displayStart,
    end: displayEnd,
    firstName,
    lastName,
  });
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
    nif,
    iban,
    swift,
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
    t("lineCheckin", { start: displayStart }),
    t("lineCheckout", { end: displayEnd }),
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
      subject: t("subjectGuest", {
        start: displayStart,
        end: displayEnd,
      }),
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
