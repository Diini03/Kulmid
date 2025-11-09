import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import OurStory from "./pages/OurStory";
import Achievements from "./pages/Achievements";
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
import MyEvents from "./pages/MyEvents";

const queryClient = new QueryClient();

// Short URL Redirect Component - redirects to standalone event view
const ShortEventRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/event/${id}`} replace />;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <FavoritesProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Public Routes - Redirect to /home if logged in */}
                  <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Onboarding - Protected but bypasses onboarding check */}
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  
                  {/* Footer Pages - Always accessible */}
                  <Route path="/about" element={<About />} />
                  <Route path="/our-story" element={<OurStory />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/our-team" element={<OurTeam />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Protected Routes - Require authentication */}
                  <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  
                  {/* Public Routes - Anyone can browse events */}
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetails />} />
                  
                  {/* Standalone Event View - No layout, clean shareable page */}
                  <Route path="/event/:id" element={<EventView />} />
                  <Route path="/e/:id" element={<ShortEventRedirect />} />
                  
                  <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                  <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
                  <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </ThemeProvider>
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;