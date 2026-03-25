import { useEffect, useState } from "react";
import { AdminClientError, adminClient } from "../api/adminClient";
import { formatDate, formatDateRange, formatMoney } from "../components/Admin/adminUtils";
import type { AdminSubmission } from "../types/admin";

export function AdminSubmissionsPage() {
  const [items, setItems] = useState<AdminSubmission[]>([]);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (outcome) params.set("outcome", outcome);
      const result = await adminClient.submissions(params);
      setItems(result.items);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not load submissions.");
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
          <span className="admin-eyebrow">Operational inbox</span>
          <h1>Submissions</h1>
          <p>Every booking attempt from the app, including failures and confirmed reservations.</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guest, email, reference" />
        <select value={outcome} onChange={(event) => setOutcome(event.target.value)}>
          <option value="">All outcomes</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
        <button type="button" className="button secondary" onClick={() => void load()}>
          Apply
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="muted">Loading submissions...</p> : null}
      {!loading ? <p className="admin-section-caption">{items.length} submission records</p> : null}

      <div className="admin-table">
        <div className="admin-table-row admin-table-head">
          <span>Guest</span>
          <span>Stay</span>
          <span>Payment</span>
          <span>Total</span>
          <span>Status</span>
          <span>Created</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="admin-table-row">
            <span>
              <strong>{item.guestName || item.guestEmail}</strong>
              <small>{item.unitName}</small>
            </span>
            <span>{formatDateRange(item.checkIn, item.checkOut)}</span>
            <span>{item.paymentMethod || "-"}</span>
            <span>{formatMoney(item.grossTotal)}</span>
            <span className={`admin-pill ${item.outcome}`}>{item.outcome}</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        ))}
        {!loading && items.length === 0 ? (
          <p className="muted">No app-origin submissions yet. Smoobu mirror sync does not populate this inbox.</p>
        ) : null}
      </div>
    </div>
  );
}
