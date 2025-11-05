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
    if (!loading && !user) {
      navigate("/signin", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!loading && user && location.pathname !== "/onboarding") {
        const completed = await hasCompletedOnboarding(user.id);
        if (!completed) {
          navigate("/onboarding", { replace: true });
        }
      }
      setCheckingOnboarding(false);
    };

    checkOnboarding();
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
