import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PendingActionsProvider } from "@/contexts/PendingActionsContext";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { lazy, Suspense } from "react";

import Welcome from "./pages/Welcome";
import HomePage from "./pages/HomePage";
import Discover from "./pages/Discover";
import NotFound from "./pages/NotFound";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import EventView from "./pages/EventView";
import Favorites from "./pages/Favorites";
import About from "./pages/About";
import OurTeam from "./pages/OurTeam";
import Contact from "./pages/Contact";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
const Onboarding = lazy(() => import("./pages/Onboarding"));

import CalendarView from "./pages/CalendarView";
import Create from "./pages/Create";
import EventBuilder from "./pages/EventBuilder";
import EventScanner from "./pages/EventScanner";
import SystemDocumentation from "./pages/SystemDocumentation";
import Settings from "./pages/Settings";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminEventModeration from "./pages/admin/AdminEventModeration";
import AdminAllEvents from "./pages/admin/AdminAllEvents";
import AdminUsersPage from "./pages/admin/AdminUsers";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReports from "./pages/admin/AdminReports";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import Help from "./pages/Help";
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

// Short URL Redirect Component - redirects to standalone event view
const ShortEventRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/event/${id}`} replace />;
};

// Persistent layout wrapper - Layout stays mounted across route changes
const LayoutRoute = () => (
  <Layout>
    <Outlet />
  </Layout>
);

// Admin layout wrapper with route protection
const AdminLayoutRoute = () => (
  <AdminRoute>
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  </AdminRoute>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <PendingActionsProvider>
              <FavoritesProvider>
                <ThemeProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                <Routes>
                  {/* Routes WITH persistent Layout (User interface) */}
                  <Route element={<LayoutRoute />}>
                    {/* Public Routes */}
                    <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/discover/:id" element={<EventDetails />} />
                    
                    {/* Footer Pages */}
                    <Route path="/about" element={<About />} />
                    <Route path="/our-story" element={<Navigate to="/about" replace />} />
                    <Route path="/achievements" element={<Navigate to="/contact" replace />} />
                    <Route path="/our-team" element={<OurTeam />} />
                    <Route path="/team" element={<OurTeam />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/help" element={<Help />} />
                    
                    {/* Protected User Routes */}
                    <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                    <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
                    <Route path="/event/:id/builder" element={<ProtectedRoute><EventBuilder /></ProtectedRoute>} />
                    <Route path="/events/:id/manage" element={<ProtectedRoute><EventBuilder /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/profile/:userId" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Profile /></Suspense>} />
                  </Route>

                  {/* Routes WITHOUT Layout */}
                  <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><Onboarding /></Suspense></ProtectedRoute>} />
                  
                  {/* Standalone Event View - No layout */}
                  <Route path="/event/:id" element={<EventView />} />
                  <Route path="/e/:id" element={<ShortEventRedirect />} />
                  
                  <Route path="/event/:eventId/scanner" element={<ProtectedRoute><EventScanner /></ProtectedRoute>} />
                  <Route path="/my-events" element={<Navigate to="/events" replace />} />

                  {/* Admin Routes - Fully separated interface */}
                  <Route element={<AdminLayoutRoute />}>
                    <Route path="/admin" element={<AdminOverview />} />
                    <Route path="/admin/events/pending" element={<AdminEventModeration />} />
                    <Route path="/admin/events" element={<AdminAllEvents />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/registrations" element={<AdminRegistrations />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/settings/platform" element={<AdminPlatformSettings />} />
                    <Route path="/admin/settings/admin" element={<AdminSettingsPage />} />
                    <Route path="/admin/settings" element={<Navigate to="/admin/settings/platform" replace />} />
                  </Route>

                  <Route path="/system-docs" element={<SystemDocumentation />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </TooltipProvider>
              </ThemeProvider>
            </FavoritesProvider>
          </PendingActionsProvider>
        </NotificationsProvider>
      </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
