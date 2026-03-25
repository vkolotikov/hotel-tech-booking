/**
 * Detect the deployment base path from the <base> tag injected by the server,
 * or fall back to the <script> tag URL.  No app-level imports — safe from
 * circular-dependency issues.
 */
function detect(): string {
  // Prefer the <base href="…"> tag the PHP backend injects
  const baseEl = document.querySelector("base");
  if (baseEl?.href) {
    try {
      return new URL(baseEl.href).pathname.replace(/\/+$/, "");
    } catch {
      // ignore
    }
  }

  // Fallback: infer from the compiled script's resolved URL
  const scriptEl = document.querySelector('script[src*="/assets/index-"]');
  if (scriptEl) {
    const src = scriptEl.getAttribute("src") ?? "";
    try {
      const resolved = new URL(src, window.location.href);
      const base = resolved.pathname.replace(/\/assets\/.*$/, "");
      if (base && base !== "/") return base;
    } catch {
      // ignore
    }
  }

  return "";
}

/** Absolute path prefix for this deployment, e.g. "/hotel-tech/apps/booking/booking-app/backend" */
export const BASE_PATH = detect();

/** React Router basename — "/" for root, otherwise the detected base path */
export const ROUTER_BASENAME = BASE_PATH || "/";

/**
 * API root prefix — empty means API is at /api/v1 (same-domain root).
 * Override via VITE_API_BASE env var in production builds where the SPA
 * is served from a sub-path (e.g. /spa/) but the API is at the domain root.
 */
export const API_PREFIX: string =
  import.meta.env.VITE_API_BASE !== undefined
    ? (import.meta.env.VITE_API_BASE as string)
    : BASE_PATH;

/** Resolve a public-folder asset path (e.g. "/assets/images/logo.png") to the
 *  correct absolute URL for the current deployment. */
export function assetUrl(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
