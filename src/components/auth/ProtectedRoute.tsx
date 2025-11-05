import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasCompletedOnboarding } from "@/utils/recommendations";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to finish loading
      if (loading) return;

      // Redirect to signin if not authenticated
      if (!user) {
        navigate("/signin", { replace: true });
        return;
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
  }, [user, loading, navigate, location.pathname]);

  if (loading || checkingOnboarding) {
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

  return <>{children}</>;
};
