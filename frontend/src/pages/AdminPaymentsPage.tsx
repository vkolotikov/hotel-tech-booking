import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminClientError, adminClient } from "../api/adminClient";
import { formatDateRange, formatMoney, paymentStateLabel } from "../components/Admin/adminUtils";
import type { AdminBookingSummary } from "../types/admin";

export function AdminPaymentsPage() {
  const [items, setItems] = useState<AdminBookingSummary[]>([]);
  const [paymentState, setPaymentState] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentState) {
        params.set("paymentState", paymentState);
      }
      const result = await adminClient.payments(params);
      setItems(result.items);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not load payments.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [paymentState]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Finance queue</span>
          <h1>Payments</h1>
          <p>Focus on unpaid bookings, invoice follow-up, and paid verification.</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <select value={paymentState} onChange={(event) => setPaymentState(event.target.value)}>
          <option value="open">Open payments</option>
          <option value="invoice_waiting">Invoice waiting</option>
          <option value="paid">Paid</option>
          <option value="channel_managed">Channel managed</option>
          <option value="">All</option>
        </select>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="muted">Loading payments...</p> : null}
      {!loading ? <p className="admin-section-caption">{items.length} payment records</p> : null}

      <div className="admin-record-list">
        {items.map((booking) => (
          <Link key={booking.reservationId} className="admin-record-row admin-record-row-payment" to={`/admin/bookings/${booking.reservationId}`}>
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
                <span>Paid</span>
                <strong>{formatMoney(booking.pricePaid)}</strong>
              </div>
              <div>
                <span>Due</span>
                <strong>{formatMoney(booking.balanceDue)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatMoney(booking.priceTotal)}</strong>
              </div>
              <div className="admin-record-tags">
                <span className={`admin-pill ${booking.paymentState}`}>{paymentStateLabel(booking.paymentState)}</span>
                <span className="admin-pill subtle">{booking.paymentMethod || "unspecified"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!loading && items.length === 0 ? <p className="muted">No payment items found.</p> : null}
    </div>
  );
}
