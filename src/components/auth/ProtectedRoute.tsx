import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasCompletedOnboarding } from "@/utils/recommendations";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, adminCheckComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (loading || !adminCheckComplete) return;

      if (!user) {
        navigate("/signin", { replace: true });
        return;
      }

      // Admins should not access user routes — redirect to admin panel
      if (isAdmin) {
        return; // handled by render below
      }

      // Skip onboarding check if already on onboarding page
      if (location.pathname === "/onboarding") {
        setCheckingOnboarding(false);
        return;
      }

      // Check if user has completed onboarding
      try {
        const completed = await hasCompletedOnboarding(user.id);
        if (!completed) {
          navigate("/onboarding", { replace: true });
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkAuth();
  }, [user, loading, isAdmin, adminCheckComplete, navigate, location.pathname]);

  if (loading || !adminCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Redirect admins to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
