"use client";

import { FormEvent, Suspense, use, useEffect, useMemo, useState } from "react";
import AvailabilityCalendar, {
  Booking,
  SelectedRange,
} from "@/app/components/availability-calendar";
import { useLocale, useT } from "@/i18n/context";
import { localizePath } from "@/i18n/path";

type AvailabilitySnapshot = {
  bookings: Booking[];
  updatedAt: string | null;
  error?: string | null;
};

type BookingClientProps = {
  availabilityPromise: Promise<AvailabilitySnapshot>;
};

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  message: "",
  guests: 2,
};

const NIGHTLY_BASE = 90;
const EXTRA_GUEST_FEE = 20;
const INCLUDED_GUESTS = 2;
const MAX_GUESTS = 4;
const IGIC_RATE = 0.07;
const MIN_NIGHTS = 4;

function nightsBetween(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00Z`).getTime();
  const endDate = new Date(`${end}T00:00:00Z`).getTime();
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return 0;
  return Math.max(0, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
}

function calculateQuote(nights: number, guests: number) {
  if (nights <= 0) return null;
  const extraGuests = Math.max(
    0,
    Math.min(MAX_GUESTS - INCLUDED_GUESTS, guests - INCLUDED_GUESTS)
  );
  const nightly = NIGHTLY_BASE + extraGuests * EXTRA_GUEST_FEE;
  const subtotal = nights * nightly;
  const tax = subtotal * IGIC_RATE;
  const total = subtotal + tax;
  return {
    nights,
    guests,
    nightly,
    subtotal,
    tax,
    total,
    extraGuests,
  };
}

function AvailabilityCalendarFallback() {
  const t = useT("calendar");
  const weekdaySkeleton = Array.from({ length: 7 });
  const daySkeleton = Array.from({ length: 42 });

  return (
    <div className="availability-card" aria-busy="true">
      <div className="calendar-header">
        <button
          className="calendar-nav"
          type="button"
          disabled
          aria-hidden="true"
        >
          ←
        </button>
        <div>
          <p className="eyebrow">{t("availability")}</p>
          <div className="month-label">{t("syncing")}</div>
          <p className="calendar-meta">{t("syncing")}</p>
        </div>
        <button
          className="calendar-nav"
          type="button"
          disabled
          aria-hidden="true"
        >
          →
        </button>
      </div>

      <div className="calendar-grid skeleton-grid" aria-hidden="true">
        {weekdaySkeleton.map((_, index) => (
          <div
            key={`weekday-skeleton-${index}`}
            className="calendar-cell weekday skeleton-block"
          />
        ))}

        {daySkeleton.map((_, index) => (
          <div
            key={`day-skeleton-${index}`}
            className="calendar-cell day skeleton-block"
          />
        ))}
      </div>

      <p className="calendar-status" role="status">
        {t("syncing")}
      </p>
    </div>
  );
}

type CalendarPanelProps = {
  availabilityPromise: Promise<AvailabilitySnapshot>;
  selectedRange: SelectedRange;
  onSelectRange: (range: SelectedRange) => void;
};

function CalendarPanel({
  availabilityPromise,
  selectedRange,
  onSelectRange,
}: CalendarPanelProps) {
  const availability = use(availabilityPromise);

  return (
    <AvailabilityCalendar
      selectable
      bookings={availability.bookings}
      updatedAt={availability.updatedAt}
      error={availability.error}
      selectedRange={selectedRange}
      onSelectRange={onSelectRange}
    />
  );
}

export default function BookingClient({
  availabilityPromise,
}: BookingClientProps) {
  const locale = useLocale();
  const t = useT("booking");
  const [selection, setSelection] = useState<SelectedRange>({
    start: null,
    end: null,
  });
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [guestInput, setGuestInput] = useState(() =>
    initialForm.guests.toString()
  );

  useEffect(() => {
    setGuestInput(String(form.guests ?? initialForm.guests));
  }, [form.guests]);

  const selectedSummary = useMemo(() => {
    if (!selection.start && !selection.end)
      return t("summarySelect");
    if (selection.start && !selection.end)
      return t("summaryCheckIn", { start: selection.start });
    if (selection.start && selection.end) {
      const nights = nightsBetween(selection.start, selection.end);
      return t("summarySelected", {
        start: selection.start,
        end: selection.end,
        nights,
      });
    }
    return "";
  }, [selection]);

  const selectedNights = useMemo(
    () => nightsBetween(selection.start, selection.end),
    [selection]
  );

  const quote = useMemo(() => {
    if (!selection.start || !selection.end) return null;
    return calculateQuote(selectedNights, form.guests ?? 2);
  }, [selection, selectedNights, form.guests]);

  const canSubmit = Boolean(
    selection.start &&
      selection.end &&
      selectedNights >= MIN_NIGHTS &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.message.trim() &&
      gdprAccepted
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    if (!selection.start || !selection.end) {
      setError(t("errorSelectDates"));
      return;
    }

    if (selectedNights < MIN_NIGHTS) {
      setError(t("errorMinStay"));
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t("errorName"));
      return;
    }

    if (!form.email.trim()) {
      setError(t("errorEmail"));
      return;
    }

    if (!form.message.trim()) {
      setError(t("errorMessage"));
      return;
    }

    setStatus("submitting");
    setError(null);
    setAttempted(true);

    const res = await fetch("/api/request-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        locale,
        guests: form.guests,
        start: selection.start,
        end: selection.end,
        quote,
      }),
    });

    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!res.ok) {
      setStatus("error");
      setError(data?.error || t("errorSend"));
      return;
    }

    setStatus("success");
    setForm({ ...initialForm });
    setGdprAccepted(false);
    setAttempted(false);
  }

  return (
    <section className="section">
      <div className="content-width">
        <div className="section-header">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className="lead">
            {t("lead")}
          </p>
        </div>

        <div className="split-grid">
          <Suspense fallback={<AvailabilityCalendarFallback />}>
            <CalendarPanel
              availabilityPromise={availabilityPromise}
              selectedRange={selection}
              onSelectRange={(range) => {
                setSelection(range);
                setStatus("idle");
                setError(null);
                setAttempted(false);
              }}
            />
          </Suspense>

          <div className="booking-card">
            <div>
              <h3>{t("requestTitle")}</h3>
              <ul>
                <li>{t("price1")}</li>
                <li>
                  {t("price2")}
                </li>
                <li>
                  {t("price3")}
                </li>
                <li>
                  {t("price4")}
                </li>
              </ul>
            </div>
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>{t("name")}</span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>{t("surname")}</span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>{t("email")}</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>{t("guests")}</span>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    inputMode="numeric"
                    value={guestInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setGuestInput(raw);
                      if (raw === "") return;
                      const parsed = Number(raw);
                      if (!Number.isFinite(parsed)) return;
                      const clamped = Math.max(1, Math.min(4, parsed));
                      setForm((prev) => ({ ...prev, guests: clamped }));
                    }}
                    onBlur={() => {
                      const fallback = form.guests ?? initialForm.guests;
                      if (guestInput.trim() === "") {
                        setGuestInput(String(fallback));
                        return;
                      }
                      const parsed = Number(guestInput);
                      if (!Number.isFinite(parsed)) {
                        setGuestInput(String(fallback));
                        return;
                      }
                      const clamped = Math.max(1, Math.min(4, parsed));
                      setGuestInput(String(clamped));
                      setForm((prev) => ({ ...prev, guests: clamped }));
                    }}
                    required
                  />
                </label>
              </div>

              <label className="form-field">
                <span>{t("message")}</span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder={t("messagePlaceholder")}
                  required
                />
              </label>

              <p className="muted small">{selectedSummary}</p>
              {selectedNights > 0 && selectedNights < MIN_NIGHTS && (
                <p className="form-error">{t("errorMinStayInline")}</p>
              )}
              {quote && selectedNights >= MIN_NIGHTS && (
                <div className="quote">
                  <p className="muted small">{t("priceBreakdown")}</p>
                  <div className="quote-line">
                    <span>{t("baseIncludes", { guests: INCLUDED_GUESTS })}</span>
                    <span>€{NIGHTLY_BASE.toFixed(2)}{t("perNight")}</span>
                  </div>
                  <div className="quote-line">
                    <span>{t("extraGuests")}</span>
                    <span>
                      {quote.extraGuests} × €{EXTRA_GUEST_FEE.toFixed(2)}
                      {t("perNight")} × {quote.nights}{" "}
                      {t(quote.nights === 1 ? "nightSingular" : "nightPlural")} = €
                      {(
                        quote.extraGuests *
                        EXTRA_GUEST_FEE *
                        quote.nights
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="quote-line">
                    <span>{t("nights")}</span>
                    <span>{quote.nights}</span>
                  </div>
                  <div className="quote-line">
                    <span>{t("subtotal")}</span>
                    <span>€{quote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="quote-line">
                    <span>{t("igic")}</span>
                    <span>€{quote.tax.toFixed(2)}</span>
                  </div>
                  <div className="quote-line total">
                    <span>{t("total")}</span>
                    <span>€{quote.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}
              {status === "success" && (
                <p className="form-success">
                  {t("success")}
                </p>
              )}

              {!canSubmit && attempted && !error && (
                <p className="form-error">
                  {t("completeAll")}
                </p>
              )}

              <label className="form-field checkbox">
                <input
                  type="checkbox"
                  checked={gdprAccepted}
                  onChange={(e) => setGdprAccepted(e.target.checked)}
                  required
                />
                <span>
                  {t("gdprAgree1")} {" "}
                  <a
                    className="gdpr-link"
                    href={localizePath('/privacy', locale)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("gdprNotice")}
                  </a>{" "}
                  {t("gdprAgree2")}
                </span>
              </label>
              {!gdprAccepted && attempted && (
                <p className="form-error">
                  {t("gdprRequired")}
                </p>
              )}

              <div className="hero-actions">
                <button
                  className="btn"
                  type="submit"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? t("sending") : t("send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
