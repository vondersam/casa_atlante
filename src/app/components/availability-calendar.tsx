"use client";

import { useMemo, useState } from "react";
import { useT } from "@/i18n/context";
import { formatCompactDate } from "@/lib/date-format";

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
  isUnavailable: boolean;
  isStart: boolean;
  isEnd: boolean;
  isBeforeMin: boolean;
};

type BookingState = {
  isBooked: boolean;
  isStart: boolean;
  isEnd: boolean;
};

type DateRange = {
  start: string;
  end: string;
};

const MINIMUM_STAY_NIGHTS = 4;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

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

function formatMonth(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nightsBetween(start: string, end: string) {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 0;
  return Math.max(0, Math.round((endTime - startTime) / MILLISECONDS_PER_DAY));
}

function getShortAvailabilityWindows(
  bookings: Booking[],
  minSelectable: string
): DateRange[] {
  const mergedBookings = bookings
    .filter((booking) => booking.end > booking.start)
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start.localeCompare(b.start))
    .reduce<DateRange[]>((merged, booking) => {
      const previous = merged.at(-1);

      if (!previous || booking.start > previous.end) {
        merged.push({ ...booking });
      } else if (booking.end > previous.end) {
        previous.end = booking.end;
      }

      return merged;
    }, []);

  const shortWindows: DateRange[] = [];
  let availableFrom = minSelectable;

  for (const booking of mergedBookings) {
    if (booking.end <= availableFrom) continue;

    if (booking.start > availableFrom) {
      const availableNights = nightsBetween(availableFrom, booking.start);

      if (availableNights < MINIMUM_STAY_NIGHTS) {
        shortWindows.push({ start: availableFrom, end: booking.start });
      }
    }

    if (booking.end > availableFrom) {
      availableFrom = booking.end;
    }
  }

  return shortWindows;
}

function getBookingState(isoDate: string, bookings: Booking[]): BookingState {
  const isStart = bookings.some((booking) => isoDate === booking.start);
  const isEnd = bookings.some((booking) => isoDate === booking.end);
  const isBooked = bookings.some(
    (booking) => isoDate > booking.start && isoDate < booking.end
  );

  return {
    // Back-to-back existing stays leave neither half of the day available.
    isBooked: isBooked || (isStart && isEnd),
    isStart,
    isEnd,
  };
}

function canStartStay(isoDate: string, bookings: Booking[]) {
  return !bookings.some(
    (booking) => isoDate >= booking.start && isoDate < booking.end
  );
}

function isStayAvailable(start: string, end: string, bookings: Booking[]) {
  if (end <= start) return false;

  return !bookings.some(
    (booking) => start < booking.end && end > booking.start
  );
}

export default function AvailabilityCalendar({
  bookings,
  updatedAt,
  error,
  selectable = false,
  selectedRange,
  onSelectRange,
}: AvailabilityCalendarProps) {
  const t = useT("calendar");
  const tCommon = useT("common");
  const minSelectable = useMemo(() => {
    const today = new Date();
    const min = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + 2
      )
    );
    return toISODate(min);
  }, []);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [internalSelection, setInternalSelection] = useState<SelectedRange>({
    start: null,
    end: null,
  });
  const selection = selectedRange ?? internalSelection;
  const shortAvailabilityWindows = useMemo(
    () => getShortAvailabilityWindows(bookings, minSelectable),
    [bookings, minSelectable]
  );

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

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startOffset + 1;
      const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;

      if (!inCurrentMonth) {
        cellList.push({
          label: null,
          inCurrentMonth: false,
          isBooked: false,
          isUnavailable: false,
          isStart: false,
          isEnd: false,
          isBeforeMin: false,
        });
        continue;
      }

      const date = new Date(Date.UTC(year, monthIndex, dayNumber));
      const iso = toISODate(date);
      const { isBooked, isStart, isEnd } = getBookingState(iso, bookings);
      const isUnavailable = shortAvailabilityWindows.some(
        (window) => iso >= window.start && iso <= window.end
      );
      cellList.push({
        label: dayNumber,
        isoDate: iso,
        inCurrentMonth: true,
        isBooked,
        isUnavailable,
        isStart,
        isEnd,
        isBeforeMin: iso < minSelectable,
      });
    }

    return cellList;
  }, [bookings, month, minSelectable, shortAvailabilityWindows]);

  function canSelectDate(isoDate: string) {
    const current = selection;

    if (!current.start || current.end || isoDate <= current.start) {
      return canStartStay(isoDate, bookings);
    }

    return isStayAvailable(current.start, isoDate, bookings);
  }

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
          aria-label={t("previousMonth")}
        >
          ←
        </button>

        <div>
          <div className="month-label">{formatMonth(month, tCommon("localeTag"))}</div>
          {updatedAt ? (
            <p className="calendar-meta">
              {t("synced")} {new Date(updatedAt).toLocaleString(tCommon("localeTag"), options)}
            </p>
          ) : (
            <p className="calendar-meta">{t("syncing")}</p>
          )}
        </div>

        <button
          className="calendar-nav"
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label={t("nextMonth")}
        >
          →
        </button>
      </div>

      {error ? (
        <p className="calendar-status error">
          {error || t("loadError")}
        </p>
      ) : (
        <>
          <div className="calendar-grid">
            {[t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")].map((day) => (
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
              const isDateSelectable = Boolean(
                selectable &&
                  cell.isoDate &&
                  cell.inCurrentMonth &&
                  !cell.isBeforeMin &&
                  !cell.isUnavailable &&
                  canSelectDate(cell.isoDate)
              );

              const classes = [
                "calendar-cell",
                "day",
                cell.inCurrentMonth ? "" : "muted",
                cell.isBooked ? "booked" : "available",
                cell.isUnavailable ? "unavailable" : "",
                cell.isStart ? "boundary-start" : "",
                cell.isEnd ? "boundary-end" : "",
                isDateSelectable ? "selectable" : "",
                isSelected ? "selected" : "",
                isSelectionStart ? "selected-start" : "",
                isSelectionEnd ? "selected-end" : "",
                cell.isBeforeMin ? "disabled" : "",
                selectable &&
                cell.inCurrentMonth &&
                !cell.isBeforeMin &&
                !isDateSelectable
                  ? "unselectable"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              const dateStatusKey = cell.isUnavailable
                ? "dateUnavailable"
                : cell.isBooked
                  ? "dateBooked"
                  : "dateAvailable";
              const label = cell.isoDate
                ? `${t(dateStatusKey, {
                    date: formatCompactDate(cell.isoDate),
                  })}${cell.isStart ? t("checkoutBoundary") : ""}${
                    cell.isEnd ? t("checkinBoundary") : ""
                  }`
                : undefined;

              const handleClick = () => {
                if (!cell.isoDate || !isDateSelectable) return;
                updateSelection(cell.isoDate);
              };

              return (
                <div
                  key={cell.isoDate ?? `pad-${index}`}
                  className={classes}
                  aria-label={label}
                  aria-disabled={
                    selectable && cell.inCurrentMonth
                      ? !isDateSelectable
                      : undefined
                  }
                  role={selectable && cell.inCurrentMonth ? "button" : undefined}
                  tabIndex={isDateSelectable ? 0 : undefined}
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
            <span>{t("available")}</span>
            <span className="legend-dot booked" />
            <span>{t("booked")}</span>
            <span className="legend-dot unavailable" />
            <span>{t("unavailable")}</span>
          </div>
        </>
      )}
    </div>
  );
}
