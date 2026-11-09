"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { money, OWNER_EMAIL } from "@/lib/booking/policy";
import type { Reservation } from "@/lib/booking/types";
type OwnerBooking = Omit<
  Reservation,
  "status_token" | "request_digest" | "terms_snapshot"
> & { refundQuote: number };
type Dashboard = {
  bookings: OwnerBooking[];
  total: number;
  pendingMail: {
    id: string;
    booking_id: string;
    kind: string;
    attempts: number;
    last_error: string | null;
  }[];
  lastSync: string | null;
};
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Atlantic/Canary",
      }).format(new Date(value))
    : "—";
export default function AdminClient() {
  const [authenticated, setAuthenticated] = useState(false),
    [loading, setLoading] = useState(true),
    [sent, setSent] = useState(false),
    [code, setCode] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function api(url: string, body?: unknown) {
    const res = await fetch(
      url,
      body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : { cache: "no-store" },
    );
    const data = await res.json();
    if (res.status === 401) setAuthenticated(false);
    if (!res.ok) throw new Error(data.error || "The operation failed.");
    return data;
  }
  async function load(nextPage = page) {
    setDashboard(await api(`/api/admin/bookings?page=${nextPage}`));
    setPage(nextPage);
  }
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const response = await fetch("/api/admin/auth", { cache: "no-store" });
        const auth = await response.json();
        if (cancelled) return;
        setAuthenticated(auth.authenticated);
        if (auth.authenticated) {
          const res = await fetch("/api/admin/bookings", { cache: "no-store" });
          const data = await res.json();
          if (!res.ok)
            throw new Error(data.error || "Could not load bookings.");
          if (!cancelled) setDashboard(data);
        }
      } catch {
        if (!cancelled)
          setError("Could not load the dashboard. Refresh to retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/api/admin/auth",
        sent ? { action: "verify", code } : { action: "request" },
      );
      if (sent) {
        setAuthenticated(true);
        setCode("");
        await load(0);
      } else setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/admin/bookings/${id}`, body);
      await load();
      setNotice(
        "Saved. Notifications and any refund will be processed automatically.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  async function sync() {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/sync", { action: "sync" });
      await load();
      setNotice("Calendars refreshed and pending operations checked.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="owner-dashboard">
      <Link href="/">Casa Atlante</Link>
      <h1>Owner bookings</h1>
      {loading ? (
        <p role="status">Loading…</p>
      ) : !authenticated ? (
        <form onSubmit={login} className="booking-card">
          <p>Invite-only access: {OWNER_EMAIL}</p>
          <p>
            Sign in with a one-time code sent to this address. Sessions last up
            to one hour.
          </p>
          {sent && (
            <label>
              One-time code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6,8}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          )}
          <button className="btn" disabled={busy}>
            {busy ? "Please wait…" : sent ? "Sign in" : "Email me a code"}
          </button>
          {sent && (
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setCode("");
              }}
            >
              Request another code
            </button>
          )}
        </form>
      ) : (
        <>
          <p>All deadlines below use Canary Islands time.</p>
          <div className="owner-actions">
            <button disabled={busy} onClick={sync}>
              Refresh calendars and process pending work
            </button>
            <button
              disabled={busy}
              onClick={() => load().catch((e) => setError(e.message))}
            >
              Refresh bookings
            </button>
            <button
              onClick={async () => {
                try {
                  await api("/api/admin/auth", { action: "logout" });
                  setAuthenticated(false);
                  setDashboard(null);
                  setSent(false);
                } catch {
                  setError("Could not sign out.");
                }
              }}
            >
              Sign out
            </button>
          </div>
          <p>
            Last complete calendar import: {date(dashboard?.lastSync || null)}.
            iCal updates at external platforms can be delayed.
          </p>
          {dashboard?.pendingMail.length ? (
            <details>
              <summary>
                {dashboard.pendingMail.length} pending email deliveries (up to
                50 shown)
              </summary>
              <ul>
                {dashboard.pendingMail.map((m) => (
                  <li key={m.id}>
                    {m.booking_id} · {m.kind} · {m.attempts} attempts{" "}
                    {m.last_error && `· ${m.last_error}`}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {dashboard?.bookings.map((r) => (
            <BookingCard
              key={r.id}
              r={r}
              busy={busy}
              onAction={(body) => action(r.id, body)}
            />
          ))}
          {dashboard?.bookings.length === 0 && <p>No booking requests yet.</p>}
          <div className="owner-actions">
            <button
              disabled={busy || page === 0}
              onClick={() => load(page - 1).catch((e) => setError(e.message))}
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              disabled={
                busy || !dashboard || (page + 1) * 30 >= dashboard.total
              }
              onClick={() => load(page + 1).catch((e) => setError(e.message))}
            >
              Next
            </button>
          </div>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </main>
  );
}
function BookingCard({
  r,
  busy,
  onAction,
}: {
  r: OwnerBooking;
  busy: boolean;
  onAction: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [deadline, setDeadline] = useState(""),
    [showCancellation, setShowCancellation] = useState(false),
    [reason, setReason] = useState<"guest" | "owner">("guest");
  const refund = reason === "owner" ? r.total_cents : r.refundQuote;
  return (
    <article className={`owner-booking ${r.conflict ? "owner-conflict" : ""}`}>
      <h2>
        {r.guest.firstName} {r.guest.lastName} · {r.start_date} → {r.end_date}
      </h2>
      <p>
        <strong>{r.status.replaceAll("_", " ")}</strong> · {r.guests} guests ·{" "}
        {money(r.total_cents)} · {r.payment_method}
      </p>
      <p>
        <a href={`mailto:${r.guest.email}`}>{r.guest.email}</a>
      </p>
      <p>{r.guest.message}</p>
      <p className="small">Reference: {r.id}</p>
      {r.expires_at && <p>Payment deadline: {date(r.expires_at)}</p>}
      {r.conflict && (
        <div role="alert">
          <strong>Calendar conflict — review now</strong>
          <p>
            Check the external booking. If the imported blocks represent this
            same reservation, acknowledge them below. This does not cancel or
            refund any booking.
          </p>
          <button
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "I verified that these exact calendar overlaps belong to this reservation, not another guest.",
                )
              )
                void onAction({ action: "acknowledge_conflict" });
            }}
          >
            Acknowledge verified calendar copies
          </button>
        </div>
      )}
      <details>
        <summary>Billing and agreement acceptance</summary>
        <p>
          {r.billing.kind}: {r.billing.name}
          <br />
          {r.billing.address}
          <br />
          {r.billing.country} · {r.billing.taxId}
        </p>
        <p>
          Terms {r.terms_version} accepted {date(r.accepted_at)}. Privacy
          accepted {date(r.privacy_accepted_at)}.
        </p>
      </details>
      <div className="owner-actions">
        {r.status === "request" && (
          <>
            <button
              disabled={busy}
              onClick={() => onAction({ action: "approve" })}
            >
              Approve and hold for 48 hours
            </button>
            <button
              disabled={busy}
              onClick={() => onAction({ action: "reject" })}
            >
              Reject request
            </button>
          </>
        )}
        {r.payment_method === "bank" &&
          ["awaiting_transfer", "expired"].includes(r.status) && (
            <button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "I have verified receipt of the full bank transfer. Recheck availability and confirm this booking?",
                  )
                )
                  void onAction({ action: "mark_paid" });
              }}
            >
              Mark bank payment received
            </button>
          )}
        {r.status === "awaiting_transfer" && (
          <button
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "Release this unpaid reservation and notify the guest?",
                )
              )
                void onAction({ action: "release" });
            }}
          >
            Release unpaid hold
          </button>
        )}
        {r.status === "confirmed" && (
          <button
            disabled={busy}
            onClick={() => setShowCancellation(!showCancellation)}
          >
            Review cancellation and refund
          </button>
        )}
        {r.paid_at && (
          <>
            <button
              disabled={busy}
              onClick={() => onAction({ action: "resend" })}
            >
              Resend documents and status
            </button>
            <a href={`/api/admin/bookings/${r.id}/documents/invoice`}>
              Invoice PDF
            </a>
            <a href={`/api/admin/bookings/${r.id}/documents/agreement`}>
              Agreement PDF
            </a>
          </>
        )}
        {r.credit_number && (
          <a href={`/api/admin/bookings/${r.id}/documents/credit`}>
            Credit note PDF
          </a>
        )}
      </div>
      {r.status === "awaiting_transfer" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onAction({
              action: "extend",
              expiresAt: new Date(deadline).toISOString(),
            });
          }}
        >
          <label>
            Extend payment deadline (your browser’s local time)
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
          <button disabled={busy || !deadline}>Extend and notify guest</button>
        </form>
      )}
      {showCancellation && r.status === "confirmed" && (
        <fieldset>
          <legend>Cancel paid booking</legend>
          <label>
            Reason
            <select
              value={reason}
              onChange={(e) =>
                setReason(e.target.value === "owner" ? "owner" : "guest")
              }
            >
              <option value="guest">
                Guest cancellation — apply agreed deadlines
              </option>
              <option value="owner">
                Casa Atlante cannot accommodate guest — full refund
              </option>
            </select>
          </label>
          <p>
            Paid: {money(r.total_cents)}. Refund:{" "}
            <strong>{money(refund)}</strong> (
            {r.total_cents ? Math.round((refund / r.total_cents) * 100) : 0}%).
            Includes IGIC.
          </p>
          <p>
            {r.payment_method === "stripe"
              ? "Confirming requests the Stripe refund automatically. Original processing fees remain your cost."
              : "Confirming records the refund owed. You must make the bank transfer and then mark it refunded."}
          </p>
          <button
            disabled={busy}
            onClick={() =>
              onAction({
                action: "cancel",
                reason,
                expectedRefundCents: refund,
              })
            }
          >
            Confirm cancellation and {money(refund)} refund
          </button>
        </fieldset>
      )}
      {r.status === "cancelled" && (
        <p>
          Refund: {money(r.refund_cents)} · {r.refund_state}
          {r.refund_state === "failed" ? " — action required in Stripe" : ""}
        </p>
      )}
      {r.refund_state === "manual" && (
        <button
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                `I have sent the ${money(r.refund_cents)} bank refund to the guest.`,
              )
            )
              void onAction({ action: "bank_refunded" });
          }}
        >
          Mark bank refund sent
        </button>
      )}
    </article>
  );
}
