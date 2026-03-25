import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminClientError, adminClient } from "../api/adminClient";
import {
  AdminBarsChart,
  AdminChannelList,
  AdminDonutChart,
  AdminHorizontalBars,
} from "../components/Admin/AdminCharts";
import { formatDate, formatDateRange, formatMoney, paymentStateLabel } from "../components/Admin/adminUtils";
import type { AdminDashboardData } from "../types/admin";

type DashboardPeriod = "week" | "month" | "year";

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().slice(0, 10));
  const [unitId, setUnitId] = useState("all");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      params.set("anchorDate", anchorDate);
      if (unitId !== "all") {
        params.set("unitId", unitId);
      }

      const result = await adminClient.dashboard(params);
      setData(result);
      setError("");
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not load dashboard.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [anchorDate, period, unitId]);

  const handleSync = async (): Promise<void> => {
    setSyncing(true);
    try {
      await adminClient.syncReservations({});
      await load();
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not sync reservations.");
      }
    } finally {
      setSyncing(false);
    }
  };

  const scopeLabel = useMemo(() => {
    if (!data) {
      return "";
    }

    return `${data.scope.period.charAt(0).toUpperCase() + data.scope.period.slice(1)} scope: ${data.scope.label}`;
  }, [data]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Overview</span>
          <h1>Dashboard</h1>
          <p>Track revenue, arrivals, balances, and source mix across weekly, monthly, and yearly scopes.</p>
        </div>
        <div className="admin-inline-actions">
          {data ? <span className="admin-calendar-header-badge">{scopeLabel}</span> : null}
          <button type="button" className="button primary" onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync reservations"}
          </button>
        </div>
      </div>

      <section className="admin-filter-bar admin-dashboard-filter-bar">
        <div className="admin-calendar-range-tabs" role="tablist" aria-label="Dashboard period">
          {(["week", "month", "year"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={period === option}
              className={`admin-calendar-range-tab ${period === option ? "active" : ""}`}
              onClick={() => setPeriod(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <label className="admin-dashboard-filter-field">
          <span>Anchor date</span>
          <input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} />
        </label>

        <label className="admin-dashboard-filter-field">
          <span>House</span>
          <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
            <option value="all">All houses</option>
            {data?.filters.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-dashboard-filter-copy">
          <strong>{data?.scope.label ?? "Current scope"}</strong>
          <span>{data ? `${data.scope.startDate} to ${data.scope.endDate}` : "Choose a period and anchor date."}</span>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="muted">Loading dashboard...</p> : null}

      {data ? (
        <>
          <section className="admin-kpi-grid">
            {data.kpis.map((kpi) => (
              <article key={kpi.key} className={`admin-kpi-card ${kpi.key}`}>
                <p>{kpi.label}</p>
                <strong>{kpi.displayValue}</strong>
                <span>{kpi.meta}</span>
              </article>
            ))}
          </section>

          <section className="admin-analytics-grid primary">
            <AdminDonutChart
              title="Payment mix"
              subtitle={`Outstanding ${formatMoney(data.analytics.paymentMix.outstandingTotal)} within ${data.scope.label}`}
              items={data.analytics.paymentMix.items}
            />
            <AdminBarsChart
              title="Arrivals timeline"
              subtitle={`${data.analytics.arrivalPace.totalArrivals} arrivals across ${data.scope.label}`}
              points={data.analytics.arrivalPace.days}
            />
          </section>

          <section className="admin-analytics-grid secondary">
            <AdminHorizontalBars
              title="Unit performance"
              subtitle="Revenue, balance, and average stay for the current scope"
              items={data.analytics.unitPerformance}
            />
            <AdminChannelList
              title="Source mix"
              subtitle={`${data.analytics.channelMix.totalReservations} mirrored stays in ${data.scope.label}`}
              items={data.analytics.channelMix.items}
            />
          </section>

          <section className="admin-grid two-up">
            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Recent unpaid bookings</h2>
                <Link to="/admin/payments">View all</Link>
              </div>
              <div className="admin-record-list">
                {data.recentUnpaidBookings.map((booking) => (
                  <Link key={booking.reservationId} className="admin-record-row" to={`/admin/bookings/${booking.reservationId}`}>
                    <div className="admin-record-main">
                      <strong>{booking.guestName || booking.bookingReference || booking.reservationId}</strong>
                      <p>{booking.unitName || "Unknown unit"} / {booking.channelName || "Unknown source"}</p>
                    </div>
                    <div className="admin-record-meta">
                      <div>
                        <span>Stay</span>
                        <strong>{formatDateRange(booking.arrivalDate, booking.departureDate)}</strong>
                      </div>
                      <div>
                        <span>Due</span>
                        <strong>{formatMoney(booking.balanceDue)}</strong>
                      </div>
                      <div>
                        <span>Total</span>
                        <strong>{formatMoney(booking.priceTotal)}</strong>
                      </div>
                      <span className={`admin-pill ${booking.paymentState}`}>{paymentStateLabel(booking.paymentState)}</span>
                    </div>
                  </Link>
                ))}
                {data.recentUnpaidBookings.length === 0 ? <p className="muted">No unpaid bookings in this scope.</p> : null}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header">
                <h2>Recent submissions</h2>
                <Link to="/admin/submissions">View all</Link>
              </div>
              <div className="admin-record-list">
                {data.recentSubmissions.map((submission) => (
                  <div key={submission.id} className="admin-record-row">
                    <div className="admin-record-main">
                      <strong>{submission.guestName || submission.guestEmail || `Submission #${submission.id}`}</strong>
                      <p>{submission.unitName || "Unknown stay"} / {formatDateRange(submission.checkIn, submission.checkOut)}</p>
                    </div>
                    <div className="admin-record-meta compact">
                      <div>
                        <span>Payment</span>
                        <strong>{submission.paymentMethod || "-"}</strong>
                      </div>
                      <div>
                        <span>Created</span>
                        <strong>{formatDate(submission.createdAt)}</strong>
                      </div>
                      <span className={`admin-pill ${submission.outcome}`}>{submission.outcome}</span>
                    </div>
                  </div>
                ))}
                {data.recentSubmissions.length === 0 ? <p className="muted">No submissions in this scope.</p> : null}
              </div>
            </article>
          </section>

          <article className="admin-panel">
            <div className="admin-panel-header">
              <h2>Sync health</h2>
            </div>
            <div className="admin-sync-grid">
              <div>
                <p>Last webhook</p>
                <strong>{formatDate(data.syncHealth.lastWebhookAt)}</strong>
              </div>
              <div>
                <p>Last bulk sync</p>
                <strong>{formatDate(data.syncHealth.lastBulkSyncAt)}</strong>
              </div>
              <div>
                <p>Last mirror sync</p>
                <strong>{formatDate(data.syncHealth.lastMirrorSyncAt)}</strong>
              </div>
              <div>
                <p>Mirrored bookings</p>
                <strong>{data.syncHealth.mirroredBookingCount}</strong>
              </div>
            </div>
          </article>
        </>
      ) : null}
    </div>
  );
}
