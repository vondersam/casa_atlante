"use client";
import { FormEvent, Suspense, use, useMemo, useRef, useState } from "react";
import AvailabilityCalendar, {
  type Booking,
  type SelectedRange,
} from "@/app/components/availability-calendar";
import { useLocale, useT } from "@/i18n/context";
import { localizePath } from "@/i18n/path";
import {
  MIN_NIGHTS,
  NIGHTLY_BASE_CENTS,
  EXTRA_GUEST_CENTS,
  TERMS_VERSION,
  quoteStay,
  money,
  type PaymentMethod,
} from "@/lib/booking/policy";

type Snapshot = {
  bookings: Booking[];
  updatedAt: string | null;
  error?: string | null;
  instantAvailable: boolean;
};
type Props = { availabilityPromise: Promise<Snapshot> };
const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  message: "",
  guests: 2,
  billingKind: "individual",
  billingName: "",
  billingAddress: "",
  billingCountry: "ES",
  billingTaxId: "",
};
export default function BookingClient(props: Props) {
  const t = useT("calendar");
  return (
    <Suspense
      fallback={
        <section className="section content-width" aria-busy="true">
          <p role="status">{t("syncing")}</p>
        </section>
      }
    >
      <BookingForm {...props} />
    </Suspense>
  );
}
function BookingForm({ availabilityPromise }: Props) {
  const availability = use(availabilityPromise);
  const locale = useLocale(),
    t = useT("booking"),
    tc = useT("calendar");
  const [selection, setSelection] = useState<SelectedRange>({
    start: null,
    end: null,
  });
  const [form, setForm] = useState(initialForm);
  const [method, setMethod] = useState<PaymentMethod>(
    availability.instantAvailable ? "stripe" : "bank",
  );
  const [instantAvailable, setInstantAvailable] = useState(
    availability.instantAvailable,
  );
  const [terms, setTerms] = useState(false),
    [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const requestRef = useRef<{ digest: string; id: string } | null>(null);
  const quote = useMemo(() => {
    if (!selection.start || !selection.end) return null;
    try {
      return quoteStay(selection.start, selection.end, form.guests);
    } catch {
      return null;
    }
  }, [selection, form.guests]);
  const update = (key: keyof typeof initialForm, value: string | number) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!quote || !selection.start || !selection.end) {
      setError(t("errorSelectDates"));
      return;
    }
    if (!terms || !privacy) {
      setError(t("termsRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        message: form.message,
        guests: form.guests,
        start: selection.start,
        end: selection.end,
        locale,
        paymentMethod: method,
        billing: {
          kind: form.billingKind,
          name: form.billingName,
          address: form.billingAddress,
          country: form.billingCountry,
          taxId: form.billingTaxId,
        },
        termsVersion: TERMS_VERSION,
        termsAccepted: terms,
        privacyAccepted: privacy,
      };
      const signature = JSON.stringify(payload);
      let requestId = crypto.randomUUID();
      // Preserve a request ID across network retries/reloads without storing guest details in browser storage.
      const digest = [
        ...new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(signature),
          ),
        ),
      ]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (requestRef.current?.digest === digest)
        requestId = requestRef.current.id;
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("ca-booking-request") || "null",
        );
        if (saved?.digest === digest && typeof saved.id === "string")
          requestId = saved.id;
        sessionStorage.setItem(
          "ca-booking-request",
          JSON.stringify({ digest, id: requestId }),
        );
      } catch {
        /* Storage may be disabled; retries within the same browser submission remain safe. */
      }
      requestRef.current = { digest, id: requestId };
      const res = await fetch("/api/request-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (
          data.code === "calendar_unavailable" ||
          data.code === "checkout_unavailable"
        ) {
          setInstantAvailable(false);
          setMethod("bank");
        }
        throw new Error(
          typeof data.error === "string" ? data.error : t("errorSend"),
        );
      }
      if (typeof data.url !== "string") throw new Error(t("errorSend"));
      const url = new URL(data.url);
      if (
        url.origin !== window.location.origin &&
        url.hostname !== "checkout.stripe.com"
      )
        throw new Error(t("errorSend"));
      window.location.assign(url.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSend"));
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <div className="content-width">
        <div className="section-header">
          <h1>{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
        </div>
        <div className="split-grid">
          <div>
            <AvailabilityCalendar
              selectable
              bookings={availability.bookings}
              updatedAt={availability.updatedAt}
              error={availability.error ? tc("loadError") : null}
              selectedRange={selection}
              onSelectRange={(range) => {
                if (!busy) {
                  setSelection(range);
                  setError("");
                }
              }}
            />
            <p className="muted small">
              {t("minimumStay", { nights: MIN_NIGHTS })}
            </p>
          </div>
          <div className="booking-card">
            <h2>{t("requestTitle")}</h2>
            <ul>
              <li>{t("price1")}</li>
              <li>{t("price2")}</li>
              <li>{t("price3")}</li>
              <li>{t("price4")}</li>
            </ul>
            <form className="booking-form" onSubmit={submit}>
              <fieldset disabled={busy} className="booking-fields">
                <legend className="visually-hidden">{t("requestTitle")}</legend>
                <div className="form-grid">
                  <label className="form-field">
                    <span>{t("name")}</span>
                    <input
                      autoComplete="given-name"
                      maxLength={100}
                      required
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>{t("surname")}</span>
                    <input
                      autoComplete="family-name"
                      maxLength={100}
                      required
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>{t("email")}</span>
                    <input
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>{t("guests")}</span>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      step={1}
                      required
                      value={form.guests}
                      onChange={(e) => update("guests", Number(e.target.value))}
                    />
                  </label>
                </div>
                <h3>{t("billingTitle")}</h3>
                <div className="form-grid">
                  <label className="form-field">
                    <span>{t("billingKind")}</span>
                    <select
                      value={form.billingKind}
                      onChange={(e) => update("billingKind", e.target.value)}
                    >
                      <option value="individual">{t("individual")}</option>
                      <option value="company">{t("company")}</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>{t("billingName")}</span>
                    <input
                      required
                      maxLength={200}
                      value={form.billingName}
                      onChange={(e) => update("billingName", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>{t("billingCountry")}</span>
                    <input
                      required
                      autoComplete="country"
                      minLength={2}
                      maxLength={2}
                      pattern="[A-Za-z]{2}"
                      value={form.billingCountry}
                      onChange={(e) =>
                        update("billingCountry", e.target.value.toUpperCase())
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span>
                      {t("taxId")}
                      {form.billingKind === "company" ||
                      form.billingCountry === "ES"
                        ? " *"
                        : ""}
                    </span>
                    <input
                      maxLength={60}
                      required={
                        form.billingKind === "company" ||
                        form.billingCountry === "ES"
                      }
                      value={form.billingTaxId}
                      onChange={(e) => update("billingTaxId", e.target.value)}
                    />
                  </label>
                </div>
                <label className="form-field">
                  <span>{t("billingAddress")}</span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    required
                    autoComplete="street-address"
                    value={form.billingAddress}
                    onChange={(e) => update("billingAddress", e.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>{t("messageOptional")}</span>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </label>
                <p className="muted small">
                  {selection.start && selection.end
                    ? `${selection.start} → ${selection.end}`
                    : t("summarySelect")}
                </p>
                {quote && (
                  <div className="quote">
                    <h3>{t("priceBreakdown")}</h3>
                    <div className="quote-line">
                      <span>{t("baseIncludes", { guests: 2 })}</span>
                      <span>
                        {money(NIGHTLY_BASE_CENTS, locale)}
                        {t("perNight")}
                      </span>
                    </div>
                    <div className="quote-line">
                      <span>{t("extraGuests")}</span>
                      <span>
                        {quote.extraGuests} × {money(EXTRA_GUEST_CENTS, locale)}
                        {t("perNight")}
                      </span>
                    </div>
                    <div className="quote-line">
                      <span>{t("nights")}</span>
                      <span>{quote.nights}</span>
                    </div>
                    <div className="quote-line">
                      <span>{t("subtotal")}</span>
                      <span>{money(quote.subtotal, locale)}</span>
                    </div>
                    <div className="quote-line">
                      <span>{t("igic")}</span>
                      <span>{money(quote.tax, locale)}</span>
                    </div>
                    <div className="quote-line total">
                      <span>{t("total")}</span>
                      <span>{money(quote.total, locale)}</span>
                    </div>
                  </div>
                )}
                <fieldset className="payment-options">
                  <legend>{t("paymentChoice")}</legend>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={method === "stripe"}
                      disabled={!instantAvailable}
                      onChange={() => setMethod("stripe")}
                    />
                    <span>
                      <strong>{t("card")}</strong>
                      <br />
                      {t("cardHelp")}
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={method === "bank"}
                      onChange={() => setMethod("bank")}
                    />
                    <span>
                      <strong>{t("bank")}</strong>
                      <br />
                      {t("bankHelp")}
                    </span>
                  </label>
                  {!instantAvailable && (
                    <p role="status">{t("instantUnavailable")}</p>
                  )}
                </fieldset>
                <label className="form-field checkbox">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    required
                  />
                  <span>
                    {t("termsAccept")}{" "}
                    <a
                      className="gdpr-link"
                      target="_blank"
                      rel="noreferrer"
                      href={localizePath("/booking/terms", locale)}
                    >
                      {t("termsLink")}
                    </a>{" "}
                    ({TERMS_VERSION}).
                  </span>
                </label>
                <label className="form-field checkbox">
                  <input
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    required
                  />
                  <span>
                    {t("gdprAgree1")}{" "}
                    <a
                      className="gdpr-link"
                      target="_blank"
                      rel="noreferrer"
                      href={localizePath("/privacy", locale)}
                    >
                      {t("gdprNotice")}
                    </a>{" "}
                    {t("gdprAgree2")}
                  </span>
                </label>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn" type="submit">
                  {busy
                    ? t("sending")
                    : method === "stripe"
                      ? t("payNow")
                      : t("send")}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
