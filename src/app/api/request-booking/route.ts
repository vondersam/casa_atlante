import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type BookingRequestPayload = {
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

function normalizeDate(value?: string | null) {
  if (!value || !ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : value;
}

export async function POST(req: NextRequest) {
  const body = (await req
    .json()
    .catch(() => null)) as BookingRequestPayload | null;
  if (!body)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const fromEmail = body.email?.trim();
  const message = body.message?.trim() ?? "";
  const start = normalizeDate(body.start);
  const end = normalizeDate(body.end);
  const guests = Number.isFinite(body.guests) ? Number(body.guests) : null;
  const clientQuote = body.quote;

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Name and surname are required." },
      { status: 400 }
    );
  }

  if (!fromEmail) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!start || !end) {
    return NextResponse.json(
      { error: "Check-in and check-out dates are required." },
      { status: 400 }
    );
  }

  if (
    new Date(`${end}T00:00:00Z`).getTime() <=
    new Date(`${start}T00:00:00Z`).getTime()
  ) {
    return NextResponse.json(
      { error: "Check-out must be after check-in." },
      { status: 400 }
    );
  }

  if (!guests || guests < 1 || guests > 4) {
    return NextResponse.json(
      { error: "Guest count must be between 1 and 4." },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
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
      { error: "Minimum stay is 4 nights. Please adjust your dates." },
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
          "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and provide a sender email.",
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

  const subject = `Booking request: ${start} → ${end} from ${firstName} ${lastName}`;
  const nights = stayNights;
  const extraGuests = Math.max(0, Math.min(guests - 2, 2));
  const nightly = 90 + extraGuests * 20;
  const subtotal = nights * nightly;
  const tax = subtotal * 0.07;
  const total = subtotal + tax;
  const extraGuestsTotal = extraGuests * 20 * nights;

  const text = [
    `Name: ${firstName} ${lastName}`,
    `Email: ${fromEmail}`,
    `Guests: ${guests}`,
    `Check-in: ${start}`,
    `Check-out: ${end}`,
    "",
    "Price breakdown:",
    `- Nights: ${nights}`,
    `- Nightly base (includes 2 guests): €90.00`,
    `- Extra guests: ${extraGuests} × €20.00/night × ${nights} nights = €${extraGuestsTotal.toFixed(
      2
    )}`,
    `- Applied nightly rate: €${nightly.toFixed(2)}`,
    `- Subtotal: €${subtotal.toFixed(2)}`,
    `- IGIC (VAT) 7%: €${tax.toFixed(2)}`,
    `- Total: €${total.toFixed(2)}`,
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
    });

    // Send a copy to the sender for their records.
    await transporter.sendMail({
      from: toEmail,
      to: fromEmail,
      subject: `Casa Atlante - Copy of your booking request: ${start} → ${end}`,
      text: [
        "We confirm we have received your request and we will reply as soon as possible.",
        "",
        text,
      ].join("\n"),
      replyTo: toEmail,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to send email: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
