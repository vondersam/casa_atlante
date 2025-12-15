"use client";

import { FormEvent, Suspense, use, useEffect, useMemo, useState } from "react";
import AvailabilityCalendar, {
  Booking,
  SelectedRange,
} from "../components/availability-calendar";

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
const MIN_NIGHTS = 5;

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
          <p className="eyebrow">Availability</p>
          <div className="month-label">Loading calendar…</div>
          <p className="calendar-meta">Syncing calendar…</p>
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
        Loading availability…
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
      return "Select your check-in and check-out dates and the budget will be displayed.";
    if (selection.start && !selection.end)
      return `Check-in selected: ${selection.start}. Pick your check-out.`;
    if (selection.start && selection.end) {
      const nights = nightsBetween(selection.start, selection.end);
      return `Selected: ${selection.start} → ${
        selection.end
      } (checkout) • ${nights} night${nights === 1 ? "" : "s"}.`;
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
      setError("Please select check-in and check-out dates on the calendar.");
      return;
    }

    if (selectedNights < MIN_NIGHTS) {
      setError("Minimum stay is 5 nights. Please adjust your dates.");
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Please enter your name and surname.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.message.trim()) {
      setError("Please enter a message.");
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
      setError(data?.error || "Failed to send request. Please try again.");
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
          <p className="eyebrow">Booking</p>
          <h1>Plan your stay</h1>
          <p className="lead">
            Check real-time availability, select your dates, and send us a
            booking request. We&apos;ll confirm rates and arrival details.
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
              <h3>Booking request</h3>
              <ul>
                <li>90 euros per night for two guests</li>
                <li>
                  20 euros per night for each additional guest (sleeps max. 4)
                </li>
                <li>
                  Prices exclude IGIC (VAT), which is 7% and added to the final
                  price
                </li>
                <li>
                  Check-out time is 10:00 AM; check-in from 15:00 PM or later
                </li>
              </ul>
            </div>
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Name</span>
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
                  <span>Surname</span>
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
                  <span>Email</span>
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
                  <span>Guests (max 4)</span>
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
                <span>Message</span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Message to host"
                  required
                />
              </label>

              <p className="muted small">{selectedSummary}</p>
              {selectedNights > 0 && selectedNights < 5 && (
                <p className="form-error">Minimum stay is 5 nights.</p>
              )}
              {quote && selectedNights >= MIN_NIGHTS && (
                <div className="quote">
                  <p className="muted small">Price breakdown</p>
                  <div className="quote-line">
                    <span>Base (includes {INCLUDED_GUESTS} guests)</span>
                    <span>€{NIGHTLY_BASE.toFixed(2)}/night</span>
                  </div>
                  <div className="quote-line">
                    <span>Extra guests</span>
                    <span>
                      {quote.extraGuests} × €{EXTRA_GUEST_FEE.toFixed(2)}/night
                      × {quote.nights} night
                      {quote.nights === 1 ? "" : "s"} = €
                      {(
                        quote.extraGuests *
                        EXTRA_GUEST_FEE *
                        quote.nights
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="quote-line">
                    <span>Nights</span>
                    <span>{quote.nights}</span>
                  </div>
                  <div className="quote-line">
                    <span>Subtotal</span>
                    <span>€{quote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="quote-line">
                    <span>IGIC (VAT) (7%)</span>
                    <span>€{quote.tax.toFixed(2)}</span>
                  </div>
                  <div className="quote-line total">
                    <span>Total</span>
                    <span>€{quote.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}
              {status === "success" && (
                <p className="form-success">
                  Request sent. We&apos;ll reply shortly.
                </p>
              )}

              {!canSubmit && attempted && !error && (
                <p className="form-error">
                  Please complete all fields, pick check-in and check-out (min 5
                  nights), add your message, and accept the GDPR notice.
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
                  I agree to the{" "}
                  <a
                    className="gdpr-link"
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GDPR notice
                  </a>{" "}
                  and consent to my data being used to process this booking
                  request.
                </span>
              </label>
              {!gdprAccepted && attempted && (
                <p className="form-error">
                  Please accept the GDPR notice to proceed.
                </p>
              )}

              <div className="hero-actions">
                <button
                  className="btn"
                  type="submit"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
