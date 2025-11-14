import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({ children, redirectTo = "/home" }: PublicRouteProps) => {
  const { user, loading, isAdmin, adminCheckComplete } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && adminCheckComplete) {
      // Redirect admin to admin dashboard, regular users to home
      const destination = isAdmin ? "/admin" : redirectTo;
      navigate(destination, { replace: true });
    }
  }, [user, loading, isAdmin, adminCheckComplete, navigate, redirectTo]);

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

  if (user && adminCheckComplete) {
    return null;
  }

  return <>{children}</>;
};
