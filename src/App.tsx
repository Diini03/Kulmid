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
import { lazy, Suspense } from "react";

import Welcome from "./pages/Welcome";
import HomePage from "./pages/HomePage";
import Discover from "./pages/Discover";
import NotFound from "./pages/NotFound";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
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
import UserDashboard from "./pages/UserDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import CalendarView from "./pages/CalendarView";
import Create from "./pages/Create";
// MyEvents removed - merged into Events page (v2.0)
import AdminAnalytics from "./pages/AdminAnalytics";
import EventBuilder from "./pages/EventBuilder";
import EventScanner from "./pages/EventScanner";
import SystemDocumentation from "./pages/SystemDocumentation";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
const Profile = lazy(() => import("./pages/Profile"));
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

// Short URL Redirect Component - redirects to standalone event view
const ShortEventRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/event/${id}`} replace />;
};

// Wrapper component to redirect admins from user routes
const UserOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, adminCheckComplete } = useAuth();
  
  if (!adminCheckComplete) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

// Persistent layout wrapper - Layout stays mounted across route changes
const LayoutRoute = () => (
  <Layout>
    <Outlet />
  </Layout>
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
                  {/* Routes WITH persistent Layout */}
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
                    
                    {/* Protected Routes */}
                    <Route path="/home" element={<ProtectedRoute><UserOnlyRoute><HomePage /></UserOnlyRoute></ProtectedRoute>} />
                    <Route path="/events" element={<UserOnlyRoute><Events /></UserOnlyRoute>} />
                    <Route path="/events/:id" element={<UserOnlyRoute><EventDetails /></UserOnlyRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><UserOnlyRoute><Favorites /></UserOnlyRoute></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><UserOnlyRoute><UserDashboard /></UserOnlyRoute></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><UserOnlyRoute><CalendarView /></UserOnlyRoute></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><UserOnlyRoute><Create /></UserOnlyRoute></ProtectedRoute>} />
                    <Route path="/event/:id/builder" element={<ProtectedRoute><EventBuilder /></ProtectedRoute>} />
                    <Route path="/events/:id/manage" element={<ProtectedRoute><EventBuilder /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><UserOnlyRoute><Settings /></UserOnlyRoute></ProtectedRoute>} />
                  </Route>

                  {/* Routes WITHOUT Layout */}
                  <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  
                  {/* Standalone Event View - No layout */}
                  <Route path="/event/:id" element={<UserOnlyRoute><EventView /></UserOnlyRoute>} />
                  <Route path="/e/:id" element={<ShortEventRedirect />} />
                  
                  <Route path="/event/:eventId/scanner" element={<ProtectedRoute><EventScanner /></ProtectedRoute>} />
                  <Route path="/my-events" element={<Navigate to="/events" replace />} />
                  <Route path="/admin" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
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