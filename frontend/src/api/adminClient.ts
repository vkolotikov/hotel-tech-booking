import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "../types/api";
import { API_PREFIX } from "../config";
import type {
  AdminApiErrorPayload,
  AdminBookingDetail,
  AdminBookingListData,
  AdminCalendarData,
  AdminDashboardData,
  AdminPaymentsData,
  AdminSubmissionListData,
  AdminSyncResult,
  AdminUser,
} from "../types/admin";

export class AdminClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly error: AdminApiErrorPayload,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_PREFIX}/api/v1/admin${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  const body = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
  if (!response.ok || !body.success) {
    const errorPayload = !body.success
      ? body.error
      : { code: "http_error", message: "Request failed.", details: [] };
    throw new AdminClientError(errorPayload.message, response.status, errorPayload);
  }

  return body.data;
}

export const adminClient = {
  login(email: string, password: string): Promise<{ admin: AdminUser }> {
    return request<{ admin: AdminUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout(): Promise<{ loggedOut: boolean }> {
    return request<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
  },

  me(): Promise<{ admin: AdminUser }> {
    return request<{ admin: AdminUser }>("/auth/me");
  },

  dashboard(params?: URLSearchParams): Promise<AdminDashboardData> {
    const suffix = params?.toString() ?? "";
    return request<AdminDashboardData>(`/dashboard${suffix ? `?${suffix}` : ""}`);
  },

  submissions(params: URLSearchParams): Promise<AdminSubmissionListData> {
    const suffix = params.toString();
    return request<AdminSubmissionListData>(`/submissions${suffix ? `?${suffix}` : ""}`);
  },

  bookings(params: URLSearchParams): Promise<AdminBookingListData> {
    const suffix = params.toString();
    return request<AdminBookingListData>(`/bookings${suffix ? `?${suffix}` : ""}`);
  },

  bookingDetail(reservationId: string): Promise<AdminBookingDetail> {
    return request<AdminBookingDetail>(`/bookings/${encodeURIComponent(reservationId)}`);
  },

  refreshBooking(reservationId: string): Promise<AdminBookingDetail> {
    return request<AdminBookingDetail>(`/bookings/${encodeURIComponent(reservationId)}/refresh`, {
      method: "POST",
    });
  },

  addBookingNote(reservationId: string, body: string): Promise<AdminBookingDetail> {
    return request<AdminBookingDetail>(`/bookings/${encodeURIComponent(reservationId)}/notes`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },

  updateBookingOps(
    reservationId: string,
    payload: { internalStatus: string; invoiceState: string },
  ): Promise<AdminBookingDetail> {
    return request<AdminBookingDetail>(`/bookings/${encodeURIComponent(reservationId)}/ops`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  calendar(month: string): Promise<AdminCalendarData> {
    return request<AdminCalendarData>(`/calendar?month=${encodeURIComponent(month)}`);
  },

  payments(params: URLSearchParams): Promise<AdminPaymentsData> {
    const suffix = params.toString();
    return request<AdminPaymentsData>(`/payments${suffix ? `?${suffix}` : ""}`);
  },

  syncReservations(payload: {
    from?: string;
    to?: string;
    createdFrom?: string;
    createdTo?: string;
  }): Promise<AdminSyncResult> {
    return request<AdminSyncResult>("/sync/reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
