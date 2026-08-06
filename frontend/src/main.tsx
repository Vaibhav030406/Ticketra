import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AttendeeLandingPage from "./pages/attendee-landing-page.tsx";
import { AuthProvider } from "react-oidc-context";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import DashboardManageEventPage from "./pages/dashboard-manage-event-page.tsx";
import DashboardEventAnalyticsPage from "./pages/dashboard-event-analytics-page.tsx";
import LoginPage from "./pages/login-page.tsx";
import RegisterPage from "./pages/register-page.tsx";
import ProtectedRoute from "./components/protected-route.tsx";
import CallbackPage from "./pages/callback-page.tsx";
import DashboardListEventsPage from "./pages/dashboard-list-events-page.tsx";
import PublishedEventsPage from "./pages/published-events-page.tsx";
import PurchaseTicketPage from "./pages/purchase-ticket-page.tsx";
import DashboardListTickets from "./pages/dashboard-list-tickets.tsx";
import DashboardPage from "./pages/dashboard-page.tsx";
import DashboardViewTicketPage from "./pages/dashboard-view-ticket-page.tsx";
import DashboardValidateQrPage from "./pages/dashboard-validate-qr-page.tsx";
import DashboardLayout from "./components/dashboard-layout.tsx";

const DashboardLayoutWrapper = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </ProtectedRoute>
);

const router = createBrowserRouter([
  {
    path: "/",
    Component: AttendeeLandingPage,
  },
  {
    path: "/callback",
    Component: CallbackPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/events/:id",
    Component: PublishedEventsPage,
  },
  {
    path: "/events/:eventId/purchase/:ticketTypeId",
    element: (
      <ProtectedRoute>
        <PurchaseTicketPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: <DashboardLayoutWrapper />,
    children: [
      {
        index: true,
        Component: DashboardPage,
      },
      {
        path: "events",
        Component: DashboardListEventsPage,
      },
      {
        path: "events/create",
        Component: DashboardManageEventPage,
      },
      {
        path: "events/update/:id",
        Component: DashboardManageEventPage,
      },
      {
        // Organizer-only analytics page — the page itself redirects non-organizers.
        path: "events/:id/analytics",
        Component: DashboardEventAnalyticsPage,
      },
      {
        path: "tickets",
        Component: DashboardListTickets,
      },
      {
        path: "tickets/:id",
        Component: DashboardViewTicketPage,
      },
      {
        path: "validate-qr",
        Component: DashboardValidateQrPage,
      },
    ],
  },
]);

const oidcConfig = {
  authority: "http://localhost:9090/realms/event-ticket-platform",
  client_id: "event-ticket-platform-app",
  redirect_uri: "http://localhost:5173/callback",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
