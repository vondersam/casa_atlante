"use client";

import { useMemo, useState } from "react";

export type Booking = {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (checkout date, exclusive)
  source?: string;
  note?: string;
};

type CalendarCell = {
  label: number | null;
  isoDate?: string;
  inCurrentMonth: boolean;
  isBooked: boolean;
  isStart: boolean;
  isEnd: boolean;
  isBeforeMin: boolean;
};

export type SelectedRange = {
  start: string | null;
  end: string | null;
};

export type AvailabilityCalendarProps = {
  bookings: Booking[];
  updatedAt: string | null;
  error?: string | null;
  selectable?: boolean;
  selectedRange?: SelectedRange;
  onSelectRange?: (range: SelectedRange) => void;
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

export default function AvailabilityCalendar({
  bookings,
  updatedAt,
  error,
  selectable = false,
  selectedRange,
  onSelectRange,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const minSelectable = useMemo(() => {
    const min = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + 2
      )
    );
    return toISODate(min);
  }, [today]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [internalSelection, setInternalSelection] = useState<SelectedRange>({
    start: null,
    end: null,
  });
  const selection = selectedRange ?? internalSelection;

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

    const bookingState = (date: Date) => {
      const iso = toISODate(date);
      // Treat the start day as available (checkout of prior guest); block nights between start and end.
      const booked = bookings.some(
        (booking) => iso > booking.start && iso < booking.end
      );
      const isStart = bookings.some((booking) => iso === booking.start);
      const isEnd = bookings.some((booking) => iso === booking.end);
      return { booked, isStart, isEnd };
    };

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startOffset + 1;
      const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;

      if (!inCurrentMonth) {
        cellList.push({
          label: null,
          inCurrentMonth: false,
          isBooked: false,
          isStart: false,
          isEnd: false,
          isBeforeMin: false,
        });
        continue;
      }

      const date = new Date(Date.UTC(year, monthIndex, dayNumber));
      const { booked, isStart, isEnd } = bookingState(date);
      const iso = toISODate(date);
      cellList.push({
        label: dayNumber,
        isoDate: iso,
        inCurrentMonth: true,
        isBooked: booked,
        isStart,
        isEnd,
        isBeforeMin: iso < minSelectable,
      });
    }

    return cellList;
  }, [bookings, month, minSelectable]);

  function updateSelection(isoDate: string) {
    if (!selectable) return;
    const current = selection;

    // Start fresh if nothing selected or both set
    if (!current.start || (current.start && current.end)) {
      setInternalSelection({ start: isoDate, end: null });
      onSelectRange?.({ start: isoDate, end: null });
      return;
    }

    // If clicking before or same as start, reset start
    if (isoDate <= current.start) {
      setInternalSelection({ start: isoDate, end: null });
      onSelectRange?.({ start: isoDate, end: null });
      return;
    }

    // Otherwise set end (checkout date is exclusive)
    const next = { start: current.start, end: isoDate };
    setInternalSelection(next);
    onSelectRange?.(next);
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

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
              Synced {new Date(updatedAt).toLocaleString("en-GB", options)}
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

      {error ? (
        <p className="calendar-status error">
          {error || "Failed to load availability"}
        </p>
      ) : (
        <>
          <div className="calendar-grid">
            {weekdayLabels.map((day) => (
              <div key={day} className="calendar-cell weekday">
                {day}
              </div>
            ))}

            {cells.map((cell, index) => {
              const isSelectionStart =
                selection.start && cell.isoDate === selection.start;
              const isSelectionEnd =
                selection.end && cell.isoDate === selection.end;
              const isSelected =
                selection.start &&
                cell.isoDate &&
                ((selection.end &&
                  cell.isoDate >= selection.start &&
                  cell.isoDate <= selection.end) ||
                  (!selection.end && cell.isoDate === selection.start));

              const classes = [
                "calendar-cell",
                "day",
                cell.inCurrentMonth ? "" : "muted",
                cell.isBooked ? "booked" : "available",
                cell.isStart ? "boundary-start" : "",
                cell.isEnd ? "boundary-end" : "",
                selectable ? "selectable" : "",
                isSelected ? "selected" : "",
                isSelectionStart ? "selected-start" : "",
                isSelectionEnd ? "selected-end" : "",
                cell.isBeforeMin ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const label = cell.isoDate
                ? `${cell.isoDate} is ${
                    cell.isBooked ? "booked" : "available"
                  }${
                    cell.isStart ? " (checkout day for previous booking)" : ""
                  }${cell.isEnd ? " (check-in day for next booking)" : ""}`
                : undefined;

              const handleClick = () => {
                if (!selectable) return;
                if (
                  !cell.isoDate ||
                  cell.isBooked ||
                  !cell.inCurrentMonth ||
                  cell.isBeforeMin
                )
                  return;
                updateSelection(cell.isoDate);
              };

              return (
                <div
                  key={cell.isoDate ?? `pad-${index}`}
                  className={classes}
                  aria-label={label}
                  role={selectable ? "button" : undefined}
                  tabIndex={
                    selectable &&
                    cell.inCurrentMonth &&
                    !cell.isBooked &&
                    !cell.isBeforeMin
                      ? 0
                      : undefined
                  }
                  onClick={handleClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleClick();
                    }
                  }}
                >
                  <span className="day-number">
                    {cell.label !== null ? cell.label : ""}
                  </span>
                </div>
              );
            })}
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
