import type { ApiErrorDetails } from "./api";

export interface AdminApiErrorPayload {
  code: string;
  message: string;
  details: ApiErrorDetails;
}

export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  lastLoginAt: string | null;
}

export type AdminTheme = "light" | "dark";

export interface AdminKpi {
  key: string;
  label: string;
  value: number;
  displayValue: string;
  meta: string;
}

export interface AdminSubmission {
  id: number;
  outcome: string;
  failureCode: string;
  failureMessage: string;
  bookingReference: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  unitId: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  grossTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface AdminBookingSummary {
  reservationId: string;
  bookingReference: string;
  bookingType: string;
  bookingState: string;
  unitId: string;
  unitName: string;
  channelName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestLanguage: string;
  arrivalDate: string;
  departureDate: string;
  checkInTime: string;
  checkOutTime: string;
  adults: number;
  children: number;
  priceTotal: number;
  pricePaid: number;
  balanceDue: number;
  prepaymentAmount: number;
  depositAmount: number;
  guestAppUrl: string;
  smoobuBackofficeUrl: string | null;
  notice: string;
  assistantNotice: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentState: string;
  internalStatus: string;
  invoiceState: string;
  sourceCreatedAt: string;
  sourceUpdatedAt: string;
  syncedAt: string;
  updatedAt: string;
  raw?: Record<string, unknown>;
}

export interface AdminPriceElement {
  id: number;
  remotePriceElementId: string;
  type: string;
  name: string;
  amount: number;
  quantity: number;
  tax: number;
  currencyCode: string;
  sortOrder: number;
}

export interface AdminNote {
  id: number;
  body: string;
  createdAt: string;
  authorName: string;
}

export interface AdminBookingDetail {
  booking: AdminBookingSummary;
  priceElements: AdminPriceElement[];
  submissions: AdminSubmission[];
  notes: AdminNote[];
}

export interface AdminDashboardData {
  scope: {
    period: "week" | "month" | "year";
    label: string;
    anchorDate: string;
    startDate: string;
    endDate: string;
  };
  filters: {
    activeUnitId: string;
    units: Array<{ id: string; name: string }>;
  };
  kpis: AdminKpi[];
  recentSubmissions: AdminSubmission[];
  recentUnpaidBookings: AdminBookingSummary[];
  analytics: {
    paymentMix: {
      totalReservations: number;
      outstandingTotal: number;
      items: Array<{
        key: string;
        label: string;
        value: number;
      }>;
    };
    arrivalPace: {
      rangeStart: string;
      rangeEnd: string;
      totalArrivals: number;
      days: Array<{
        date: string;
        label: string;
        value: number;
      }>;
    };
    channelMix: {
      totalReservations: number;
      items: Array<{
        label: string;
        value: number;
      }>;
    };
    unitPerformance: Array<{
      unitId: string;
      unitName: string;
      bookingCount: number;
      revenue: number;
      balanceDue: number;
      averageStayNights: number;
    }>;
  };
  syncHealth: {
    lastWebhookAt: string | null;
    lastBulkSyncAt: string | null;
    lastMirrorSyncAt: string | null;
    mirroredBookingCount: number;
  };
}

export interface AdminBookingListData {
  items: AdminBookingSummary[];
  filters: {
    units: Array<{ id: string; name: string }>;
  };
}

export interface AdminSubmissionListData {
  items: AdminSubmission[];
}

export interface AdminPaymentsData {
  items: AdminBookingSummary[];
}

export interface AdminCalendarBooking {
  reservationId: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  bookingState: string;
  internalStatus: string;
  paymentState: string;
}

export interface AdminCalendarUnit {
  unitId: string;
  unitName: string;
  days: string[];
  bookings: AdminCalendarBooking[];
}

export interface AdminCalendarData {
  month: string;
  days: string[];
  units: AdminCalendarUnit[];
}

export interface AdminSyncResult {
  syncedCount: number;
  lastSyncedAt: string;
}
