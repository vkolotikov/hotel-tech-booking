import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminClientError, adminClient } from "../api/adminClient";
import { useAdminStore } from "../store/adminStore";

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 2a8.5 8.5 0 1 0 7.5 12.49A9.5 9.5 0 1 1 14.5 2Z" fill="currentColor" />
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

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = useAdminStore((state) => state.admin);
  const theme = useAdminStore((state) => state.theme);
  const setAdmin = useAdminStore((state) => state.setAdmin);
  const toggleTheme = useAdminStore((state) => state.toggleTheme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (admin) {
      navigate("/admin", { replace: true });
    }
  }, [admin, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await adminClient.login(email, password);
      setAdmin(result.admin);
      const nextPath = typeof location.state === "object" && location.state !== null && "from" in location.state
        ? String((location.state as { from?: string }).from ?? "/admin")
        : "/admin";
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      if (requestError instanceof AdminClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-screen admin-auth-screen" data-theme={theme}>
      <div className="admin-auth-card">
        <div className="admin-auth-topbar">
          <div className="admin-auth-copy">
            <span className="admin-eyebrow">Forrest Glamp internal</span>
          </div>
          <button type="button" className="admin-theme-toggle auth" onClick={toggleTheme}>
            <ThemeIcon dark={theme === "dark"} />
            <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
          </button>
        </div>

        <div className="admin-auth-copy">
          <h1>Admin Console</h1>
          <p>Bookings, payments, submissions, and calendar in one place.</p>
        </div>

        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
