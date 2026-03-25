import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminClient } from "../../api/adminClient";
import { useAdminStore } from "../../store/adminStore";
import { assetUrl } from "../../config";

function AdminIcon({ name }: { name: "dashboard" | "submissions" | "bookings" | "calendar" | "payments" }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h7v7H4V4Zm9 0h7v11h-7V4ZM4 13h7v7H4v-7Zm9 4h7v3h-7v-3Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "submissions") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h12l2 3v13H4V7l2-3Zm1 4v10h10V8H7Zm2 2h6v2H9v-2Zm0 4h6v2H9v-2Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "bookings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 2h2v2h6V2h2v2h3v17H4V4h3V2Zm11 8H6v9h12v-9Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h2v2h6V3h2v2h3v16H4V5h3V3Zm11 8H6v8h12v-8Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 4h-2v6h5v-2h-3V7Z" fill="currentColor" />
    </svg>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.5 2a8.5 8.5 0 1 0 7.5 12.49A9.5 9.5 0 1 1 14.5 2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0-4h1v3h-2V1h1Zm0 19h1v3h-2v-3h1Zm11-9v2h-3v-2h3ZM4 12v1H1v-2h3v1Zm15.07-7.07 1.41 1.41-2.12 2.12-1.41-1.41 2.12-2.12ZM7.05 16.95l1.41 1.41-2.12 2.12-1.41-1.41 2.12-2.12Zm11.43 2.83-1.41 1.41-2.12-2.12 1.41-1.41 2.12 2.12ZM8.46 7.05 7.05 8.46 4.93 6.34l1.41-1.41 2.12 2.12Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = useAdminStore((state) => state.admin);
  const theme = useAdminStore((state) => state.theme);
  const setAdmin = useAdminStore((state) => state.setAdmin);
  const clearAdmin = useAdminStore((state) => state.clearAdmin);
  const toggleTheme = useAdminStore((state) => state.toggleTheme);
  const [loading, setLoading] = useState(admin === null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (admin) {
      setLoading(false);
      return;
    }

    let active = true;
    void adminClient
      .me()
      .then((data) => {
        if (!active) {
          return;
        }
        setAdmin(data.admin);
        setError("");
      })
      .catch(() => {
        if (!active) {
          return;
        }
        clearAdmin();
        navigate("/admin/login", {
          replace: true,
          state: { from: `${location.pathname}${location.search}` },
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [admin, clearAdmin, location.pathname, location.search, navigate, setAdmin]);

  const handleLogout = async (): Promise<void> => {
    try {
      await adminClient.logout();
    } finally {
      clearAdmin();
      navigate("/admin/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="admin-screen admin-loading-screen" data-theme={theme}>
        <div className="admin-loading-card">
          <h1>Loading admin console</h1>
          <p>Checking your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-screen" data-theme={theme}>
      <aside className="admin-sidebar">
        <NavLink to="/admin" end reloadDocument className="admin-brand admin-brand-link" aria-label="Forrest Glamp admin dashboard">
          <img src={assetUrl("/assets/images/forrest-logo.png")} alt="Forrest Glamp" className="admin-brand-logo" />
        </NavLink>

        <button type="button" className="admin-theme-toggle" onClick={toggleTheme}>
          <ThemeIcon dark={theme === "dark"} />
          <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
        </button>

        <nav className="admin-nav">
          <NavLink to="/admin" end reloadDocument className="admin-nav-link">
            <AdminIcon name="dashboard" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/submissions" reloadDocument className="admin-nav-link">
            <AdminIcon name="submissions" />
            <span>Submissions</span>
          </NavLink>
          <NavLink to="/admin/bookings" reloadDocument className="admin-nav-link">
            <AdminIcon name="bookings" />
            <span>Bookings</span>
          </NavLink>
          <NavLink to="/admin/calendar" reloadDocument className="admin-nav-link">
            <AdminIcon name="calendar" />
            <span>Calendar</span>
          </NavLink>
          <NavLink to="/admin/payments" reloadDocument className="admin-nav-link">
            <AdminIcon name="payments" />
            <span>Payments</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <p>Signed in as</p>
          <strong>{admin?.displayName ?? "Admin"}</strong>
          <button type="button" className="button ghost admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {error ? <p className="error-banner">{error}</p> : null}
        <div key={`${location.pathname}${location.search}`} className="admin-route-shell">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
