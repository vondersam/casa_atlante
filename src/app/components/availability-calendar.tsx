"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (checkout date, exclusive)
  source?: string;
  note?: string;
};

type AvailabilityResponse = {
  bookings: Booking[];
  updatedAt?: string;
};

type CalendarCell = {
  label: number | null;
  isoDate?: string;
  inCurrentMonth: boolean;
  isBooked: boolean;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function AvailabilityCalendar() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const res = await fetch("/api/availability", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load availability");
        const data: AvailabilityResponse = await res.json();
        if (!cancelled) {
          setBookings(data.bookings || []);
          setUpdatedAt(data.updatedAt ?? null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  function shiftMonth(delta: number) {
    const next = new Date(month);
    next.setUTCMonth(month.getUTCMonth() + delta, 1);
    setMonth(next);
  }

  const cells: CalendarCell[] = useMemo(() => {
    const year = month.getUTCFullYear();
    const monthIndex = month.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, monthIndex, 1));
    const startOffset = (firstDay.getUTCDay() + 6) % 7; // Monday as first column
    const daysInMonth = new Date(
      Date.UTC(year, monthIndex + 1, 0)
    ).getUTCDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cellList: CalendarCell[] = [];

    const isBooked = (date: Date) => {
      const iso = toISODate(date);
      return bookings.some((booking) => iso >= booking.start && iso < booking.end);
    };

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startOffset + 1;
      const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;

      if (!inCurrentMonth) {
        cellList.push({
          label: null,
          inCurrentMonth: false,
          isBooked: false,
        });
        continue;
      }

      const date = new Date(Date.UTC(year, monthIndex, dayNumber));
      cellList.push({
        label: dayNumber,
        isoDate: toISODate(date),
        inCurrentMonth: true,
        isBooked: isBooked(date)
      });
    }

    return cellList;
  }, [bookings, month]);

  return (
    <div className="availability-card">
      <div className="calendar-header">
        <button
          className="calendar-nav"
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          ←
        </button>

        <div>
          <p className="eyebrow">Availability</p>
          <div className="month-label">{formatMonth(month)}</div>
          {updatedAt ? (
            <p className="calendar-meta">
              Synced {new Date(updatedAt).toLocaleString()}
            </p>
          ) : (
            <p className="calendar-meta">Syncing calendar…</p>
          )}
        </div>

        <button
          className="calendar-nav"
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {loading && <p className="calendar-status">Loading availability…</p>}
      {error && <p className="calendar-status error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="calendar-grid">
            {weekdayLabels.map((day) => (
              <div key={day} className="calendar-cell weekday">
                {day}
              </div>
            ))}

            {cells.map((cell, index) => (
              <div
                key={cell.isoDate ?? `pad-${index}`}
                className={`calendar-cell day ${
                  cell.inCurrentMonth ? "" : "muted"
                } ${cell.isBooked ? "booked" : "available"}`}
                aria-label={
                  cell.isoDate
                    ? `${cell.isoDate} is ${
                        cell.isBooked ? "booked" : "available"
                      }`
                    : undefined
                }
              >
                <span className="day-number">
                  {cell.label !== null ? cell.label : ""}
                </span>
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <span className="legend-dot available" />
            <span>Available</span>
            <span className="legend-dot booked" />
            <span>Booked</span>
          </div>
        </>
      )}
    </div>
  );
}
