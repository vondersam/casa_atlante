import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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
