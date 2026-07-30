import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PendingActionsProvider } from "@/contexts/PendingActionsContext";
import { AdminBadgesProvider } from "@/contexts/AdminBadgesContext";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { lazy, Suspense } from "react";

import Welcome from "./pages/Welcome";
import Discover from "./pages/Discover";
import NotFound from "./pages/NotFound";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";

// Lazy-loaded pages
const HomePage = lazy(() => import("./pages/HomePage"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const EventView = lazy(() => import("./pages/EventView"));
const Favorites = lazy(() => import("./pages/Favorites"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const Create = lazy(() => import("./pages/Create"));
const EventBuilder = lazy(() => import("./pages/EventBuilder"));
const EventScanner = lazy(() => import("./pages/EventScanner"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const SystemDocumentation = lazy(() => import("./pages/SystemDocumentation"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const Profile = lazy(() => import("./pages/Profile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const CancelRegistration = lazy(() => import("./pages/CancelRegistration"));

// Admin pages
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminEventModeration = lazy(() => import("./pages/admin/AdminEventModeration"));
const AdminAllEvents = lazy(() => import("./pages/admin/AdminAllEvents"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRegistrations = lazy(() => import("./pages/admin/AdminRegistrations"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminPlatformSettings = lazy(() => import("./pages/admin/AdminPlatformSettings"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// Short URL Redirect Component
const ShortEventRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/event/${id}`} replace />;
};

// Legacy profile URL — looks up username and redirects to /u/:username
const LegacyProfileRedirect = () => {
  const { userId } = useParams();
  return <Navigate to={`/u/lookup/${userId}`} replace />;
};

// Persistent layout wrapper
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
        <LanguageProvider>
        <AuthProvider>
          <NotificationsProvider>
            <PendingActionsProvider>
              <AdminBadgesProvider>
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
                    <Route path="/discover/:id" element={<SuspenseWrapper><EventDetails /></SuspenseWrapper>} />
                    
                    {/* Footer Pages */}
                    <Route path="/about" element={<SuspenseWrapper><About /></SuspenseWrapper>} />
                    <Route path="/our-story" element={<Navigate to="/about" replace />} />
                    <Route path="/achievements" element={<Navigate to="/contact" replace />} />
                    <Route path="/our-team" element={<Navigate to="/about" replace />} />
                    <Route path="/team" element={<Navigate to="/about" replace />} />
                    <Route path="/contact" element={<SuspenseWrapper><Contact /></SuspenseWrapper>} />
                    <Route path="/help" element={<SuspenseWrapper><Help /></SuspenseWrapper>} />
                    <Route path="/guide" element={<Navigate to="/about" replace />} />
                    <Route path="/pricing" element={<SuspenseWrapper><Pricing /></SuspenseWrapper>} />
                    <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
                    <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
                    
                    {/* Protected User Routes */}
                    <Route path="/home" element={<ProtectedRoute><SuspenseWrapper><HomePage /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/events" element={<SuspenseWrapper><Events /></SuspenseWrapper>} />
                    <Route path="/events/:id" element={<ProtectedRoute><SuspenseWrapper><EventDetails /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><SuspenseWrapper><Favorites /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><SuspenseWrapper><CalendarView /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><SuspenseWrapper><Create /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/event/:id/builder" element={<ProtectedRoute><SuspenseWrapper><EventBuilder /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/events/:id/manage" element={<ProtectedRoute><SuspenseWrapper><EventBuilder /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SuspenseWrapper><Settings /></SuspenseWrapper></ProtectedRoute>} />
                    <Route path="/u/:username" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
                    <Route path="/u/lookup/:userId" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
                    <Route path="/profile/:userId" element={<LegacyProfileRedirect />} />
                  </Route>

                  {/* Routes WITHOUT Layout */}
                  <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<ProtectedRoute><SuspenseWrapper><Onboarding /></SuspenseWrapper></ProtectedRoute>} />
                  
                  {/* Standalone Event View - No layout */}
                  <Route path="/event/:id" element={<SuspenseWrapper><EventView /></SuspenseWrapper>} />
                  <Route path="/e/:id" element={<ShortEventRedirect />} />
                  <Route path="/check-in/:token" element={<SuspenseWrapper><CheckIn /></SuspenseWrapper>} />
                  <Route path="/r/cancel/:token" element={<SuspenseWrapper><CancelRegistration /></SuspenseWrapper>} />
                  
                  <Route path="/event/:eventId/scanner" element={<ProtectedRoute><SuspenseWrapper><EventScanner /></SuspenseWrapper></ProtectedRoute>} />
                  <Route path="/my-events" element={<Navigate to="/events" replace />} />

                  {/* Admin Routes - Fully separated interface */}
                  <Route element={<AdminLayoutRoute />}>
                    <Route path="/admin" element={<SuspenseWrapper><AdminOverview /></SuspenseWrapper>} />
                    <Route path="/admin/events/pending" element={<SuspenseWrapper><AdminEventModeration /></SuspenseWrapper>} />
                    <Route path="/admin/events" element={<SuspenseWrapper><AdminAllEvents /></SuspenseWrapper>} />
                    <Route path="/admin/users" element={<SuspenseWrapper><AdminUsersPage /></SuspenseWrapper>} />
                    <Route path="/admin/registrations" element={<SuspenseWrapper><AdminRegistrations /></SuspenseWrapper>} />
                    <Route path="/admin/categories" element={<SuspenseWrapper><AdminCategories /></SuspenseWrapper>} />
                    <Route path="/admin/analytics" element={<SuspenseWrapper><AdminAnalytics /></SuspenseWrapper>} />
                    <Route path="/admin/reports" element={<SuspenseWrapper><AdminReports /></SuspenseWrapper>} />
                    <Route path="/admin/audit" element={<SuspenseWrapper><AdminAuditLog /></SuspenseWrapper>} />
                    <Route path="/admin/settings/platform" element={<SuspenseWrapper><AdminPlatformSettings /></SuspenseWrapper>} />
                    <Route path="/admin/settings/admin" element={<SuspenseWrapper><AdminSettingsPage /></SuspenseWrapper>} />
                    <Route path="/admin/settings" element={<Navigate to="/admin/settings/platform" replace />} />
                  </Route>

                  <Route path="/system-docs" element={<SuspenseWrapper><SystemDocumentation /></SuspenseWrapper>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </TooltipProvider>
              </ThemeProvider>
            </FavoritesProvider>
              </AdminBadgesProvider>
          </PendingActionsProvider>
        </NotificationsProvider>
      </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
