import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminClientError, adminClient } from "../api/adminClient";
import { formatDateRange, formatMoney, paymentStateLabel } from "../components/Admin/adminUtils";
import type { AdminBookingSummary } from "../types/admin";

export function AdminBookingsPage() {
  const [items, setItems] = useState<AdminBookingSummary[]>([]);
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([]);
  const [query, setQuery] = useState("");
  const [unitId, setUnitId] = useState("");
  const [paymentState, setPaymentState] = useState("");
  const [internalStatus, setInternalStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (unitId) params.set("unitId", unitId);
      if (paymentState) params.set("paymentState", paymentState);
      if (internalStatus) params.set("internalStatus", internalStatus);

      const result = await adminClient.bookings(params);
      setItems(result.items);
      setUnits(result.filters.units);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not load bookings.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Reservation mirror</span>
          <h1>Bookings</h1>
          <p>Search reservations, inspect payment state, and open each booking detail.</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Guest, email, reservation" />
        <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
          <option value="">All units</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <select value={paymentState} onChange={(event) => setPaymentState(event.target.value)}>
          <option value="">All payment states</option>
          <option value="open">Open</option>
          <option value="invoice_waiting">Invoice waiting</option>
          <option value="paid">Paid</option>
          <option value="channel_managed">Channel managed</option>
        </select>
        <select value={internalStatus} onChange={(event) => setInternalStatus(event.target.value)}>
          <option value="">All internal states</option>
          <option value="new">New</option>
          <option value="follow_up">Follow up</option>
          <option value="waiting_invoice_payment">Waiting invoice payment</option>
          <option value="paid_verified">Paid verified</option>
          <option value="issue">Issue</option>
          <option value="done">Done</option>
        </select>
        <button type="button" className="button secondary" onClick={() => void load()}>
          Apply
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="muted">Loading bookings...</p> : null}
      {!loading ? <p className="admin-section-caption">{items.length} mirrored reservations</p> : null}

      <div className="admin-record-list">
        {items.map((booking) => (
          <Link key={booking.reservationId} className="admin-record-row admin-record-row-booking" to={`/admin/bookings/${booking.reservationId}`}>
            <div className="admin-record-main">
              <strong>{booking.guestName || booking.bookingReference || booking.reservationId}</strong>
              <p>{booking.unitName || "Unknown unit"} · {booking.channelName || "Unknown source"}</p>
            </div>
            <div className="admin-record-meta">
              <div>
                <span>Stay</span>
                <strong>{formatDateRange(booking.arrivalDate, booking.departureDate)}</strong>
              </div>
              <div>
                <span>Guests</span>
                <strong>{booking.adults} adults / {booking.children} children</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>{formatMoney(booking.balanceDue)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatMoney(booking.priceTotal)}</strong>
              </div>
              <div className="admin-record-tags">
                <span className={`admin-pill ${booking.paymentState}`}>{paymentStateLabel(booking.paymentState)}</span>
                <span className={`admin-pill subtle ${booking.internalStatus}`}>{booking.internalStatus.replace(/_/g, " ")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!loading && items.length === 0 ? <p className="muted">No bookings found.</p> : null}
    </div>
  );
}
