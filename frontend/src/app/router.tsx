import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/Admin/AdminLayout";
import { AdminBookingDetailPage } from "../pages/AdminBookingDetailPage";
import { AdminBookingsPage } from "../pages/AdminBookingsPage";
import { AdminCalendarPage } from "../pages/AdminCalendarPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminPaymentsPage } from "../pages/AdminPaymentsPage";
import { AdminSubmissionsPage } from "../pages/AdminSubmissionsPage";
import { SearchPage } from "../pages/SearchPage";
import { ExtrasPage } from "../pages/ExtrasPage";
import { ReviewPage } from "../pages/ReviewPage";
import { SuccessPage } from "../pages/SuccessPage";
import { ROUTER_BASENAME } from "../config";

export const router = createBrowserRouter([
  { path: "/", element: <SearchPage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "submissions", element: <AdminSubmissionsPage /> },
      { path: "bookings", element: <AdminBookingsPage /> },
      { path: "bookings/:reservationId", element: <AdminBookingDetailPage /> },
      { path: "calendar", element: <AdminCalendarPage /> },
      { path: "payments", element: <AdminPaymentsPage /> },
    ],
  },
  { path: "/extras", element: <ExtrasPage /> },
  { path: "/review", element: <ReviewPage /> },
  { path: "/success", element: <SuccessPage /> },
  { path: "/results", element: <Navigate to="/" replace /> },
  { path: "/unit/:id", element: <Navigate to="/" replace /> },
  { path: "/guest", element: <Navigate to="/review" replace /> },
  { path: "*", element: <Navigate to="/" replace /> },
], { basename: ROUTER_BASENAME });


