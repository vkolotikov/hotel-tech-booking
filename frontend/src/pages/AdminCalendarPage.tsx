import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AdminClientError, adminClient } from "../api/adminClient";
import { paymentStateLabel } from "../components/Admin/adminUtils";
import type { AdminCalendarBooking, AdminCalendarData } from "../types/admin";

type DayFilter = "all" | "weekdays" | "weekends";
type CalendarPaymentFilter = "all" | "paid" | "open" | "invoice_waiting" | "channel_managed";
type CalendarRangeView = "month" | "week" | "day";

type UnitVisual = {
  icon: "house" | "cabin" | "sauna" | "tiny" | "retreat";
  accent: string;
  soft: string;
  glow: string;
};

function shiftMonth(month: string, delta: number): string {
  const [yearValue, monthValue] = month.split("-").map(Number);
  const shiftedMonthIndex = yearValue * 12 + (monthValue - 1) + delta;
  const nextYear = Math.floor(shiftedMonthIndex / 12);
  const nextMonth = (shiftedMonthIndex % 12 + 12) % 12;

  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}

function formatWeekday(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${value}T00:00:00`));
}

function isToday(value: string): boolean {
  return new Date().toISOString().slice(0, 10) === value;
}

function isWeekend(value: string): boolean {
  const day = new Date(`${value}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function stayNights(arrivalDate: string, departureDate: string): number {
  const start = new Date(`${arrivalDate}T00:00:00`);
  const end = new Date(`${departureDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(diff, 1);
}

function bookingGridRange(arrivalDate: string, departureDate: string, days: string[]): { start: number; end: number } {
  const occupiedDays = days.filter((day) => day >= arrivalDate && day < departureDate);
  const startDay = occupiedDays[0] ?? days[0];
  const endDay = occupiedDays[occupiedDays.length - 1] ?? startDay;
  const startIndex = Math.max(0, days.findIndex((day) => day === startDay));
  const endIndex = Math.max(startIndex + 1, days.findIndex((day) => day === endDay) + 1);

  return {
    start: startIndex + 1,
    end: endIndex + 1,
  };
}

function paymentMix(bookings: AdminCalendarBooking[]): Record<string, number> {
  return bookings.reduce<Record<string, number>>((accumulator, booking) => {
    const key = booking.paymentState || "unknown";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function visibleDays(days: string[], filter: DayFilter): string[] {
  if (filter === "weekdays") {
    return days.filter((day) => !isWeekend(day));
  }

  if (filter === "weekends") {
    return days.filter((day) => isWeekend(day));
  }

  return days;
}

function rangeDays(days: string[], rangeView: CalendarRangeView, focusDate: string): string[] {
  if (days.length === 0) {
    return [];
  }

  const safeFocusDate = days.includes(focusDate) ? focusDate : days[0];

  if (rangeView === "day") {
    return days.filter((day) => day === safeFocusDate);
  }

  if (rangeView === "week") {
    const focus = new Date(`${safeFocusDate}T00:00:00`);
    const weekday = focus.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const weekStart = new Date(focus);
    weekStart.setDate(focus.getDate() + mondayOffset);
    const weekStartIso = weekStart.toISOString().slice(0, 10);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndIso = weekEnd.toISOString().slice(0, 10);

    return days.filter((day) => day >= weekStartIso && day <= weekEndIso);
  }

  return days;
}

function bookingVisibleInDays(booking: AdminCalendarBooking, days: string[]): boolean {
  return days.some((day) => day >= booking.arrivalDate && day < booking.departureDate);
}

function resolveUnitVisual(unitName: string): UnitVisual {
  const normalized = unitName.toLowerCase();

  if (normalized.includes("sauna")) {
    return {
      icon: "sauna",
      accent: "#5ab4b2",
      soft: "rgba(90, 180, 178, 0.16)",
      glow: "rgba(90, 180, 178, 0.22)",
    };
  }

  if (normalized.includes("tiny")) {
    return {
      icon: "tiny",
      accent: "#d98f45",
      soft: "rgba(217, 143, 69, 0.16)",
      glow: "rgba(217, 143, 69, 0.22)",
    };
  }

  if (normalized.includes("lodge")) {
    return {
      icon: "cabin",
      accent: "#74c895",
      soft: "rgba(116, 200, 149, 0.16)",
      glow: "rgba(116, 200, 149, 0.2)",
    };
  }

  if (normalized.includes("no.5") || normalized.includes("no5")) {
    return {
      icon: "retreat",
      accent: "#81a6e8",
      soft: "rgba(129, 166, 232, 0.16)",
      glow: "rgba(129, 166, 232, 0.22)",
    };
  }

  return {
    icon: "house",
    accent: "#d5c06a",
    soft: "rgba(213, 192, 106, 0.16)",
    glow: "rgba(213, 192, 106, 0.22)",
  };
}

function shortGuestLabel(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return value;
  }

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function UnitIcon({ icon }: { icon: UnitVisual["icon"] }) {
  if (icon === "sauna") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5h8v5H8V5Zm-3 8c0-1.66 1.34-3 3-3h8c1.66 0 3 1.34 3 3v5H5v-5Zm4-10c0-1.1.9-2 2-2v2H9Zm4 0c0-1.1.9-2 2-2v2h-2Z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "tiny") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 11.5 12 6l7 5.5V19H5v-7.5Zm3 5h3v-3H8v3Zm5 0h3v-5h-3v5Z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "cabin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10 12 4l8 6v9h-3v-6H7v6H4v-9Zm5 9h6v-4H9v4Z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "retreat") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 3 9v10h18V9l-9-6Zm0 3.1L18 10v7h-3v-4H9v4H6v-7l6-3.9Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 4 10v10h5v-6h6v6h5V10l-8-6Zm-1 14H8v-3h3v3Zm5 0h-3v-5H8v5H6v-7l6-4.5 6 4.5v7Z" fill="currentColor" />
    </svg>
  );
}

export function AdminCalendarPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rangeView, setRangeView] = useState<CalendarRangeView>("month");
  const [focusDate, setFocusDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<CalendarPaymentFilter>("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [data, setData] = useState<AdminCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    void adminClient
      .calendar(month)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError instanceof AdminClientError) {
          setError(requestError.error.message);
        } else {
          setError("Could not load calendar.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [month]);

  useEffect(() => {
    if (!focusDate.startsWith(`${month}-`)) {
      setFocusDate(`${month}-01`);
    }
  }, [focusDate, month]);

  const filtered = useMemo(() => {
    if (!data) {
      return null;
    }

    const daySet = visibleDays(rangeDays(data.days, rangeView, focusDate), dayFilter);
    const units = data.units
      .filter((unit) => unitFilter === "all" || unit.unitId === unitFilter)
      .map((unit) => {
      const bookings = unit.bookings.filter((booking) => {
        const paymentMatches = paymentFilter === "all" || booking.paymentState === paymentFilter;
        return paymentMatches && bookingVisibleInDays(booking, daySet);
      });

      return {
        ...unit,
        visibleDays: daySet,
        bookings,
      };
    });

    const visibleBookingCount = units.reduce((sum, unit) => sum + unit.bookings.length, 0);
    const occupiedNights = units.reduce(
      (sum, unit) => sum + unit.bookings.reduce((unitSum, booking) => unitSum + stayNights(booking.arrivalDate, booking.departureDate), 0),
      0,
    );

    return {
      units,
      visibleBookingCount,
      visibleDayCount: daySet.length,
      visibleDays: daySet,
      occupiedNights,
      rangeView,
    };
  }, [data, dayFilter, focusDate, paymentFilter, rangeView, unitFilter]);

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-calendar-page-header">
        <div>
          <span className="admin-eyebrow">Occupancy</span>
          <h1>Calendar</h1>
          <p>Filter by month, weekday focus, and payment state to manage bookings faster.</p>
        </div>
        {filtered ? (
          <div className="admin-calendar-header-overview">
            <div className="admin-calendar-header-summary">
              <div>
                <h2>{formatMonthLabel(month)}</h2>
                <p>
                  {filtered.rangeView.charAt(0).toUpperCase() + filtered.rangeView.slice(1)} view / {filtered.visibleDayCount} day
                  {filtered.visibleDayCount === 1 ? "" : "s"} visible / {filtered.visibleBookingCount} booking
                  {filtered.visibleBookingCount === 1 ? "" : "s"} match the current filters.
                </p>
              </div>
              <div className="admin-calendar-stats">
                <div className="admin-calendar-stat-card">
                  <span>Houses</span>
                  <strong>{filtered.units.length}</strong>
                </div>
                <div className="admin-calendar-stat-card">
                  <span>Visible bookings</span>
                  <strong>{filtered.visibleBookingCount}</strong>
                </div>
                <div className="admin-calendar-stat-card">
                  <span>Occupied nights</span>
                  <strong>{filtered.occupiedNights}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-inline-actions">
            <span className="admin-calendar-header-badge">{formatMonthLabel(month)}</span>
          </div>
        )}
      </div>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="muted">Loading calendar...</p> : null}

      {filtered ? (
        <div className="admin-calendar-board">
          <article className="admin-panel admin-calendar-filter-panel">
            <div className="admin-calendar-filter-group">
              <span className="admin-calendar-filter-label">Month</span>
              <div className="admin-calendar-toolbar-row">
                <div className="admin-inline-actions admin-calendar-toolbar">
                  <button type="button" className="button ghost" onClick={() => setMonth((value) => shiftMonth(value, -1))}>
                    Previous
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      const currentMonth = new Date().toISOString().slice(0, 7);
                      setMonth(currentMonth);
                      setFocusDate(new Date().toISOString().slice(0, 10));
                    }}
                  >
                    Current month
                  </button>
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => {
                      setMonth(event.target.value);
                      setFocusDate(`${event.target.value}-01`);
                    }}
                  />
                  <button type="button" className="button ghost" onClick={() => setMonth((value) => shiftMonth(value, 1))}>
                    Next
                  </button>
                </div>
                <div className="admin-calendar-toolbar-meta">
                  <div className="admin-calendar-legend">
                    <span className="admin-pill paid">Paid</span>
                    <span className="admin-pill open">Open</span>
                    <span className="admin-pill invoice_waiting">Invoice waiting</span>
                    <span className="admin-pill channel_managed">Channel managed</span>
                  </div>
                  <div className="admin-calendar-house-legend">
                    <button
                      type="button"
                      className={`admin-calendar-house-chip ${unitFilter === "all" ? "active" : ""}`}
                      onClick={() => setUnitFilter("all")}
                    >
                      All houses
                    </button>
                    {filtered.units.map((unit) => {
                      const visual = resolveUnitVisual(unit.unitName);

                      return (
                        <button
                          type="button"
                          key={unit.unitId}
                          className={`admin-calendar-house-chip ${unitFilter === unit.unitId ? "active" : ""}`}
                          onClick={() => setUnitFilter(unit.unitId)}
                          style={
                            {
                              "--unit-accent": visual.accent,
                              "--unit-soft": visual.soft,
                            } as CSSProperties
                          }
                        >
                          <UnitIcon icon={visual.icon} />
                          {unit.unitName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-calendar-filter-grid">
              <div className="admin-calendar-filter-field">
                <span>Range</span>
                <div className="admin-calendar-range-tabs" role="tablist" aria-label="Calendar range">
                  {(["month", "week", "day"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={rangeView === option}
                      className={`admin-calendar-range-tab ${rangeView === option ? "active" : ""}`}
                      onClick={() => setRangeView(option)}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="admin-calendar-filter-field">
                <span>Weekday filter</span>
                <select value={dayFilter} onChange={(event) => setDayFilter(event.target.value as DayFilter)}>
                  <option value="all">All days</option>
                  <option value="weekdays">Weekdays only</option>
                  <option value="weekends">Weekends only</option>
                </select>
              </label>
              <label className="admin-calendar-filter-field">
                <span>Payment state</span>
                <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as CalendarPaymentFilter)}>
                  <option value="all">All payment states</option>
                  <option value="paid">Paid only</option>
                  <option value="open">Open only</option>
                  <option value="invoice_waiting">Invoice waiting</option>
                  <option value="channel_managed">Channel managed</option>
                </select>
              </label>
            </div>
          </article>

          {filtered.units.map((unit) => {
            const mix = paymentMix(unit.bookings);
            const visual = resolveUnitVisual(unit.unitName);
            const occupiedNights = unit.bookings.reduce(
              (sum, booking) => sum + stayNights(booking.arrivalDate, booking.departureDate),
              0,
            );

            return (
              <article
                key={unit.unitId}
                className="admin-calendar-unit admin-calendar-unit-upgraded"
                style={
                  {
                    "--unit-accent": visual.accent,
                    "--unit-soft": visual.soft,
                    "--unit-glow": visual.glow,
                  } as CSSProperties
                }
              >
                <div className="admin-calendar-unit-header upgraded">
                  <div className="admin-calendar-unit-identity">
                    <span className="admin-calendar-unit-icon">
                      <UnitIcon icon={visual.icon} />
                    </span>
                    <div>
                      <strong>{unit.unitName}</strong>
                      <p>{unit.bookings.length} booking{unit.bookings.length === 1 ? "" : "s"} / {occupiedNights} occupied night{occupiedNights === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <div className="admin-calendar-unit-metrics">
                    <span className="admin-calendar-unit-pill">{mix.paid ?? 0} paid</span>
                    <span className="admin-calendar-unit-pill subtle">{mix.open ?? 0} open</span>
                    <span className="admin-calendar-unit-pill subtle">{mix.invoice_waiting ?? 0} invoice</span>
                    <span className="admin-calendar-unit-pill subtle">{mix.channel_managed ?? 0} channel</span>
                  </div>
                </div>

                {unit.bookings.length === 0 ? <p className="muted">No bookings match the current filters for this house.</p> : null}

                {unit.bookings.length > 0 ? (
                  <div className="admin-calendar-shell">
                    <div className="admin-calendar-days-sticky">
                      <div className="admin-calendar-booking-summary-label">Booking</div>
                      <div className="admin-calendar-axis" style={{ "--calendar-days": unit.visibleDays.length } as CSSProperties}>
                        {unit.visibleDays.map((day) => (
                          <span
                            key={day}
                            className={[
                              isWeekend(day) ? "weekend" : "",
                              isToday(day) ? "today" : "",
                            ].join(" ").trim()}
                          >
                            <small>{formatWeekday(day)}</small>
                            {day.slice(-2)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="admin-calendar-lanes upgraded">
                      {unit.bookings.map((booking) => {
                        const range = bookingGridRange(booking.arrivalDate, booking.departureDate, unit.visibleDays);
                        return (
                          <div key={booking.reservationId} className="admin-calendar-lane upgraded">
                            <div className="admin-calendar-booking-summary">
                              <div>
                                <strong>{booking.guestName || booking.reservationId}</strong>
                                <p>{formatShortDate(booking.arrivalDate)} to {formatShortDate(booking.departureDate)}</p>
                              </div>
                              <div className="admin-calendar-booking-summary-meta">
                                <span>{stayNights(booking.arrivalDate, booking.departureDate)} night{stayNights(booking.arrivalDate, booking.departureDate) === 1 ? "" : "s"}</span>
                                <span className={`admin-pill ${booking.paymentState}`}>{paymentStateLabel(booking.paymentState)}</span>
                              </div>
                            </div>
                            <div
                              className="admin-calendar-strip"
                              style={{ "--calendar-days": unit.visibleDays.length } as CSSProperties}
                            >
                              {unit.visibleDays.map((day) => (
                                <span
                                  key={`${booking.reservationId}-${day}`}
                                  className={[
                                    "admin-calendar-cell",
                                    isWeekend(day) ? "weekend" : "",
                                    isToday(day) ? "today" : "",
                                  ].join(" ")}
                                />
                              ))}
                              <Link
                                className={`admin-calendar-bar ${booking.paymentState}`}
                                to={`/admin/bookings/${booking.reservationId}`}
                                style={{ gridColumn: `${range.start} / ${range.end}` }}
                                title={`${booking.guestName || booking.reservationId} / ${booking.arrivalDate} - ${booking.departureDate}`}
                              >
                                <strong>{shortGuestLabel(booking.guestName || booking.reservationId)}</strong>
                                <span>{booking.reservationId}</span>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
