import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminClientError, adminClient } from "../api/adminClient";
import { formatDate, formatDateRange, formatMoney, paymentStateLabel } from "../components/Admin/adminUtils";
import type { AdminBookingDetail } from "../types/admin";

export function AdminBookingDetailPage() {
  const { reservationId = "" } = useParams();
  const [detail, setDetail] = useState<AdminBookingDetail | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [savingOps, setSavingOps] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await adminClient.bookingDetail(reservationId);
      setDetail(result);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not load booking detail.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [reservationId]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      const result = await adminClient.refreshBooking(reservationId);
      setDetail(result);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not refresh booking.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleNote = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!noteBody.trim()) {
      return;
    }
    setSavingNote(true);
    try {
      const result = await adminClient.addBookingNote(reservationId, noteBody);
      setDetail(result);
      setNoteBody("");
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not save note.");
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleOpsUpdate = async (internalStatus: string, invoiceState: string): Promise<void> => {
    setSavingOps(true);
    try {
      const result = await adminClient.updateBookingOps(reservationId, { internalStatus, invoiceState });
      setDetail(result);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not update admin state.");
      }
    } finally {
      setSavingOps(false);
    }
  };

  const booking = detail?.booking;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Booking detail</span>
          <h1>{booking?.unitName ?? "Booking"}</h1>
          <p>{booking ? formatDateRange(booking.arrivalDate, booking.departureDate) : "Loading booking detail"}</p>
        </div>
        <div className="admin-inline-actions">
          <button type="button" className="button secondary" onClick={() => void handleRefresh()} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh from Smoobu"}
          </button>
          {booking?.guestAppUrl ? (
            <a className="button ghost" href={booking.guestAppUrl} target="_blank" rel="noreferrer">
              Open payment
            </a>
          ) : null}
          {booking?.smoobuBackofficeUrl ? (
            <a className="button ghost" href={booking.smoobuBackofficeUrl} target="_blank" rel="noreferrer">
              Open in Smoobu
            </a>
          ) : null}
        </div>
      </div>

      <Link className="admin-back-link" to="/admin/bookings">
        Back to bookings
      </Link>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="muted">Loading booking detail...</p> : null}

      {booking ? (
        <>
          <section className="admin-grid detail-top">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Reservation summary</h2>
                <span className={`admin-pill ${booking.paymentState}`}>{paymentStateLabel(booking.paymentState)}</span>
              </div>
              <div className="admin-detail-grid">
                <div><p>Reservation ID</p><strong>{booking.reservationId}</strong></div>
                <div><p>Reference</p><strong>{booking.bookingReference || "-"}</strong></div>
                <div><p>Guest</p><strong>{booking.guestName || "-"}</strong></div>
                <div><p>Email</p><strong>{booking.guestEmail || "-"}</strong></div>
                <div><p>Source</p><strong>{booking.channelName || "-"}</strong></div>
                <div><p>Stay</p><strong>{formatDateRange(booking.arrivalDate, booking.departureDate)}</strong></div>
                <div><p>Total</p><strong>{formatMoney(booking.priceTotal)}</strong></div>
                <div><p>Balance due</p><strong>{formatMoney(booking.balanceDue)}</strong></div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Operational state</h2>
              </div>
              <div className="admin-ops-grid">
                <label>
                  Internal status
                  <select
                    value={booking.internalStatus}
                    onChange={(event) => void handleOpsUpdate(event.target.value, booking.invoiceState)}
                    disabled={savingOps}
                  >
                    <option value="new">New</option>
                    <option value="follow_up">Follow up</option>
                    <option value="waiting_invoice_payment">Waiting invoice payment</option>
                    <option value="paid_verified">Paid verified</option>
                    <option value="issue">Issue</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <label>
                  Invoice state
                  <select
                    value={booking.invoiceState}
                    onChange={(event) => void handleOpsUpdate(booking.internalStatus, event.target.value)}
                    disabled={savingOps}
                  >
                    <option value="not_applicable">Not applicable</option>
                    <option value="to_issue">To issue</option>
                    <option value="issued">Issued</option>
                    <option value="waiting_funds">Waiting funds</option>
                    <option value="funds_received">Funds received</option>
                  </select>
                </label>
              </div>
              <div className="admin-detail-grid compact">
                <div><p>Price paid</p><strong>{formatMoney(booking.pricePaid)}</strong></div>
                <div><p>Payment method</p><strong>{booking.paymentMethod || "-"}</strong></div>
                <div><p>Synced</p><strong>{formatDate(booking.syncedAt)}</strong></div>
                <div><p>Source updated</p><strong>{formatDate(booking.sourceUpdatedAt)}</strong></div>
              </div>
            </article>
          </section>

          <section className="admin-grid detail-columns">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Price elements</h2>
              </div>
              <div className="admin-list">
                {detail?.priceElements.map((element) => (
                  <div key={`${element.remotePriceElementId}-${element.id}`} className="admin-list-item">
                    <div>
                      <strong>{element.name}</strong>
                      <p>{element.type || "line item"}</p>
                    </div>
                    <div className="admin-list-meta">
                      <span>x{element.quantity}</span>
                      <strong>{formatMoney(element.amount * element.quantity)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Internal notes</h2>
              </div>
              <form className="admin-note-form" onSubmit={handleNote}>
                <textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} rows={4} placeholder="Add follow-up notes, reminders, payment context..." />
                <button type="submit" className="button primary" disabled={savingNote}>
                  {savingNote ? "Saving..." : "Add note"}
                </button>
              </form>
              <div className="admin-list">
                {detail?.notes.map((note) => (
                  <div key={note.id} className="admin-note-item">
                    <strong>{note.authorName}</strong>
                    <span>{formatDate(note.createdAt)}</span>
                    <p>{note.body}</p>
                  </div>
                ))}
                {detail?.notes.length === 0 ? <p className="muted">No notes yet.</p> : null}
              </div>
            </article>
          </section>

          <section className="admin-grid detail-columns">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Submission history</h2>
              </div>
              <div className="admin-list">
                {detail?.submissions.map((submission) => (
                  <div key={submission.id} className="admin-list-item">
                    <div>
                      <strong>{submission.outcome}</strong>
                      <p>{submission.guestName || submission.guestEmail}</p>
                    </div>
                    <div className="admin-list-meta">
                      <span>{formatDate(submission.createdAt)}</span>
                      <strong>{formatMoney(submission.grossTotal)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Provider notice</h2>
              </div>
              <pre className="admin-raw-box">{booking.notice || "No notice stored."}</pre>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
